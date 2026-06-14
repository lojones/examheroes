import cors from 'cors';
import express, { Router, type Request, type RequestHandler, type Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import { InMemoryMarketMeshStore } from './store';
import {
  AuthService,
  BookingService,
  MarketplaceService,
  PaymentService,
  PlatformService,
} from './programmatic';
import type { AuthenticatedUser, Booking, BookingStatus, MarketMeshConfig, MarketMeshHooks, MarketMeshKernelOptions, Role } from '../types/marketmesh';

declare module 'express-serve-static-core' {
  interface Request {
    marketmeshUser?: AuthenticatedUser;
  }
}

export interface KernelContext {
  config: MarketMeshConfig;
  hooks: MarketMeshHooks;
  store: InMemoryMarketMeshStore;
}

const ok = (response: Response, data: unknown, status = 200): void => {
  response.status(status).json({ success: true, data });
};

const fail = (response: Response, error: unknown, status = 400): void => {
  const message = error instanceof Error ? error.message : String(error);
  response.status(status).json({ success: false, error: { code: status >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR', message } });
};

const bearerToken = (request: Request): string | undefined => {
  const [scheme, token] = request.header('authorization')?.split(' ') ?? [];
  return scheme?.toLowerCase() === 'bearer' ? token : undefined;
};

export class MarketMeshKernel {
  public readonly store: InMemoryMarketMeshStore;
  public readonly auth: AuthService;
  public readonly platform: PlatformService;
  public readonly marketplace: MarketplaceService;
  public readonly bookings: BookingService;
  public readonly payments: PaymentService;

  private readonly hooks: MarketMeshHooks;

  public constructor(private readonly options: MarketMeshKernelOptions) {
    this.hooks = options.hooks ?? {};
    this.store = new InMemoryMarketMeshStore();
    this.auth = new AuthService(this.store, options.config);
    this.platform = new PlatformService(this.store, options.config);
    this.marketplace = new MarketplaceService(this.store);
    this.bookings = new BookingService(this.store, this.marketplace, options.config, this.hooks);
    this.payments = new PaymentService(this.store);
    this.platform.seedDefaults();
  }

  public getRouter(): Router {
    const router = Router();
    router.use(cors());
    router.use(express.json());
    router.use(rateLimit({
      windowMs: 60_000,
      limit: 120,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
    }));

    router.get('/health', (_request, response) => ok(response, { status: 'ok', service: 'marketmesh' }));

    router.post('/auth/register', (request, response) => {
      try {
        ok(response, this.auth.register(request.body as { email: string; password: string; asBuyer?: boolean; asSeller?: boolean; phone?: string }), 201);
      } catch (error) {
        fail(response, error, 409);
      }
    });
    router.post('/auth/login', (request, response) => {
      try {
        ok(response, this.auth.login(request.body as { email: string; password: string }));
      } catch (error) {
        fail(response, error, 401);
      }
    });
    router.post('/auth/refresh', (request, response) => {
      try {
        const { refreshToken } = request.body as { refreshToken: string };
        ok(response, this.auth.refresh(refreshToken));
      } catch (error) {
        fail(response, error, 401);
      }
    });

    router.post('/profiles/buyer', this.requireAuth(), (request, response) => {
      const input = request.body as { preferences?: Record<string, unknown> };
      ok(response, this.auth.createBuyerProfile(this.requiredUser(request).id, input.preferences), 201);
    });
    router.post('/profiles/seller', this.requireAuth(), async (request, response) => {
      try {
        const profile = this.auth.createSellerProfile(this.requiredUser(request).id, request.body as { bio?: string; location?: Record<string, unknown>; radiusKm?: number });
        await this.hooks.beforeSellerActivation?.(profile.id);
        profile.verificationStatus = 'VERIFIED';
        ok(response, profile, 201);
      } catch (error) {
        fail(response, error, 500);
      }
    });

    router.get('/categories', (_request, response) => ok(response, this.platform.listCategories()));

    router.get('/services/search', (request, response) => {
      ok(response, this.marketplace.searchServices({
        category: typeof request.query.category === 'string' ? request.query.category : undefined,
        query: typeof request.query.query === 'string' ? request.query.query : undefined,
        minPrice: typeof request.query.minPrice === 'string' ? Number(request.query.minPrice) : undefined,
        maxPrice: typeof request.query.maxPrice === 'string' ? Number(request.query.maxPrice) : undefined,
        sellerId: typeof request.query.sellerId === 'string' ? request.query.sellerId : undefined,
      }));
    });
    router.post('/services', this.requireRole('SELLER'), (request, response) => {
      try {
        const input = request.body as Parameters<MarketplaceService['createService']>[0];
        this.requireSellerOwnership(request, input.sellerId);
        ok(response, this.marketplace.createService(input), 201);
      } catch (error) {
        fail(response, error);
      }
    });

    router.post('/availability', this.requireRole('SELLER'), (request, response) => {
      try {
        const input = request.body as { sellerId: string; startTime: string | Date; endTime: string | Date; recurringRule?: Record<string, unknown> };
        this.requireSellerOwnership(request, input.sellerId);
        ok(response, this.marketplace.addAvailability({
          sellerId: input.sellerId,
          startTime: new Date(input.startTime),
          endTime: new Date(input.endTime),
          recurringRule: input.recurringRule,
        }), 201);
      } catch (error) {
        fail(response, error);
      }
    });

    router.post('/bookings', this.requireRole('BUYER'), async (request, response) => {
      try {
        const input = request.body as {
          bookingType?: 'DIRECT' | 'REQUEST';
          buyerId?: string;
          sellerId?: string;
          serviceId?: string;
          categoryId?: string;
          availabilitySlotId?: string;
          requestDetails?: Record<string, unknown>;
          finalPrice?: number;
          packagePurchaseId?: string;
          contentUploadIds?: string[];
          startTime?: string | Date;
          endTime?: string | Date;
        };
        const buyerId = input.buyerId ?? this.store.findBuyerProfileByUserId(this.requiredUser(request).id)?.id;
        if (!buyerId) {
          throw new Error('Buyer profile not found');
        }
        this.requireBuyerOwnership(request, buyerId);
        const service = input.serviceId ? this.store.services.get(input.serviceId) : undefined;
        const slot = input.availabilitySlotId ? this.store.availabilitySlots.get(input.availabilitySlotId) : undefined;
        const requestDetails = {
          ...(input.requestDetails ?? {}),
          availabilitySlotId: input.availabilitySlotId,
          packagePurchaseId: input.packagePurchaseId,
          contentUploadIds: input.contentUploadIds ?? [],
        };
        const booking = await this.bookings.createBooking({
          bookingType: input.bookingType ?? 'DIRECT',
          buyerId,
          sellerId: input.sellerId,
          serviceId: input.serviceId,
          categoryId: input.categoryId ?? service?.categoryId ?? '',
          requestDetails,
          finalPrice: input.finalPrice,
          startTime: input.startTime ? new Date(input.startTime) : slot?.startTime,
          endTime: input.endTime ? new Date(input.endTime) : slot?.endTime,
        });
        if (slot) {
          slot.isBooked = true;
        }
        if (input.packagePurchaseId) {
          const purchase = this.store.packagePurchases.get(input.packagePurchaseId);
          if (purchase) {
            purchase.usedSessions += 1;
            purchase.status = purchase.usedSessions >= purchase.totalSessions ? 'EXHAUSTED' : purchase.status;
            purchase.updatedAt = this.store.now();
          }
        }
        ok(response, booking, 201);
      } catch (error) {
        fail(response, error);
      }
    });

    router.get('/bookings/:id', this.requireAuth(), async (request, response) => {
      try {
        const booking = this.bookings.getBooking(request.params.id);
        this.requireBookingParticipant(request, booking);
        const extension = (await this.hooks.extendBookingPayload?.(booking)) ?? {};
        ok(response, { ...booking, ...extension, conversation: this.bookings.getConversationByBookingId(booking.id) });
      } catch (error) {
        fail(response, error, 404);
      }
    });
    router.patch('/bookings/:id/status', this.requireAuth(), async (request, response) => {
      try {
        const booking = this.bookings.getBooking(request.params.id);
        this.requireBookingParticipant(request, booking);
        const input = request.body as { status: BookingStatus };
        ok(response, await this.bookings.updateStatus(booking.id, input.status));
      } catch (error) {
        fail(response, error);
      }
    });
    router.post('/bookings/:id/reviews', this.requireAuth(), (request, response) => {
      try {
        const input = request.body as { authorId: string; recipientId: string; rating: number; comment?: string };
        this.requireReviewAuthorOwnership(request, input.authorId);
        ok(response, this.bookings.createReview({ bookingId: request.params.id, ...input }), 201);
      } catch (error) {
        fail(response, error);
      }
    });

    router.post('/conversations/:id/messages', this.requireAuth(), (request, response) => {
      try {
        const input = request.body as { senderId: string; content: string; attachments?: string[] };
        this.requireReviewAuthorOwnership(request, input.senderId);
        ok(response, this.bookings.createMessage({ conversationId: request.params.id, ...input }), 201);
      } catch (error) {
        fail(response, error);
      }
    });

    router.post('/payments/webhooks', (request, response) => {
      try {
        ok(response, this.payments.processWebhook(request.body as Parameters<PaymentService['processWebhook']>[0]));
      } catch (error) {
        fail(response, error);
      }
    });

    router.get('/admin/analytics', this.requireRole('ADMIN'), (_request, response) => {
      const completedBookings = Array.from(this.store.bookings.values()).filter((booking) => booking.status === 'COMPLETED');
      ok(response, {
        totalBookings: this.store.bookings.size,
        totalRevenue: completedBookings.reduce((sum, booking) => sum + (booking.platformFeeAmount ?? 0), 0),
        activeUsers: this.store.users.size,
      });
    });

    return router;
  }

  public createApp(prefix = '/api/v1'): express.Express {
    const app = express();
    app.use(prefix, this.getRouter());
    return app;
  }

  private requireAuth(): RequestHandler {
    return (request, response, next) => {
      const token = bearerToken(request);
      if (!token) {
        fail(response, 'Authentication required', 401);
        return;
      }
      try {
        request.marketmeshUser = this.auth.verifyAccessToken(token);
        next();
      } catch (error) {
        fail(response, error, 401);
      }
    };
  }

  private requireRole(role: Role): RequestHandler {
    return (request, response, next) => {
      const token = bearerToken(request);
      if (!token) {
        fail(response, 'Authentication required', 401);
        return;
      }
      try {
        request.marketmeshUser = this.auth.verifyAccessToken(token);
        const user = this.requiredUser(request);
        if (role === 'ADMIN' ? !user.isAdmin : !user.roles.includes(role)) {
          fail(response, `Requires ${role} role`, 403);
          return;
        }
        next();
      } catch (error) {
        fail(response, error, 401);
      }
    };
  }

  private requiredUser(request: Request): AuthenticatedUser {
    if (!request.marketmeshUser) {
      throw new Error('Authentication required');
    }
    return request.marketmeshUser;
  }

  private requireBuyerOwnership(request: Request, buyerId: string): void {
    const user = this.requiredUser(request);
    const profile = this.store.buyerProfiles.get(buyerId);
    if (!profile || profile.userId !== user.id) {
      throw new Error('Buyer profile does not belong to the authenticated user');
    }
  }

  private requireSellerOwnership(request: Request, sellerId: string): void {
    const user = this.requiredUser(request);
    const profile = this.store.sellerProfiles.get(sellerId);
    if (!profile || profile.userId !== user.id) {
      throw new Error('Seller profile does not belong to the authenticated user');
    }
  }

  private requireBookingParticipant(request: Request, booking: Booking): void {
    const user = this.requiredUser(request);
    const buyer = this.store.buyerProfiles.get(booking.buyerId);
    const seller = this.store.sellerProfiles.get(booking.sellerId);
    if (!buyer || !seller || (buyer.userId !== user.id && seller.userId !== user.id && !user.isAdmin)) {
      throw new Error('Booking does not belong to the authenticated user');
    }
  }

  private requireReviewAuthorOwnership(request: Request, profileId: string): void {
    const buyerProfile = this.store.buyerProfiles.get(profileId);
    if (buyerProfile) {
      this.requireBuyerOwnership(request, profileId);
      return;
    }
    this.requireSellerOwnership(request, profileId);
  }
}
