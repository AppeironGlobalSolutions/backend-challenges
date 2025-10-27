type ISODateTime = string;

export interface Restaurant {
  id: string;
  name: string;
  timezone: string;
  windows?: Array<{ start: string; end: string }>;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface Sector {
  id: string;
  restaurantId: string;
  name: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface Table {
  id: string;
  sectorId: string;
  name: string;
  minSize: number;
  maxSize: number;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export type BookingStatus = 'CONFIRMED' | 'CANCELLED';

export interface Booking {
  id: string;
  restaurantId: string;
  sectorId: string;
  tableIds: string[]; // single or combo (any length)
  partySize: number;
  start: ISODateTime; // [start,end)
  end: ISODateTime;
  durationMinutes: number;
  status: BookingStatus;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}
