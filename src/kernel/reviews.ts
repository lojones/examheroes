import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, type AuthenticatedRequest } from './common';
import { type KernelContext } from './index';
import { BookingStatus } from '../types/marketmesh';

export function createReviewsRouter({ config, store }: KernelContext) {
  const router = Router();

  router.get('/reviews/seller/:sellerProfileId', (req, res) => {
    const reviews = Array.from(store.reviews.values()).filter((review) => review.targetSellerProfileId === req.params.sellerProfileId);
    res.json(reviews);
  });

  router.post('/reviews/:bookingId', authenticate(config), (req: AuthenticatedRequest, res) => {
    const booking = store.bookings.get(req.params.bookingId);
    if (!booking || booking.status !== BookingStatus.COMPLETED) {
      res.status(422).json({ error: 'Completed booking required' });
      return;
    }
    const review = {
      id: uuidv4(),
      bookingId: booking.id,
      authorUserId: req.user!.sub,
      targetSellerProfileId: booking.sellerProfileId,
      rating: Number((req.body as { rating?: number }).rating ?? 5),
      body: (req.body as { body?: string }).body,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    store.reviews.set(review.id, review);
    res.status(201).json(review);
  });

  return router;
}
