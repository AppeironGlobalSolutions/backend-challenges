import { NextFunction, Request, Response, Router } from 'express';
import { Logger } from 'pino';
import { IWokiBrain } from './domain/wokibrain';
import { CreateBookingDTO } from './dtos/inbound/create-booking.dto';
import { DiscoverQueryDTO } from './dtos/inbound/discovery-params.dto';
import { ListBookingsDTO } from './dtos/inbound/list-bookings.dto';
import { validate } from './utils/middleware/validate';

export class MainController {
  // this should be separaeted into multiple controllers in a real app
  public readonly router: Router;
  constructor(
    private readonly wokiBrainService: IWokiBrain,
    private readonly logger: Logger
  ) {
    this.wokiBrainService = wokiBrainService;
    this.router = Router();
    this.setRoutes();
  }

  public setRoutes(): Router {
    /**
     * ==========================================
     * 5.1 Discover Seats (No Mutation)
     * ==========================================
     */
    this.router.get(
      '/woki/discover',
      validate(DiscoverQueryDTO.schema),
      async (req: Request, res: Response, next: NextFunction) => {
        try {
          const {
            restaurantId,
            sectorId,
            date,
            partySize,
            duration,
            windowStart,
            windowEnd,
            limit,
          } = DiscoverQueryDTO.parse(req.query);

          const candidates = await this.wokiBrainService.discover({
            restaurantId,
            sectorId,
            date,
            partySize,
            duration,
            windowStart,
            windowEnd,
            limit,
          });

          res.json(candidates);
        } catch (err) {
          next(err); // pass to errorHandler
        }
      }
    );

    /**
     * ==========================================
     * 5.2 Create Booking
     * ==========================================
     */
    this.router.post(
      '/woki/bookings',
      validate(CreateBookingDTO.schema),
      async (req: Request, res: Response, next: NextFunction) => {
        const idempotencyKey = req.headers['idempotency-key'] as
          | string
          | undefined;

        // parse the validated body (middleware already validated)
        const bookingData = CreateBookingDTO.parse(req.body);

        try {
          const booking = await this.wokiBrainService.createBooking(
            bookingData,
            idempotencyKey
          );

          return res.json({
            message: 'Create booking endpoint',
            idempotencyKey,
            booking,
          });
        } catch (err: any) {
          next(err); // pass to errorHandler
        }
      }
    );

    /**
     * ==========================================
     * 5.3 List Bookings (No Mutation)
     * ==========================================
     */
    this.router.get(
      '/woki/bookings',
      validate(ListBookingsDTO.schema),
      async (req: Request, res: Response, next: NextFunction) => {
        try {
          const { restaurantId, sectorId, date } = ListBookingsDTO.parse(
            req.query
          );
          const bookings = await this.wokiBrainService.getBookingsByDay(
            restaurantId,
            sectorId,
            date
          );

          res.json(ListBookingsDTO.parseResponse(date, bookings));
        } catch (err) {
          next(err); // pass to errorHandler
        }
      }
    );

    return this.router;
  }
}
