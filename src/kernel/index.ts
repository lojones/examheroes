import { Router, type Express } from 'express';
import { createAdminRouter } from './admin';
import { createAuthRouter } from './auth';
import { createAvailabilityRouter } from './availability';
import { createBookingsRouter } from './bookings';
import { createCategoriesRouter } from './categories';
import { createConversationsRouter } from './conversations';
import { createProfilesRouter } from './profiles';
import { createReviewsRouter } from './reviews';
import { createServicesRouter } from './services';
import { InMemoryMarketMeshStore } from './store';
import { type MarketMeshConfig, type MarketMeshHooks, type MarketMeshStore } from '../types/marketmesh';

export interface KernelContext {
  config: MarketMeshConfig;
  hooks: MarketMeshHooks;
  store: MarketMeshStore;
}

export class MarketMeshKernel {
  private readonly router: Router;
  private readonly context: KernelContext;

  constructor({ config, hooks, store }: { config: MarketMeshConfig; hooks: MarketMeshHooks; store?: MarketMeshStore }) {
    this.context = {
      config,
      hooks,
      store: store ?? new InMemoryMarketMeshStore(config),
    };
    this.router = Router();
    this.mountRoutes();
  }

  private mountRoutes(): void {
    this.router.use(createAuthRouter(this.context));
    this.router.use(createProfilesRouter(this.context));
    this.router.use(createCategoriesRouter(this.context));
    this.router.use(createServicesRouter(this.context));
    this.router.use(createAvailabilityRouter(this.context));
    this.router.use(createBookingsRouter(this.context));
    this.router.use(createConversationsRouter(this.context));
    this.router.use(createReviewsRouter(this.context));
    this.router.use(createAdminRouter(this.context));
  }

  mountOn(app: Express, basePath = '/'): void {
    app.use(basePath, this.router);
  }

  getRouter(): Router {
    return this.router;
  }

  getStore(): MarketMeshStore {
    return this.context.store;
  }

  getContext(): KernelContext {
    return this.context;
  }
}
