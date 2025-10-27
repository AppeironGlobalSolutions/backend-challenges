import { z } from 'zod';

/**
 * DTOs that expose Zod schemas for request validation and helpers to parse/construct
 * typed DTO instances. Each class mirrors the validated shape and provides
 * a static `schema` used by the existing `validate` middleware.
 */

export class DiscoverQueryDTO {
  restaurantId!: string;
  sectorId?: string;
  partySize!: number;
  durationMinutes!: number;
  date!: string;
  windowStart?: string;
  windowEnd?: string;
  limit?: number;

  constructor(data: DiscoverQueryDTOType) {
    Object.assign(this, data);
  }

  static schema = z.object({
    query: z.object({
      restaurantId: z.string().min(1, 'restaurantId is required'),
      sectorId: z.string().min(1, 'sectorId is required'),
      date: z.string().min(1, 'date is required'),
      partySize: z.coerce
        .number()
        .int('partySize must be an integer')
        .positive('partySize must be positive')
        .min(1, 'partySize must be at least 1'),
      duration: z.coerce
        .number()
        .int('durationMinutes must be an integer')
        .positive('durationMinutes must be positive')
        .min(1, 'durationMinutes must be at least 1'),
      windowStart: z
        .string()
        .trim()
        .regex(
          /^([01]\d|2[0-3]):[0-5]\d$/,
          'windowStart must be in HH:mm format'
        )
        .optional()
        .transform(val => (typeof val === 'string' ? val : '')),
      windowEnd: z
        .string()
        .trim()
        .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'windowEnd must be in HH:mm format')
        .optional(),
      limit: z.coerce
        .number()
        .int('limit must be an integer')
        .positive('limit must be positive')
        .min(1, 'limit must be at least 1')
        .optional(),
    }),
  });

  static parse(input: unknown): DiscoverQueryDTOType {
    // Accept either the full request-like object ({ query }) or the raw query object
    const toParse =
      input && typeof input === 'object' && 'query' in (input as any)
        ? input
        : { query: input };
    const parsed = this.schema.parse(toParse);
    return parsed.query as DiscoverQueryDTOType;
  }
}

export type DiscoverQueryDTOType = z.infer<
  typeof DiscoverQueryDTO.schema
>['query'];
