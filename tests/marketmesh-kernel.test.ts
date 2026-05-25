import { createExamHeroesContext } from '../src/marketmesh';

describe('MarketMesh embedded-kernel contract', () => {
  it('exposes programmatic service properties and seeds categories', () => {
    const { kernel } = createExamHeroesContext();

    expect(kernel.platform.listCategories().map((category) => category.slug)).toContain('lsat');

    const sellerRegistration = kernel.auth.register({
      email: 'programmatic-seller@example.com',
      password: 'password123',
      asBuyer: false,
      asSeller: true,
    });
    const seller = kernel.store.findSellerProfileByUserId(sellerRegistration.user.id);
    expect(seller).toBeDefined();

    const buyerRegistration = kernel.auth.register({
      email: 'programmatic-buyer@example.com',
      password: 'password123',
      asBuyer: true,
      asSeller: false,
    });
    const buyer = kernel.store.findBuyerProfileByUserId(buyerRegistration.user.id);
    expect(buyer).toBeDefined();

    const verified = kernel.auth.verifyAccessToken(buyerRegistration.accessToken);
    expect(verified).toMatchObject({ id: buyerRegistration.user.id, roles: ['BUYER'], isAdmin: false });
  });

  it('supports the programmatic service listing, availability, booking, and payment lifecycle', async () => {
    const { kernel } = createExamHeroesContext();
    const category = kernel.platform.listCategories().find((item) => item.slug === 'lsat');
    expect(category).toBeDefined();

    const sellerUser = kernel.auth.register({ email: 'seller-flow@example.com', password: 'password123', asBuyer: false, asSeller: true }).user;
    const buyerUser = kernel.auth.register({ email: 'buyer-flow@example.com', password: 'password123', asBuyer: true, asSeller: false }).user;
    const seller = kernel.store.findSellerProfileByUserId(sellerUser.id)!;
    const buyer = kernel.store.findBuyerProfileByUserId(buyerUser.id)!;

    const service = kernel.marketplace.createService({
      sellerId: seller.id,
      categoryId: category!.id,
      title: 'LSAT reasoning rescue',
      description: 'Concept-first tutoring',
      price: 100,
      currency: 'USD',
      pricingType: 'FIXED',
      durationMinutes: 60,
      locationType: 'REMOTE',
      mediaUrls: [],
    });
    const slot = kernel.marketplace.addAvailability({
      sellerId: seller.id,
      startTime: new Date(Date.now() + 60_000),
      endTime: new Date(Date.now() + 3_600_000),
    });

    const booking = await kernel.bookings.createBooking({
      bookingType: 'DIRECT',
      buyerId: buyer.id,
      sellerId: seller.id,
      categoryId: category!.id,
      serviceId: service.id,
      startTime: slot.startTime,
      endTime: slot.endTime,
    });

    expect(booking.payoutStatus).toBe('HOLD');
    expect(kernel.bookings.getConversationByBookingId(booking.id)).toBeDefined();

    await kernel.bookings.updateStatus(booking.id, 'ACCEPTED');
    await kernel.bookings.updateStatus(booking.id, 'IN_PROGRESS');
    const completed = await kernel.bookings.updateStatus(booking.id, 'COMPLETED');

    expect(completed.payoutStatus).toBe('CAPTURED');
  });

  it('returns the MarketMesh health response envelope from createApp', async () => {
    const { kernel } = createExamHeroesContext();
    const app = kernel.createApp('/api/v1');
    const server = await new Promise<import('http').Server>((resolve) => {
      const instance = app.listen(0, () => resolve(instance));
    });
    const address = server.address();
    if (!address || typeof address === 'string') {
      throw new Error('Failed to start test server');
    }

    try {
      const response = await fetch(`http://127.0.0.1:${address.port}/api/v1/health`);
      await expect(response.json()).resolves.toEqual({
        success: true,
        data: { status: 'ok', service: 'marketmesh' },
      });
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    }
  });
});
