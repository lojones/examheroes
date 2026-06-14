import bcrypt from 'bcryptjs';
import type { InMemoryMarketMeshStore } from './store';
import { signToken, verifyToken } from './common';
import type {
  AuthenticatedUser,
  AvailabilitySlot,
  Booking,
  BookingStatus,
  BookingType,
  BuyerProfile,
  Category,
  Conversation,
  LocationType,
  MarketMeshConfig,
  MarketMeshHooks,
  Message,
  PricingType,
  Review,
  Role,
  SellerProfile,
  ServiceListing,
  StripeEventRecord,
  User,
} from '../types/marketmesh';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  user: Omit<User, 'passwordHash' | 'salt'>;
}

const publicUser = (user: User): Omit<User, 'passwordHash' | 'salt'> => {
  const { passwordHash: _passwordHash, salt: _salt, ...safeUser } = user;
  return safeUser;
};

const statusTransitions: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ['ACCEPTED', 'CANCELLED', 'DISPUTED'],
  ACCEPTED: ['IN_PROGRESS', 'CANCELLED', 'DISPUTED'],
  IN_PROGRESS: ['COMPLETED', 'DISPUTED'],
  COMPLETED: [],
  CANCELLED: [],
  DISPUTED: ['COMPLETED', 'CANCELLED'],
};

export class AuthService {
  public constructor(private readonly store: InMemoryMarketMeshStore, private readonly config: MarketMeshConfig) {}

  public register(input: { email: string; password: string; phone?: string; avatarUrl?: string; asBuyer?: boolean; asSeller?: boolean; roles?: Role[] }): TokenPair {
    if (this.store.findUserByEmail(input.email)) {
      throw new Error('Email is already registered');
    }

    const roles = input.roles ?? [
      ...(input.asBuyer ?? true ? (['BUYER'] as const) : []),
      ...(input.asSeller ? (['SELLER'] as const) : []),
    ];
    const salt = bcrypt.genSaltSync(10);
    const now = this.store.now();
    const user: User = {
      id: this.store.id(),
      email: input.email.toLowerCase(),
      passwordHash: bcrypt.hashSync(input.password, salt),
      salt,
      phone: input.phone,
      avatarUrl: input.avatarUrl,
      isAdmin: roles.includes('ADMIN'),
      roles,
      createdAt: now,
      updatedAt: now,
    };
    this.store.users.set(user.id, user);

    if (roles.includes('BUYER')) {
      this.createBuyerProfile(user.id);
    }
    if (roles.includes('SELLER')) {
      this.createSellerProfile(user.id);
    }

    return this.issueTokens(user);
  }

  public login(input: { email: string; password: string }): TokenPair {
    const user = this.store.findUserByEmail(input.email);
    if (!user || !bcrypt.compareSync(input.password, user.passwordHash)) {
      throw new Error('Invalid email or password');
    }
    return this.issueTokens(user);
  }

  public refresh(refreshToken: string): TokenPair {
    const payload = verifyToken(this.config, refreshToken);
    if (payload.type !== 'refresh') {
      throw new Error('Invalid refresh token');
    }
    const user = this.store.users.get(payload.sub);
    if (!user) {
      throw new Error('Invalid refresh token');
    }
    return this.issueTokens(user);
  }

  public verifyAccessToken(accessToken: string): AuthenticatedUser {
    const payload = verifyToken(this.config, accessToken);
    if (payload.type !== 'access') {
      throw new Error('Invalid access token');
    }
    return { id: payload.sub, roles: payload.roles, isAdmin: payload.isAdmin };
  }

  public createBuyerProfile(userId: string, preferences?: Record<string, unknown>): BuyerProfile {
    const existing = this.store.findBuyerProfileByUserId(userId);
    if (existing) {
      return existing;
    }
    const profile: BuyerProfile = { id: this.store.id(), userId, preferences };
    this.store.buyerProfiles.set(profile.id, profile);
    this.store.ensureUserRole(userId, 'BUYER');
    return profile;
  }

