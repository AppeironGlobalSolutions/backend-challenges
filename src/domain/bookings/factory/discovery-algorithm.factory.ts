import { TableAvailability } from '../../tables/services/tables.service';
import { Candidate, DiscoveryParams } from '../interfaces/discovery-algorithm';
import { BinDiscoveryAlgorithm } from './algorithms/bin-discovery';
import { SimpleDiscoveryAlgorithm } from './algorithms/simple-discovery';

export type AlgorithmType = 'simple' | 'bins';

export interface IDiscoveryAlgorithm {
  findCandidates(
    params: DiscoveryParams,
    tables: TableAvailability[]
  ): Candidate[];
}

export class DiscoveryAlgorithmFactory {
  static create(type: AlgorithmType): IDiscoveryAlgorithm {
    // Decide which algorithm to instantiate based on type
    // It could be extended to include more algorithms in the future
    switch (type) {
      case 'bins':
        return new BinDiscoveryAlgorithm();
      default:
        return new SimpleDiscoveryAlgorithm();
    }
  }
}
