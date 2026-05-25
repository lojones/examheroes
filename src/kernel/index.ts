import express, { Router } from 'express';
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
import type { MarketMeshConfig, MarketMeshHooks, MarketMeshKernelOptions } from '../types/marketmesh';

export interface KernelContext {
  config: MarketMeshConfig;
  hooks: MarketMeshHooks;
  store: InMemoryMarketMeshStore;
}

interface RouterModule {
  router: Router;
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function seedPlatformDefaults(config: MarketMeshConfig, store: InMemoryMarketMeshStore): void {
  const now = store.now();
  const entries = {
    platformFeePercent: config.platformFeePercent,
    defaultCurrency: config.defaultCurrency,
    accessTokenTtlSeconds: config.accessTokenTtlSeconds ?? 900,
    refreshTokenTtlSeconds: config.refreshTokenTtlSeconds ?? 604800,
  } as const;

  for (const [key, value] of Object.entries(entries)) {
    store.platformConfig.set(key, {
      id: key,
      key,
      value,
      updatedAt: now,
    });
  }

  for (const categoryName of config.categories) {
    const slug = slugify(categoryName);
    if (store.findCategoryBySlug(slug)) {
      continue;
    }
    const category = {
      id: store.id(),
      slug,
      name: categoryName,
      description: `${categoryName} services`,
      metadataSchema: undefined,
      isActive: true,
    };
    store.categories.set(category.id, category);
  }
}

function createModule(routerFactories: Array<(context: KernelContext) => Router>, context: KernelContext): RouterModule {
  const router = Router();
  for (const factory of routerFactories) {
    router.use(factory(context));
  }
  return { router };
}

export class MarketMeshKernel {
  public readonly store: InMemoryMarketMeshStore;
  public readonly auth: RouterModule;
  public readonly platform: RouterModule;
  public readonly marketplace: RouterModule;
  public readonly bookings: RouterModule;
  public readonly payments: RouterModule;

  private readonly router: Router;
  private readonly context: KernelContext;

  public constructor(options: MarketMeshKernelOptions) {
    this.store = new InMemoryMarketMeshStore();
    this.context = {
      config: options.config,
      hooks: options.hooks ?? {},
      store: this.store,
    };

    seedPlatformDefaults(options.config, this.store);

    this.auth = createModule([createAuthRouter], this.context);
    this.platform = createModule([createProfilesRouter, createCategoriesRouter, createAdminRouter], this.context);
    this.marketplace = createModule([createServicesRouter, createAvailabilityRouter, createConversationsRouter, createReviewsRouter], this.context);
    this.bookings = createModule([createBookingsRouter], this.context);
    this.payments = createModule([], this.context);

    this.router = Router();
    this.router.use(this.auth.router);
    this.router.use(this.platform.router);
    this.router.use(this.marketplace.router);
    this.router.use(this.bookings.router);
    this.router.use(this.payments.router);
  }

  public getRouter(): Router {
    return this.router;
  }

  public createApp(prefix = '/api/v1'): express.Express {
    const app = express();
    app.use(prefix, this.getRouter());
    return app;
  }
}