  public createSellerProfile(userId: string, input: { bio?: string; location?: Record<string, unknown>; radiusKm?: number } = {}): SellerProfile {
    const existing = this.store.findSellerProfileByUserId(userId);
    if (existing) {
      return existing;
    }
    const profile: SellerProfile = {
      id: this.store.id(),
      userId,
      bio: input.bio,
      verificationStatus: 'PENDING',
      stripeConnectAccountId: undefined,
      averageRating: 0,
      reviewCount: 0,
      location: input.location,
      radiusKm: input.radiusKm ?? 50,
      isOnline: false,
    };
    this.store.sellerProfiles.set(profile.id, profile);
    this.store.ensureUserRole(userId, 'SELLER');
    return profile;
  }

  private issueTokens(user: User): TokenPair {
    const accessTtl = this.config.accessTokenTtlSeconds ?? 900;
    const refreshTtl = this.config.refreshTokenTtlSeconds ?? 604800;
    return {
      accessToken: signToken(this.config, { sub: user.id, email: user.email, roles: user.roles, isAdmin: user.isAdmin, type: 'access' }, accessTtl),
      refreshToken: signToken(this.config, { sub: user.id, email: user.email, roles: user.roles, isAdmin: user.isAdmin, type: 'refresh' }, refreshTtl),
      user: publicUser(user),
    };
  }
}

export class PlatformService {
  public constructor(private readonly store: InMemoryMarketMeshStore, private readonly config: MarketMeshConfig) {}

  public seedDefaults(): void {
    const now = this.store.now();
    this.store.platformConfig.set('platformFeePercent', { id: 'platformFeePercent', key: 'platformFeePercent', value: this.config.platformFeePercent, updatedAt: now });
    this.store.platformConfig.set('defaultCurrency', { id: 'defaultCurrency', key: 'defaultCurrency', value: this.config.defaultCurrency, updatedAt: now });
    for (const categoryName of this.config.categories) {
      const slug = categoryName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      if (!this.store.findCategoryBySlug(slug)) {
        this.createCategory({ slug, name: categoryName });
      }
    }
  }

  public listCategories(): Category[] {
    return Array.from(this.store.categories.values()).filter((category) => category.isActive);
  }

  public createCategory(input: { slug: string; name: string; description?: string; metadataSchema?: Record<string, unknown> }): Category {
    if (this.store.findCategoryBySlug(input.slug)) {
      throw new Error('Category slug already exists');
    }
    const category: Category = {
      id: this.store.id(),
      slug: input.slug,
      name: input.name,
      description: input.description,
      metadataSchema: input.metadataSchema,
      isActive: true,
    };
    this.store.categories.set(category.id, category);
    return category;
  }
}

export class MarketplaceService {
  public constructor(private readonly store: InMemoryMarketMeshStore) {}

  public createService(input: {
    sellerId: string;
    categoryId: string;
    title: string;
    description: string;
    price: number;
    currency: string;
    pricingType: PricingType;
    durationMinutes: number;
    locationType: LocationType;
    location?: Record<string, unknown>;
    mediaUrls?: string[];
  }): ServiceListing {
    if (!this.store.sellerProfiles.has(input.sellerId)) {
      throw new Error('Seller profile not found');
    }
    if (!this.store.categories.has(input.categoryId)) {
      throw new Error('Category not found');
    }
    const service: ServiceListing = {
      id: this.store.id(),
      sellerId: input.sellerId,
      categoryId: input.categoryId,
      title: input.title,
      description: input.description,
      price: input.price,
      currency: input.currency,
      pricingType: input.pricingType,
      durationMinutes: input.durationMinutes,
      locationType: input.locationType,
      location: input.location,
      mediaUrls: input.mediaUrls ?? [],
      isActive: true,
      createdAt: this.store.now(),
    };
    this.store.services.set(service.id, service);
    return service;
  }

  public searchServices(filters: { category?: string; query?: string; minPrice?: number; maxPrice?: number; sellerId?: string }): ServiceListing[] {
    const normalizedQuery = filters.query?.trim().toLowerCase();
    const category = filters.category ? this.store.findCategoryBySlug(filters.category) : undefined;
    return Array.from(this.store.services.values()).filter((service) => {
      const matchesCategory = !filters.category || service.categoryId === category?.id || service.categoryId === filters.category;
      const matchesQuery = !normalizedQuery || service.title.toLowerCase().includes(normalizedQuery) || service.description.toLowerCase().includes(normalizedQuery);
      const matchesMinPrice = filters.minPrice === undefined || service.price >= filters.minPrice;
      const matchesMaxPrice = filters.maxPrice === undefined || service.price <= filters.maxPrice;
      const matchesSeller = filters.sellerId === undefined || service.sellerId === filters.sellerId;
      return service.isActive && matchesCategory && matchesQuery && matchesMinPrice && matchesMaxPrice && matchesSeller;
    });
  }

