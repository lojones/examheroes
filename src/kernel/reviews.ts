import { Router } from 'express';
import { authenticate, type AuthenticatedRequest } from './common';
import { type KernelContext } from './index';

export function createReviewsRouter({ config, store }: KernelContext) {
  const router = Router();

  router.get('/reviews/seller/:sellerId', (req, res) => {
    const reviews = Array.from(store.reviews.values()).filter((review) => review.recipientId === req.params.sellerId && review.role === 'BUYER');
    res.json(reviews);
  });

  router.post('/reviews/:bookingId', authenticate(config), (req: AuthenticatedRequest, res) => {
    const booking = store.bookings.get(req.params.bookingId);
    if (!booking || booking.status !== 'COMPLETED') {
      res.status(422).json({ error: 'Completed booking required' });
      return;
    }

    const buyerProfile = store.findBuyerProfileByUserId(req.user?.sub ?? '');
    if (!buyerProfile || buyerProfile.id !== booking.buyerId) {
      res.status(403).json({ error: 'Buyer participant required' });
      return;
    }

    const review = {
      id: store.id(),
      bookingId: booking.id,
      authorId: req.user!.sub,
      recipientId: booking.sellerId,
      role: 'BUYER' as const,
      rating: Number((req.body as { rating?: number }).rating ?? 5),
      comment: (req.body as { comment?: string; body?: string }).comment ?? (req.body as { body?: string }).body,
      createdAt: store.now(),
    };
    store.reviews.set(review.id, review);
    res.status(201).json(review);
  });

  return router;
}
