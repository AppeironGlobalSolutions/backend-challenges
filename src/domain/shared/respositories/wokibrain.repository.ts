import data from '../../../store/data';
import { Booking, Restaurant, Sector, Table } from '../models/models';

export interface IRepository {
  getSector(): Sector;
  getTablesBySector(sectorId: string): Table[];
  getBookings(): Booking[];
  getBookingById(bookingId: string): Booking | undefined;
  getBookingsBySectorId(sectorId: string): Booking | undefined;
  getBookingsByDate(
    restaurantId: string,
    sectorId: string,
    date: string
  ): Booking[];
  addBooking(booking: Booking): void;
  cancelBooking(bookingId: string): void;
  getRestaurantById(restaurantId: string): Restaurant | null;
  getSectorById(sectorId: string): Sector | null;
}

export class Repository implements IRepository {
  // This should be separated into different repositories per model in a real app.
  // Also this would interface with a real database and not static data.
  private restaurant: Restaurant[];
  private bookings: Booking[];
  private tables: Table[];
  private sector: Sector;

  constructor() {
    this.restaurant = [data.restaurant];
    this.bookings = data.bookings;
    this.tables = data.tables;
    this.sector = data.sector;
  }

  public getSector() {
    return this.sector;
  }

  public getTablesBySector(sectorId: string) {
    return this.tables.filter(table => table.sectorId === sectorId);
  }

  public getBookingById(bookingId: string) {
    return this.bookings.find(b => b.id === bookingId);
  }

  public getBookings() {
    return this.bookings;
  }

  public getBookingsBySectorId(sectorId: string) {
    return this.bookings.find(b => b.sectorId === sectorId);
  }

  public getBookingsByDate(
    restaurantId: string,
    sectorId: string,
    date: string
  ) {
    return this.bookings.filter(
      b =>
        b.restaurantId === restaurantId &&
        b.sectorId === sectorId &&
        b.start.startsWith(date)
    );
  }

  public addBooking(booking: Booking) {
    this.bookings.push(booking);
  }

  public cancelBooking(bookingId: string) {
    this.bookings = this.bookings.filter(b => b.id !== bookingId);
  }

  public getRestaurantById(restaurantId: string) {
    const restaurant = this.restaurant.find(r => r.id === restaurantId);
    return restaurant || null;
  }

  public getSectorById(sectorId: string) {
    const sector = this.sector.id === sectorId ? this.sector : null;
    return sector;
  }
}
