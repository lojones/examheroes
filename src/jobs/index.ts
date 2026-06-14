import { type MarketMeshStore } from '../types/marketmesh';

export function initializeJobs(store: MarketMeshStore) {
  return {
    status: 'ready',
    pendingDiagnostics: store.diagnosticAttempts.size,
  };
}
