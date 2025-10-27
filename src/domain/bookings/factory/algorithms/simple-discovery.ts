import logger from '../../../../utils/logger/logger';
import { TableAvailability } from '../../../tables/services/tables.service';
import {
  Candidate,
  DiscoveryParams,
} from '../../interfaces/discovery-algorithm';
import { IDiscoveryAlgorithm } from '../discovery-algorithm.factory';

/**
 * Simple discovery algorithm:
 * Selects individual tables that can fit the party size
 * and returns their own available slots directly.
 */
export class SimpleDiscoveryAlgorithm implements IDiscoveryAlgorithm {
  findCandidates(
    params: DiscoveryParams,
    tables: TableAvailability[]
  ): Candidate[] {
    const limit = params.limit || 10;
    const target = params.partySize;

    // Filter tables that can handle the party size individually
    const suitable = tables.filter(
      t => t.table.minSize <= target && t.table.maxSize >= target
    );

    logger.debug(
      `SimpleDiscoveryAlgorithm found ${suitable.length} suitable tables for party size ${target}`
    );

    // Build candidates
    const candidates: Candidate[] = suitable.slice(0, limit).map(t => ({
      tables: [t.table],
      totalCapacity: t.table.maxSize,
      availableSlots: t.availableSlots, // propagate availability info
    }));

    logger.debug(
      `Candidates generated: ${JSON.stringify(candidates, null, 2)}`
    );

    return candidates;
  }
}