  public addAvailability(input: { sellerId: string; startTime: Date; endTime: Date; recurringRule?: Record<string, unknown> }): AvailabilitySlot {
    if (input.endTime <= input.startTime) {
      throw new Error('Availability end time must be after start time');
    }
    if (!this.store.sellerProfiles.has(input.sellerId)) {
      throw new Error('Seller profile not found');
    }
    const slot: AvailabilitySlot = {
      id: this.store.id(),
      sellerId: input.sellerId,
      startTime: input.startTime,
      endTime: input.endTime,
      recurringRule: input.recurringRule,
      isBooked: false,
    };
    this.store.availabilitySlots.set(slot.id, slot);
    return slot;
  }

  public reserveSlot(sellerId: string, startTime?: Date, endTime?: Date): AvailabilitySlot | undefined {
    if (!startTime || !endTime) {
      return undefined;
    }
    const slot = Array.from(this.store.availabilitySlots.values()).find((candidate) => {
      return candidate.sellerId === sellerId && !candidate.isBooked && candidate.startTime <= startTime && candidate.endTime >= endTime;
    });
    if (slot) {
      slot.isBooked = true;
    }
    return slot;
  }
}

export class BookingService {
  public constructor(
    private readonly store: InMemoryMarketMeshStore,
    private readonly marketplace: MarketplaceService,
    private readonly config: MarketMeshConfig,
    private readonly hooks: MarketMeshHooks,
  ) {}

  public async createBooking(input: {
    bookingType: BookingType;
    buyerId: string;
    sellerId?: string;
    serviceId?: string;
    categoryId: string;
    requestDetails?: Record<string, unknown>;
    finalPrice?: number;
    startTime?: Date;
    endTime?: Date;
  }): Promise<Booking> {
    if (!this.store.buyerProfiles.has(input.buyerId)) {
      throw new Error('Buyer profile not found');
    }
    const service = input.serviceId ? this.store.services.get(input.serviceId) : undefined;
    const sellerId = input.sellerId ?? service?.sellerId;
    if (!sellerId || !this.store.sellerProfiles.has(sellerId)) {
      throw new Error('Seller profile not found');
    }
    if (!this.store.categories.has(input.categoryId)) {
      throw new Error('Category not found');
    }
    this.marketplace.reserveSlot(sellerId, input.startTime, input.endTime);
    const finalPrice = input.finalPrice ?? service?.price;
    const platformFeeAmount = finalPrice === undefined ? undefined : Math.round(finalPrice * this.config.platformFeePercent) / 100;
    const sellerPayoutAmount = finalPrice === undefined || platformFeeAmount === undefined ? undefined : finalPrice - platformFeeAmount;
    const now = this.store.now();
    const booking: Booking = {
      id: this.store.id(),
      bookingType: input.bookingType,
      status: 'PENDING',
      buyerId: input.buyerId,
      sellerId,
      serviceId: input.serviceId,
      categoryId: input.categoryId,
      requestDetails: input.requestDetails,
      finalPrice,
      platformFeePercent: this.config.platformFeePercent,
      platformFeeAmount,
      sellerPayoutAmount,
      payoutStatus: 'HOLD',
      startTime: input.startTime,
      endTime: input.endTime,
      createdAt: now,
      updatedAt: now,
    };
    this.store.bookings.set(booking.id, booking);
    this.createConversation(booking.id);
    await this.hooks.onBookingCreated?.(booking);
    return booking;
  }

  public getBooking(bookingId: string): Booking {
    const booking = this.store.bookings.get(bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }
    return booking;
  }

  public async updateStatus(bookingId: string, status: BookingStatus): Promise<Booking> {
    const booking = this.getBooking(bookingId);
    if (!statusTransitions[booking.status].includes(status)) {
      throw new Error(`Cannot transition booking from ${booking.status} to ${status}`);
    }
    booking.status = status;
    booking.updatedAt = this.store.now();
    if (status === 'COMPLETED') {
      booking.payoutStatus = 'CAPTURED';
      await this.hooks.onPaymentCaptured?.(booking);
    }
    return booking;
  }

