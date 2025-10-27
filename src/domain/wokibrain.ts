import { Logger } from 'pino';
import { CreateBookingDTOInbound } from '../dtos/inbound/create-booking.dto';
import { DiscoverQueryDTOType } from '../dtos/inbound/discovery-params.dto';
import { DiscoveryOutboundDTO } from '../dtos/outbound/discovery.outbound.dto';
import { ApiError } from '../utils/errors/errors';
import logger from '../utils/logger/logger';
import { IBookingService } from './bookings/service/booking.service';
import { IRestaurantService } from './restaurant/services/restaurant.service';
import { Booking } from './shared/models/models';
import { ITablesService } from './tables/services/tables.service';

export interface IWokiBrain {
  // This should be defined in a separate interface file in a real app
  discover(params: DiscoverQueryDTOType): Promise<DiscoveryOutboundDTO>;
  getBookingsByDay(
    restaurantId: string,
    sectorId?: string,
    day?: string
  ): Promise<Booking[]>;
  deleteBooking(bookingId: string): void;
  createBooking(
    bookingData: CreateBookingDTOInbound,
    idempotencyKey?: string
  ): Promise<Booking>;
}

export class WokiBrain implements IWokiBrain {
  // This should be in a separate service file in a real app.
  // Business logic would be more complex and involve multiple repositories/services/validations.
  private readonly logger: Logger;

  constructor(
    private readonly tableService: ITablesService,
    private readonly restaurantService: IRestaurantService,
    private readonly bookingService: IBookingService
  ) {
    this.logger = logger;
  }

  /**
   * ==========================================
   * Create booking
   * ==========================================
   */
  async createBooking(
    bookingData: CreateBookingDTOInbound,
    idempotencyKey?: string
  ): Promise<Booking> {
    return await this.bookingService.createBookingAtomic(
      bookingData,
      idempotencyKey
    );
  }

  /**
   * ==========================================
   * Discover available slots
   * ==========================================
   */
  public async discover(
    params: DiscoverQueryDTOType
  ): Promise<DiscoveryOutboundDTO> {
    // Validations would go here in a real app
    // Check if restaurant and sector exist
    // Check if party size fits in sector max capacity

    // Check if resturant exists
    const restaurant = await this.restaurantService?.getRestaurantById(
      params.restaurantId
    );

    if (!restaurant) {
      logger.error(`Restaurant with ID ${params.restaurantId} not found`);
      throw ApiError.notFound('Restaurant not found');
    }

    // Check if requested window is within service windows
    if (
      params.windowStart &&
      params.windowEnd &&
      !this.restaurantService.checkServiceWindow(
        params.restaurantId,
        params.windowStart,
        params.windowEnd
      )
    ) {
      logger.error(
        `Requested window ${params.windowStart}-${params.windowEnd} is outside service hours for restaurant ${params.restaurantId}`
      );
      throw ApiError.outsideServiceWindow();
    }

    // Fetch available tables for the sector on the given date
    logger.debug(
      `Fetching available tables for restaurant ${params.restaurantId}, sector ${params.sectorId} on date ${params.date}`
    );
    const tables = await this.tableService.getAllAvailableTables(
      params.restaurantId,
      params.sectorId,
      params.date,
      params.partySize,
      params.duration,
      params.windowStart,
      params.windowEnd
    );

    logger.debug(`Found ${tables.length} tables for sector ${params.sectorId}`);
    logger.debug(`Tables details: ${JSON.stringify(tables)}`);

    if (tables.length === 0) {
      throw ApiError.conflict(
        'No single or combo gap fits duration within window'
      );
    }

    logger.debug(`Finding candidates`);
    const candidates = await this.bookingService.findCandidates(params, tables);

    logger.debug(`Candidates found: ${JSON.stringify(candidates)}`);

    if (candidates.length === 0) {
      throw ApiError.conflict(
        'No single or combo gap fits duration within window'
      );
    }

    return {
      slotMinutes: 15,
      durationMinutes: params.duration,
      candidates: candidates.map(c => ({
        kind: c.tables.length > 1 ? 'combination' : 'single',
        tableIds: c.tables.map(t => t.id),
        availableSlots: c.availableSlots.map(s => ({
          start: s.start.toISOString(),
          end: s.end.toISOString(),
        })),
      })),
    };
  }

  /**
   * ==========================================
   * Get bookings by day
   * ==========================================
   */
  public async getBookingsByDay(
    restaurantId: string,
    sectorId: string,
    day: string
  ): Promise<Booking[]> {
    return await this.bookingService.getBookingsByDay(
      restaurantId,
      sectorId,
      day
    );
  }

  /**
   * ==========================================
   * Delete booking
   * ==========================================
   */
  public async deleteBooking(bookingId: string): Promise<void> {
    await this.bookingService.deleteBooking(bookingId);
  }
}
