import express from 'express';
import { getEnvs } from './config/env.config';
import BookingService from './domain/bookings/service/booking.service';
import { IdempotencyService } from './domain/bookings/service/idempotency.service';
import { RestaurantService } from './domain/restaurant/services/restaurant.service';
import { Repository } from './domain/shared/respositories/wokibrain.repository';
import { TablesService } from './domain/tables/services/tables.service';
import { MainController } from './routes';
import logger from './utils/logger/logger';
import { errorHandler } from './utils/middleware/error-handler';
import { rateLimiter } from './utils/middleware/rateLimiter';
import requestLogger from './utils/middleware/requestLogger';
import { WokiBrain } from './wokibrain';

const app = express();

app.use(express.json()); // ensure body is parsed first
app.use(requestLogger);
app.use(rateLimiter({ windowMs: 60_000, max: 60 }));

// Idempotency service
const idempotencyService = new IdempotencyService();
const wokiBrainRepository = new Repository();

// Declare singletons and dependencies
const tableService = new TablesService(wokiBrainRepository);
const bookingService = new BookingService(wokiBrainRepository, tableService);
const restaurantService = new RestaurantService(wokiBrainRepository);

// Here you would normally import and use your MainController
const wokiBrainService = new WokiBrain(
  tableService,
  restaurantService,
  bookingService
); // Assuming WokiBrain implements IWokiBrain
const mainController = new MainController(wokiBrainService, logger).router;

app.use('/', mainController);

// Centralized error handling middleware
app.use(errorHandler);

const config = getEnvs();

app.listen(config.port, () => {
  logger.info(`🚀 Server running on http://localhost:${config.port}`);
});