  public createReview(input: { bookingId: string; authorId: string; recipientId: string; rating: number; comment?: string }): Review {
    const booking = this.getBooking(input.bookingId);
    if (booking.status !== 'COMPLETED') {
      throw new Error('Reviews are only allowed after completion');
    }
    if (![booking.buyerId, booking.sellerId].includes(input.authorId) || ![booking.buyerId, booking.sellerId].includes(input.recipientId)) {
      throw new Error('Review participants must belong to the booking');
    }
    if (input.authorId === input.recipientId) {
      throw new Error('Author and recipient must be different');
    }
    const existing = Array.from(this.store.reviews.values()).find((review) => review.bookingId === input.bookingId && review.authorId === input.authorId);
    if (existing) {
      throw new Error('Participant has already reviewed this booking');
    }
    const review: Review = {
      id: this.store.id(),
      bookingId: input.bookingId,
      authorId: input.authorId,
      recipientId: input.recipientId,
      role: input.authorId === booking.buyerId ? 'BUYER' : 'SELLER',
      rating: input.rating,
      comment: input.comment,
      createdAt: this.store.now(),
    };
    this.store.reviews.set(review.id, review);
    this.recalculateSellerRating(booking.sellerId);
    return review;
  }

  public createMessage(input: { conversationId: string; senderId: string; content: string; attachments?: string[] }): Message {
    const conversation = this.store.conversations.get(input.conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }
    const booking = this.getBooking(conversation.bookingId);
    if (![booking.buyerId, booking.sellerId].includes(input.senderId)) {
      throw new Error('Sender must belong to the booking conversation');
    }
    const message: Message = {
      id: this.store.id(),
      conversationId: input.conversationId,
      senderId: input.senderId,
      content: input.content,
      attachments: input.attachments ?? [],
      createdAt: this.store.now(),
    };
    this.store.messages.set(message.id, message);
    return message;
  }

  public getConversationByBookingId(bookingId: string): Conversation | undefined {
    return Array.from(this.store.conversations.values()).find((conversation) => conversation.bookingId === bookingId);
  }

  private createConversation(bookingId: string): Conversation {
    const existing = this.getConversationByBookingId(bookingId);
    if (existing) {
      return existing;
    }
    const conversation: Conversation = { id: this.store.id(), bookingId, createdAt: this.store.now() };
    this.store.conversations.set(conversation.id, conversation);
    return conversation;
  }

  private recalculateSellerRating(sellerId: string): void {
    const seller = this.store.sellerProfiles.get(sellerId);
    if (!seller) {
      return;
    }
    const sellerReviews = Array.from(this.store.reviews.values()).filter((review) => review.recipientId === sellerId);
    seller.reviewCount = sellerReviews.length;
    seller.averageRating = sellerReviews.length === 0 ? 0 : sellerReviews.reduce((sum, review) => sum + review.rating, 0) / sellerReviews.length;
  }
}

export class PaymentService {
  public constructor(private readonly store: InMemoryMarketMeshStore) {}

  public processWebhook(event: { id: string; type: string; bookingId?: string; paymentIntentId?: string; data?: { object?: { id?: string; metadata?: { bookingId?: string } } } }): StripeEventRecord {
    const existing = this.store.stripeEvents.get(event.id);
    if (existing) {
      return existing;
    }
    const record: StripeEventRecord = {
      id: event.id,
      eventId: event.id,
      eventType: event.type,
      processed: true,
      processedAt: this.store.now(),
      createdAt: this.store.now(),
    };
    this.store.stripeEvents.set(event.id, record);

    const bookingId = event.bookingId ?? event.data?.object?.metadata?.bookingId;
    if (bookingId) {
      const booking = this.store.bookings.get(bookingId);
      if (booking && event.type === 'payment_intent.succeeded') {
        booking.stripePaymentIntentId = event.paymentIntentId ?? event.data?.object?.id;
        booking.payoutStatus = 'CAPTURED';
        booking.updatedAt = this.store.now();
      }
      if (booking && event.type === 'payout.paid') {
        booking.payoutStatus = 'PAID';
        booking.updatedAt = this.store.now();
      }
    }

    return record;
  }
}
