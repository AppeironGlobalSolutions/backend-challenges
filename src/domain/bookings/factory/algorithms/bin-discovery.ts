import logger from '../../../../utils/logger/logger';
import { TableAvailability } from '../../../tables/services/tables.service';
import {
  Candidate,
  DiscoveryParams,
} from '../../interfaces/discovery-algorithm';
import { IDiscoveryAlgorithm } from '../discovery-algorithm.factory';

/**
 * Bin packing style algorithm that finds combinations of tables
 * that can accommodate a given party size and share a common availability window.
 */
export class BinDiscoveryAlgorithm implements IDiscoveryAlgorithm {
  findCandidates(
    params: DiscoveryParams,
    tables: TableAvailability[]
  ): Candidate[] {
    const candidates: Candidate[] = [];
    const target = params.partySize;
    const limit = params.limit || 10;

    // Filter out tables that can't host the party (table.minSize > partySize)
    // then sort by descending capacity
    const sorted = [...tables]
      .filter(t => t.table.minSize <= target)
      .sort((a, b) => b.table.maxSize - a.table.maxSize);

    logger.debug(
      `BinDiscoveryAlgorithm starting with ${sorted.length} tables for party size ${target}`
    );

    const combinations: TableAvailability[][] = [];

    // Generate combinations of tables
    for (let i = 0; i < sorted.length; i++) {
      const combo: TableAvailability[] = [sorted[i]];
      let sum = sorted[i].table.maxSize;

      for (let j = i + 1; j < sorted.length && sum < target; j++) {
        const candidateTable = sorted[j];

        // Ensure at least one overlapping slot between combo tables
        const hasOverlap = this.hasCommonAvailability(combo, candidateTable);

        if (hasOverlap && sum + candidateTable.table.maxSize <= target + 2) {
          combo.push(candidateTable);
          sum += candidateTable.table.maxSize;
        }
      }

      // Only accept combos that meet the target and whose tables are
      // individually eligible for this party size (defensive check).
      if (sum >= target && combo.every(c => c.table.minSize <= target)) {
        combinations.push(combo);
      }
    }

    logger.debug(
      `BinDiscoveryAlgorithm found ${combinations.length} combinations for party size ${target}`
    );

    // Early return if no combinations found
    if (combinations.length === 0) {
      return candidates; // empty
    }

    for (const combo of combinations.slice(0, limit)) {
      const totalCapacity = combo.reduce((acc, t) => acc + t.table.maxSize, 0);

      const commonSlots = this.getCommonAvailability(combo);

      candidates.push({
        tables: combo.map(c => c.table),
        totalCapacity,
        availableSlots: commonSlots, // Optional enrichment for downstream services
      });
    }

    logger.debug(
      `Candidates generated: ${JSON.stringify(candidates, null, 2)}`
    );

    return candidates;
  }

  /**
   * Checks if the new table shares at least one overlapping slot
   * with all tables already in the combo.
   */
  private hasCommonAvailability(
    combo: TableAvailability[],
    candidate: TableAvailability
  ): boolean {
    for (const existing of combo) {
      if (!this.hasOverlap(existing.availableSlots, candidate.availableSlots)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Returns true if there is any overlapping time range between two sets of slots.
   */
  private hasOverlap(
    slotsA: Array<{ start: Date; end: Date }>,
    slotsB: Array<{ start: Date; end: Date }>
  ): boolean {
    for (const a of slotsA) {
      for (const b of slotsB) {
        if (a.start < b.end && a.end > b.start) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Computes the intersection of available slots across all tables in a combo.
   * Returns only the overlapping ranges that can fit the duration.
   */
  private getCommonAvailability(
    combo: TableAvailability[]
  ): Array<{ start: Date; end: Date }> {
    if (combo.length === 0) return [];

    let intersection = combo[0].availableSlots;

    for (let i = 1; i < combo.length; i++) {
      intersection = this.intersectSlots(intersection, combo[i].availableSlots);
      if (intersection.length === 0) break;
    }

    return intersection;
  }

  /**
   * Finds overlapping intervals between two slot arrays.
   */
  private intersectSlots(
    slotsA: Array<{ start: Date; end: Date }>,
    slotsB: Array<{ start: Date; end: Date }>
  ): Array<{ start: Date; end: Date }> {
    const intersections: Array<{ start: Date; end: Date }> = [];

    for (const a of slotsA) {
      for (const b of slotsB) {
        const start = new Date(Math.max(a.start.getTime(), b.start.getTime()));
        const end = new Date(Math.min(a.end.getTime(), b.end.getTime()));
        if (start < end) intersections.push({ start, end });
      }
    }

    return intersections;
  }
}
