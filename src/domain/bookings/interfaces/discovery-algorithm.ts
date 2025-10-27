import { Table } from '../../shared/models/models';

export interface DiscoveryParams {
  restaurantId: string;
  sectorId: string;
  date: string;
  partySize: number;
  duration: number;
  windowStart?: string;
  windowEnd?: string;
  limit?: number;
}

export interface Candidate {
  tables: Table[];
  totalCapacity: number;
  availableSlots: Array<{ start: Date; end: Date }>;
}
