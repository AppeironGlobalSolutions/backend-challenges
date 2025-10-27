import {
  Booking,
  Restaurant,
  Sector,
  Table,
} from '../domain/shared/models/models';

export interface IData {
  bookings: Booking[];
  restaurant: Restaurant;
  sector: Sector;
  tables: Table[];
}

const data: IData = {
  bookings: [
    {
      id: 'B1',
      restaurantId: 'R1',
      sectorId: 'S1',
      tableIds: ['T2'],
      partySize: 3,
      start: '2025-10-22T21:00:00-03:00',
      end: '2025-10-22T21:45:00-03:00',
      durationMinutes: 45,
      status: 'CONFIRMED',
      createdAt: '2025-10-22T18:00:00-03:00',
      updatedAt: '2025-10-22T18:00:00-03:00',
    },
  ],
  restaurant: {
    id: 'R1',
    name: 'Bistro Central',
    timezone: 'America/Argentina/Buenos_Aires',
    windows: [
      { start: '12:00', end: '16:00' },
      { start: '20:00', end: '23:45' },
    ],
    createdAt: '2025-10-22T00:00:00-03:00',
    updatedAt: '2025-10-22T00:00:00-03:00',
  },
  sector: {
    id: 'S1',
    restaurantId: 'R1',
    name: 'Main Hall',
    createdAt: '2025-10-22T00:00:00-03:00',
    updatedAt: '2025-10-22T00:00:00-03:00',
  },
  tables: [
    {
      id: 'T1',
      sectorId: 'S1',
      name: 'Table 1',
      minSize: 2,
      maxSize: 2,
      createdAt: '2025-10-22T00:00:00-03:00',
      updatedAt: '2025-10-22T00:00:00-03:00',
    },
    {
      id: 'T2',
      sectorId: 'S1',
      name: 'Table 2',
      minSize: 2,
      maxSize: 4,
      createdAt: '2025-10-22T00:00:00-03:00',
      updatedAt: '2025-10-22T00:00:00-03:00',
    },
    {
      id: 'T3',
      sectorId: 'S1',
      name: 'Table 3',
      minSize: 2,
      maxSize: 4,
      createdAt: '2025-10-22T00:00:00-03:00',
      updatedAt: '2025-10-22T00:00:00-03:00',
    },
    {
      id: 'T4',
      sectorId: 'S1',
      name: 'Table 4',
      minSize: 4,
      maxSize: 6,
      createdAt: '2025-10-22T00:00:00-03:00',
      updatedAt: '2025-10-22T00:00:00-03:00',
    },
    {
      id: 'T5',
      sectorId: 'S1',
      name: 'Table 5',
      minSize: 2,
      maxSize: 2,
      createdAt: '2025-10-22T00:00:00-03:00',
      updatedAt: '2025-10-22T00:00:00-03:00',
    },
  ],
};

export default data;
