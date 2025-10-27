import logger from '../../../utils/logger/logger';
import { Table } from '../../shared/models/models';
import { IRepository } from '../../shared/respositories/wokibrain.repository';

export interface AvailabilityParams {
  sectorId: string;
  date: string; // 'YYYY-MM-DD'
  start: string; // 'HH:mm'
  end: string; // 'HH:mm'
}

export interface TableAvailability {
  table: Table;
  availableSlots: Array<{ start: Date; end: Date }>;
}

export interface ITablesService {
  getAllAvailableTables(
    restaurantId: string,
    sectorId: string,
    date: string,
    partySize: number,
    durationMinutes: number,
    windowStart?: string,
    windowEnd?: string
  ): Promise<TableAvailability[]>;
  checkAvailability(
    restaurantId: string,
    sectorId: string,
    date: string,
    start: string,
    end: string
  ): Promise<Table[]>;
}

export class TablesService implements ITablesService {
  constructor(private readonly repository: IRepository) {}

  async getAllAvailableTables(
    restaurantId: string,
    sectorId: string,
    date: string,
    partySize: number,
    durationMinutes: number,
    windowStart?: string,
    windowEnd?: string
  ): Promise<TableAvailability[]> {
    const tables = await this.repository.getTablesBySector(sectorId);
    const bookings = await this.repository.getBookingsByDate(
      restaurantId,
      sectorId,
      date
    );

    logger.debug(
      `Checking availability for ${tables.length} tables on ${date} for party size ${partySize}`
    );
    logger.debug(`Existing bookings: ${JSON.stringify(bookings)}`);

    const startWindow = new Date(`${date}T${windowStart ?? '00:00:00'}`);
    const endWindow = new Date(`${date}T${windowEnd ?? '23:59:59'}`);

    const results: TableAvailability[] = [];

    for (const table of tables) {
      const tableBookings = bookings
        .filter(b => b.tableIds.includes(table.id))
        .map(b => ({
          start: new Date(b.start),
          end: new Date(b.end),
        }))
        .sort((a, b) => a.start.getTime() - b.start.getTime());

      const availableSlots = this.computeAvailableSlots(
        tableBookings,
        startWindow,
        endWindow,
        durationMinutes
      );

      if (availableSlots.length > 0) {
        results.push({ table, availableSlots });
      }
    }

    return results;
  }

  /**
   * Devuelve todas las franjas horarias disponibles de al menos `durationMinutes`
   * dentro de la ventana especificada.
   */
  private computeAvailableSlots(
    bookings: { start: Date; end: Date }[],
    windowStart: Date,
    windowEnd: Date,
    durationMinutes: number
  ): Array<{ start: Date; end: Date }> {
    const slots: Array<{ start: Date; end: Date }> = [];
    const durationMs = durationMinutes * 60 * 1000;

    // If there are no bookings, the whole window is available
    if (bookings.length === 0) {
      slots.push({ start: windowStart, end: windowEnd });
      return slots;
    }

    // Case 1: before the first booking
    const firstBooking = bookings[0];
    if (firstBooking.start.getTime() - windowStart.getTime() >= durationMs) {
      slots.push({ start: windowStart, end: firstBooking.start });
    }

    if (bookings.length !== 1) {
      // Case 2: between bookings
      for (let i = 0; i < bookings.length - 1; i++) {
        const gapStart = bookings[i].end;
        const gapEnd = bookings[i + 1].start;

        if (gapEnd.getTime() - gapStart.getTime() >= durationMs) {
          // dentro de la ventana general
          const start = new Date(
            Math.max(gapStart.getTime(), windowStart.getTime())
          );
          const end = new Date(Math.min(gapEnd.getTime(), windowEnd.getTime()));
          if (end.getTime() - start.getTime() >= durationMs) {
            slots.push({ start, end });
          }
        }
      }
    }

    // Case 3: after the last booking
    const lastBooking = bookings[bookings.length - 1];
    if (windowEnd.getTime() - lastBooking.end.getTime() >= durationMs) {
      slots.push({ start: lastBooking.end, end: windowEnd });
    }

    return slots;
  }

  async checkAvailability(
    restaurantId: string,
    sectorId: string,
    date: string,
    start: string,
    end: string
  ): Promise<Table[]> {
    const tables = await this.repository.getTablesBySector(sectorId);
    const bookings = await this.repository.getBookingsByDate(
      restaurantId,
      sectorId,
      date
    );

    const startTime = new Date(`${date}T${start}`);
    const endTime = new Date(`${date}T${end}`);

    const availableTables = tables.filter(table => {
      const overlapping = bookings.some(res => {
        if (!res.tableIds.includes(table.id)) return false;
        const resStart = new Date(res.start);
        const resEnd = new Date(res.end);
        return resStart < endTime && resEnd > startTime;
      });
      return !overlapping;
    });

    return availableTables;
  }
}
