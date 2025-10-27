import { lockManager } from '../../../../src/store/locks';
import { DiscoverQueryDTOType } from '../../../dtos/inbound/discovery-params.dto';
import { ApiError } from '../../../utils/errors/errors';
import logger from '../../../utils/logger/logger';
import { Booking } from '../../shared/models/models';
import { IRepository } from '../../shared/respositories/wokibrain.repository';
import {
  ITablesService,
  TableAvailability,
} from '../../tables/services/tables.service';
import {
  AlgorithmType,
  DiscoveryAlgorithmFactory,
  IDiscoveryAlgorithm,
} from '../factory/discovery-algorithm.factory';
import { Candidate } from '../interfaces/discovery-algorithm';
import { idempotencyService } from './idempotency.service';

export interface IBookingService {
  findCandidates(
    params: DiscoverQueryDTOType,
    tables: TableAvailability[]
  ): Promise<Candidate[]>;

  getBookingsByDay(
    restaurantId: string,
    sectorId: string,
    day: string
  ): Promise<Booking[]>;

  createBookingAtomic(
    bookingData: any,
    idempotencyKey?: string
  ): Promise<Booking>;

  deleteBooking(bookingId: string): void;
}

// This should be declred as a application in the real app,
// that uses multiple services including BookingService.
export class BookingService implements IBookingService {
  private algorithm: IDiscoveryAlgorithm;

  constructor(
    private readonly repository: IRepository,
    private readonly tablesService: ITablesService, // This should be declared as dependency
    algorithmType: AlgorithmType = 'bins'
  ) {
    this.algorithm = DiscoveryAlgorithmFactory.create(algorithmType);
  }

  async findCandidates(
    params: DiscoverQueryDTOType,
    tables: TableAvailability[]
  ): Promise<Candidate[]> {
    return this.algorithm.findCandidates(params, tables);
  }

  public async getBookingsByDay(
    restaurantId: string,
    sectorId: string,
    day: string
  ): Promise<Booking[]> {
    const bookings = this.repository
      .getBookings()
      .filter(
        b =>
          b.restaurantId === restaurantId &&
          (sectorId ? b.sectorId === sectorId : true) &&
          (day ? b.start.startsWith(day) : true)
      );
    return bookings;
  }

  public deleteBooking(bookingId: string): void {
    const booking = this.repository.getBookings().find(b => b.id === bookingId);

    if (!booking) {
      throw new Error('Booking not found');
    }

    this.repository.cancelBooking(bookingId);
  }

  private timeToMinutes(hhmm: string): number {
    const [hh, mm] = hhmm.split(':').map(Number);
    return hh * 60 + mm;
  }

  /**
   * Atomically create a booking ensuring:
   * - Restaurant & sector exist
   * - Service window validity
   * - Sector capacity
   * - Idempotency (duplicate prevention)
   * - Locking (collision prevention)
   */
  public async createBookingAtomic(
    bookingData: {
      restaurantId: string;
      sectorId: string;
      partySize: number;
      durationMinutes: number;
      date: string;
      windowStart: string;
      windowEnd: string;
    },
    idempotencyKey?: string
  ): Promise<Booking> {
    // --- 1. Validate restaurant & sector ---
    const restaurant = this.repository.getRestaurantById(
      bookingData.restaurantId
    );
    if (!restaurant) throw ApiError.notFound('Restaurant not found');

    const sector = await this.repository.getSectorById(bookingData.sectorId);
    if (!sector) throw ApiError.notFound('Sector not found');

    // --- 2. Validate service window ---
    const windows: Array<{ start: string; end: string }> =
      restaurant.windows || [];
    if (windows.length > 0) {
      const startMin = this.timeToMinutes(bookingData.windowStart);
      const endMin = this.timeToMinutes(bookingData.windowEnd);

      const inside = windows.some(w => {
        const wStart = this.timeToMinutes(w.start);
        const wEnd = this.timeToMinutes(w.end);
        return startMin >= wStart && endMin <= wEnd;
      });

      if (!inside) throw ApiError.outsideServiceWindow();
    }

    // --- 3. Early idempotency check ---
    if (idempotencyKey) {
      const existing = await idempotencyService.checkExisting(idempotencyKey);
      if (existing) {
        logger.error(
          `Duplicate request detected for idempotency key ${idempotencyKey}`
        );
        throw ApiError.conflict('Duplicate request detected');
      }
    }

    // --- 4. Acquire lock ---
    const startISO = new Date(
      `${bookingData.date}T${bookingData.windowStart}:00`
    ).toISOString();
    const endISO = new Date(
      `${bookingData.date}T${bookingData.windowEnd}:00`
    ).toISOString();
    const lockKey = `${bookingData.restaurantId}|${bookingData.sectorId ?? ''}|${startISO}`;

    const release = await lockManager.acquire(lockKey);
    try {
      // --- 5. Check idempotency again after lock ---
      if (idempotencyKey) {
        const alreadyUsed =
          await idempotencyService.checkExisting(idempotencyKey);
        if (alreadyUsed) {
          logger.error(
            `Duplicate request detected for idempotency key ${idempotencyKey}`
          );
          throw ApiError.conflict('Duplicate request detected');
        }
      }

      // --- 6. Capacity check using discovery algorithm ---
      // Build table availability via TablesService and run discovery to see if any candidate fits
      const tableAvail: TableAvailability[] =
        await this.tablesService.getAllAvailableTables(
          bookingData.restaurantId,
          bookingData.sectorId,
          bookingData.date,
          bookingData.partySize,
          bookingData.durationMinutes,
          bookingData.windowStart,
          bookingData.windowEnd
        );

      const params: DiscoverQueryDTOType = {
        restaurantId: bookingData.restaurantId,
        sectorId: bookingData.sectorId,
        date: bookingData.date,
        partySize: bookingData.partySize,
        duration: bookingData.durationMinutes,
        windowStart: bookingData.windowStart,
        windowEnd: bookingData.windowEnd,
        limit: undefined,
      };

      const candidates = await this.findCandidates(params, tableAvail);
      if (!candidates || candidates.length === 0) {
        throw ApiError.conflict(
          'No single nor combo fits on the requested day/window',
          'no_capacity'
        );
      }

      // --- 7. Create booking ---
      const chosen = candidates[0];

      const booking: Booking = {
        id: `booking_${Date.now()}`,
        restaurantId: bookingData.restaurantId,
        sectorId: bookingData.sectorId,
        tableIds: chosen.tables.map(t => t.id),
        partySize: bookingData.partySize,
        start: startISO,
        end: endISO,
        durationMinutes: bookingData.durationMinutes,
        status: 'CONFIRMED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      logger.info(`Booking created: ${JSON.stringify(booking)}`);

      this.repository.addBooking(booking);

      // --- 9. Register idempotency key ---
      if (idempotencyKey) {
        await idempotencyService.registerKey(idempotencyKey);
      }

      return booking;
    } finally {
      logger.debug(`Releasing lock for key ${lockKey}`);
      release();
    }
  }
}

export default BookingService;
