import { Router, type Express } from 'express';
import { type MarketMeshConfig, type MarketMeshHooks, type MarketMeshStore } from '../types/marketmesh';
export interface KernelContext {
    config: MarketMeshConfig;
    hooks: MarketMeshHooks;
    store: MarketMeshStore;
}
export declare class MarketMeshKernel {
    private readonly router;
    private readonly context;
    constructor({ config, hooks, store }: {
        config: MarketMeshConfig;
        hooks: MarketMeshHooks;
        store?: MarketMeshStore;
    });
    private mountRoutes;
    mountOn(app: Express, basePath?: string): void;
    getRouter(): Router;
    getStore(): MarketMeshStore;
    getContext(): KernelContext;
}
//# sourceMappingURL=index.d.ts.map