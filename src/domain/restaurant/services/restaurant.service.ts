import { Restaurant } from '../../shared/models/models';
import { IRepository } from '../../shared/respositories/wokibrain.repository';

export interface IRestaurantService {
  getRestaurantById(restaurantId: string): Promise<Restaurant | null>;
  checkServiceWindow(
    restaurantId: string,
    windowStart: string,
    windowEnd: string
  ): boolean;
}

export class RestaurantService implements IRestaurantService {
  constructor(private readonly repository: IRepository) {}

  async getRestaurantById(restaurantId: string): Promise<Restaurant | null> {
    return this.repository.getRestaurantById(restaurantId);
  }

  checkServiceWindow(
    restaurantId: string,
    windowStart: string,
    windowEnd: string
  ): boolean {
    const restaurant = this.repository.getRestaurantById(restaurantId);
    if (!restaurant) {
      return false;
    }

    const windows: Array<{ start: string; end: string }> =
      restaurant.windows || [];
    if (windows.length === 0) {
      return true; // No windows defined means open all day
    }

    const timeToMinutes = (hhmm: string) => {
      const [hh, mm] = hhmm.split(':').map(Number);
      return hh * 60 + mm;
    };

    const startMin = timeToMinutes(windowStart);
    const endMin = timeToMinutes(windowEnd);
    const inside = windows.some(w => {
      const wStart = timeToMinutes(w.start);
      const wEnd = timeToMinutes(w.end);
      return startMin >= wStart && endMin <= wEnd;
    });

    return inside;
  }
}
