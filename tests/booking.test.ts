import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { createSeededContext, startBookingServer } from './helpers';

describe('booking and payment flows', () => {
  it('onBookingCreated hook creates TutoringSession', async () => {
    const seeded = createSeededContext();
    const booking = {
      id: uuidv4(),
      bookingType: 'DIRECT' as const,
      buyerId: seeded.buyerProfile.id,
      sellerId: seeded.sellerProfile.id,
      serviceId: seeded.serviceListing.id,
      categoryId: seeded.category.id,
      status: 'PENDING' as const,
      finalPrice: 100,
      platformFeePercent: 18,
      platformFeeAmount: 18,
      sellerPayoutAmount: 82,
      payoutStatus: 'PENDING' as const,
      requestDetails: { availabilitySlotId: seeded.availabilitySlot.id },
      startTime: seeded.availabilitySlot.startTime,
      endTime: seeded.availabilitySlot.endTime,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    seeded.context.store.bookings.set(booking.id, booking);
    await seeded.context.hooks.onBookingCreated?.(booking);
    const session = Array.from(seeded.context.store.tutoringSessions.values()).find((item) => item.bookingId === booking.id);
    expect(session).toBeDefined();
  });

  it('extendBookingPayload returns only safe fields', async () => {
    const seeded = createSeededContext();
    const booking = {
      id: uuidv4(),
      bookingType: 'DIRECT' as const,
      buyerId: seeded.buyerProfile.id,
      sellerId: seeded.sellerProfile.id,
      serviceId: seeded.serviceListing.id,
      categoryId: seeded.category.id,
      status: 'PENDING' as const,
      finalPrice: 100,
      platformFeePercent: 18,
      platformFeeAmount: 18,
      sellerPayoutAmount: 82,
      payoutStatus: 'PENDING' as const,
      requestDetails: { availabilitySlotId: seeded.availabilitySlot.id, safeNote: 'safe note' },
      startTime: seeded.availabilitySlot.startTime,
      endTime: seeded.availabilitySlot.endTime,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    seeded.context.store.bookings.set(booking.id, booking);
    const payload = (await seeded.context.hooks.extendBookingPayload?.(booking)) as Record<string, unknown>;
    expect(payload.examSlug).toBe('lsat');
    expect(payload).not.toHaveProperty('moderationNotes');
    expect(payload).not.toHaveProperty('fraudScore');
    expect(payload).not.toHaveProperty('paymentSecret');
    expect(payload).not.toHaveProperty('licensedContent');
    expect(payload).not.toHaveProperty('scoreDocuments');
  });

  it('Booking fails when hero lacks verified expertise', () => {
    const seeded = createSeededContext();
    seeded.context.store.heroExamExpertise.clear();
    const preflight = seeded.context.services.integrityModerationService.canBookingProceed({
      buyerId: seeded.buyerProfile.id,
      sellerId: seeded.sellerProfile.id,
      serviceId: seeded.serviceListing.id,
      categoryId: seeded.category.id,
      startTime: seeded.availabilitySlot.startTime,
      endTime: seeded.availabilitySlot.endTime,
      requestDetails: { requestDescription: 'Need concept review' },
    });
    expect(preflight.allowed).toBe(false);
    expect(preflight.reasons).toContain('Hero lacks verified expertise for the exam');
  });

  it('Booking fails when learner has not attested to policy', () => {
    const seeded = createSeededContext();
    const filtered = new Map(
      Array.from(seeded.context.store.integrityAttestations.entries()).filter(([, attestation]) => attestation.userId !== seeded.buyerUser.id),
    );
    (seeded.context.store as { integrityAttestations: typeof filtered }).integrityAttestations = filtered;
    const preflight = seeded.context.services.integrityModerationService.canBookingProceed({
      buyerId: seeded.buyerProfile.id,
      sellerId: seeded.sellerProfile.id,
      serviceId: seeded.serviceListing.id,
      categoryId: seeded.category.id,
      startTime: seeded.availabilitySlot.startTime,
      endTime: seeded.availabilitySlot.endTime,
      requestDetails: { requestDescription: 'Need concept review' },
    });
    expect(preflight.allowed).toBe(false);
    expect(preflight.reasons).toContain('Learner has not attested to the current integrity policy');
  });

  it('Package credit reserve and consume', async () => {
    const started = await startBookingServer();
    try {
      const plan = {
        id: uuidv4(),
        sellerProfileId: started.sellerProfile.id,
        title: 'Starter Pack',
        description: '3 sessions',
        sessionCount: 3,
        priceAmount: 300,
        currency: 'USD',
        expiryDays: 90,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      started.context.store.packagePlans.set(plan.id, plan);
      const purchase = {
        id: uuidv4(),
        packagePlanId: plan.id,
        buyerProfileId: started.buyerProfile.id,
        totalSessions: 3,
        usedSessions: 0,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      started.context.store.packagePurchases.set(purchase.id, purchase);

      const response = await fetch(`${started.baseUrl}/api/v1/bookings`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${started.buyerAccessToken}`,
        },
        body: JSON.stringify({
          sellerId: started.sellerProfile.id,
          serviceId: started.serviceListing.id,
          availabilitySlotId: started.availabilitySlot.id,
          packagePurchaseId: purchase.id,
          requestDetails: { requestDescription: 'Need help with logic games strategy' },
        }),
      });
      expect(response.status).toBe(201);
      const updatedPurchase = started.context.store.packagePurchases.get(purchase.id);
      expect(updatedPurchase?.usedSessions).toBe(1);
    } finally {
      await new Promise<void>((resolve, reject) => started.server.close((error) => (error ? reject(error) : resolve())));
    }
  });

  it('Webhook signature verification rejection', () => {
    const seeded = createSeededContext();
    const payload = JSON.stringify({ id: 'evt_1', type: 'payment_intent.succeeded' });
    const badSignature = crypto.createHash('sha256').update(payload).digest('hex');
    expect(() => seeded.context.services.paymentAdapter.handleWebhook(payload, badSignature)).toThrow('Invalid webhook signature');
  });
});
