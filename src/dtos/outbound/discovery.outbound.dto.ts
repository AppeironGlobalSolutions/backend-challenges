import { ISODateTime } from '../../domain/shared/types/date.type';

export interface DiscoveryOutboundDTO {
  slotMinutes: number;
  durationMinutes: number;
  candidates: {
    kind: 'single' | 'combination';
    tableIds: string[];
    availableSlots: {
      start: ISODateTime;
      end: ISODateTime;
    }[];
  }[];
}
