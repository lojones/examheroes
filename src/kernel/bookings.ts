import { Router } from 'express';
import { authenticate, type AuthenticatedRequest } from './common';
import { type KernelContext } from './index';
import type { ReviewRole } from '../types/marketmesh';

export function createBookingsRouter({ config, hooks, store }: KernelContext) {
  const router = Router();

  router.post('/bookings', authenticate(config), async (req: AuthenticatedRequest, res) => {
    const buyerProfile = store.findBuyerProfileByUserId(req.user?.sub ?? '');
    if (!buyerProfile) {
      res.status(403).json({ error: 'Buyer profile required' });
      return;
    }

    const body = req.body as {
      sellerId?: string;
      serviceId?: string;
      availabilitySlotId?: string;
      requestDetails?: Record<string, unknown>;
      packagePurchaseId?: string;
      contentUploadIds?: string[];
      notes?: string;
      bookingType?: 'DIRECT' | 'REQUEST';
    };

    if (!body.sellerId || !body.serviceId || !body.availabilitySlotId) {
      res.status(400).json({ error: 'Missing booking fields' });
      return;
    }

    const service = store.services.get(body.serviceId);
    const slot = store.availabilitySlots.get(body.availabilitySlotId);
    if (!service || !slot) {
      res.status(404).json({ error: 'Service or slot not found' });
      return;
    }
    if (slot.isBooked) {
      res.status(422).json({ error: 'Availability slot already booked' });
      return;
    }

    const finalPrice = service.price;
    const platformFeePercent = config.platformFeePercent;
    const platformFeeAmount = Number(((finalPrice * platformFeePercent) / 100).toFixed(2));
    const sellerPayoutAmount = Number((finalPrice - platformFeeAmount).toFixed(2));
    const now = store.now();
    const booking = {
      id: store.id(),
      bookingType: body.bookingType ?? 'DIRECT',
      status: 'PENDING' as const,
      buyerId: buyerProfile.id,
      sellerId: body.sellerId,
      serviceId: body.serviceId,
      categoryId: service.categoryId,
      requestDetails: {
        ...(body.requestDetails ?? {}),
        availabilitySlotId: body.availabilitySlotId,
        notes: body.notes,
        packagePurchaseId: body.packagePurchaseId,
        contentUploadIds: body.contentUploadIds ?? [],
      },
      finalPrice,
      platformFeePercent,
      platformFeeAmount,
      sellerPayoutAmount,
      payoutStatus: 'PENDING' as const,
      startTime: slot.startTime,
      endTime: slot.endTime,
      createdAt: now,
      updatedAt: now,
    };
    store.bookings.set(booking.id, booking);
    slot.isBooked = true;
    store.availabilitySlots.set(slot.id, slot);

    if (body.packagePurchaseId) {
      const purchase = store.packagePurchases.get(body.packagePurchaseId);
      if (purchase) {
        purchase.usedSessions += 1;
        purchase.status = purchase.usedSessions >= purchase.totalSessions ? 'EXHAUSTED' : purchase.status;
        purchase.updatedAt = store.now();
        store.packagePurchases.set(purchase.id, purchase);
      }
    }

    await hooks.onBookingCreated?.(booking);
    res.status(201).json(booking);
  });

  router.get('/bookings/:id', authenticate(config), async (req, res) => {
    const booking = store.bookings.get(req.params.id);
    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }
    const extension = (await hooks.extendBookingPayload?.(booking)) ?? {};
    res.json({ ...booking, ...extension });
  });

  router.patch('/bookings/:id/status', authenticate(config), async (req: AuthenticatedRequest, res) => {
    const booking = store.bookings.get(req.params.id);
    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }
    const nextStatus = (req.body as { status?: typeof booking.status }).status;
    if (!nextStatus) {
      res.status(400).json({ error: 'Missing status' });
      return;
    }
    const previousStatus = booking.status;
    booking.status = nextStatus;
    booking.updatedAt = store.now();
    store.bookings.set(booking.id, booking);
    if (previousStatus !== 'COMPLETED' && nextStatus === 'COMPLETED') {
      booking.payoutStatus = 'CAPTURED';
      await hooks.onPaymentCaptured?.(booking);
    }
    res.json(booking);
  });

  router.post('/bookings/:id/reviews', authenticate(config), (req: AuthenticatedRequest, res) => {
    const booking = store.bookings.get(req.params.id);
    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }
    if (booking.status !== 'COMPLETED') {
      res.status(422).json({ error: 'Booking must be completed before review' });
      return;
    }

    const buyerProfile = store.findBuyerProfileByUserId(req.user?.sub ?? '');
    const sellerProfile = store.findSellerProfileByUserId(req.user?.sub ?? '');
    let role: ReviewRole;
    let recipientId: string;

    if (buyerProfile?.id === booking.buyerId) {
      role = 'BUYER';
      recipientId = booking.sellerId;
    } else if (sellerProfile?.id === booking.sellerId) {
      role = 'SELLER';
      recipientId = booking.buyerId;
    } else {
      res.status(403).json({ error: 'Only booking participants can review' });
      return;
    }

    const review = {
      id: store.id(),
      bookingId: booking.id,
      authorId: req.user!.sub,
      recipientId,
      role,
      rating: Number((req.body as { rating?: number }).rating ?? 5),
      comment: (req.body as { comment?: string; body?: string }).comment ?? (req.body as { body?: string }).body,
      createdAt: store.now(),
    };
    store.reviews.set(review.id, review);

    if (role === 'BUYER') {
      const seller = store.sellerProfiles.get(booking.sellerId);
      if (seller) {
        seller.reviewCount += 1;
        seller.averageRating = Number((((seller.averageRating * (seller.reviewCount - 1)) + review.rating) / seller.reviewCount).toFixed(2));
        store.sellerProfiles.set(seller.id, seller);
      }
    }

    res.status(201).json(review);
  });

  return router;
}
