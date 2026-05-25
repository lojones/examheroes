import express, { Router } from 'express';
import { InMemoryMarketMeshStore } from './store';
import type { MarketMeshConfig, MarketMeshHooks, MarketMeshKernelOptions } from '../types/marketmesh';
export interface KernelContext {
    config: MarketMeshConfig;
    hooks: MarketMeshHooks;
    store: InMemoryMarketMeshStore;
}
interface RouterModule {
    router: Router;
}
export declare class MarketMeshKernel {
    readonly store: InMemoryMarketMeshStore;
    readonly auth: RouterModule;
    readonly platform: RouterModule;
    readonly marketplace: RouterModule;
    readonly bookings: RouterModule;
    readonly payments: RouterModule;
    private readonly router;
    private readonly context;
    constructor(options: MarketMeshKernelOptions);
    getRouter(): Router;
    createApp(prefix?: string): express.Express;
}
export {};
//# sourceMappingURL=index.d.ts.map