declare const app: import("express-serve-static-core").Express;
declare const context: {
    config: import("./types/marketmesh").MarketMeshConfig;
    hooks: import("./types/marketmesh").MarketMeshHooks;
    store: import("./kernel/store").InMemoryMarketMeshStore;
    kernel: import("./kernel").MarketMeshKernel;
    services: import("./marketmesh").ExamHeroesServices;
};
export { app, context };
//# sourceMappingURL=index.d.ts.map