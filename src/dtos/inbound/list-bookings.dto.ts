import z from 'zod';
import { Booking } from '../../domain/shared/models/models';

export class ListBookingsDTO {
  restaurantId?: string;
  sectorId?: string;
  date?: string;

  constructor(data: ListBookingsDTORequest) {
    Object.assign(this, data);
  }

  static schema = z.object({
    query: z.object({
      restaurantId: z.string().min(1, 'restaurantId is required'),
      sectorId: z.string().min(1, 'sectorId is required'),
      date: z.string().min(1, 'date is required'),
    }),
  });

  static parse(input: unknown): ListBookingsDTORequest {
    const toParse =
      input && typeof input === 'object' && 'query' in (input as any)
        ? input
        : { query: input };
    const parsed = this.schema.parse(toParse);
    return parsed.query as ListBookingsDTORequest;
  }

  static parseResponse(
    date: string,
    bookings: Booking[]
  ): ListBookingsDTOResponse {
    return {
      date: date,
      items: bookings.map(b => ({
        id: b.id,
        tableIds: b.tableIds,
        partySize: b.partySize,
        start: b.start,
        end: b.end,
        status: b.status,
      })),
    };
  }
}

export type ListBookingsDTORequest = z.infer<
  typeof ListBookingsDTO.schema
>['query'];

export type ListBookingsDTOResponse = {
  date: string;
  items: {
    id: string;
    tableIds: string[];
    partySize: number;
    start: string;
    end: string;
    status: string;
  }[];
};
