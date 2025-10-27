import z from 'zod';
import { Booking } from '../../domain/shared/models/models';

export class CreateBookingDTO {
  constructor(data: CreateBookingDTOInbound) {
    Object.assign(this, data);
  }

  static schema = z.object({
    body: z.object({
      restaurantId: z.string().trim().min(1, 'restaurantId is required'),

      sectorId: z.string().trim().min(1, 'sectorId is required'),

      partySize: z
        .number()
        .int('partySize must be an integer')
        .min(1, 'partySize must be at least 1'),

      durationMinutes: z
        .number()
        .int('durationMinutes must be an integer')
        .min(1, 'durationMinutes must be at least 1'),

      date: z
        .string()
        .trim()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be in YYYY-MM-DD format'),

      windowStart: z
        .string()
        .trim()
        .regex(
          /^([01]\d|2[0-3]):[0-5]\d$/,
          'windowStart must be in HH:mm format'
        ),

      windowEnd: z
        .string()
        .trim()
        .regex(
          /^([01]\d|2[0-3]):[0-5]\d$/,
          'windowEnd must be in HH:mm format'
        ),
    }),
  });

  static parse(input: unknown): CreateBookingDTOInbound {
    const toParse =
      input && typeof input === 'object' && 'body' in (input as any)
        ? input
        : { body: input };
    const parsed = this.schema.parse(toParse);
    return parsed.body as CreateBookingDTOInbound;
  }
}

export type CreateBookingDTOInbound = z.infer<
  typeof CreateBookingDTO.schema
>['body'];

export type CreateBookingDTOResponse = Booking;
