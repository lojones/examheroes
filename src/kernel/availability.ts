import { Router } from 'express';
import { authenticate, parseDate, type AuthenticatedRequest } from './common';
import { type KernelContext } from './index';

export function createAvailabilityRouter({ config, store }: KernelContext) {
  const router = Router();

  router.get('/availability/:sellerId', (req, res) => {
    const slots = Array.from(store.availabilitySlots.values()).filter((slot) => slot.sellerId === req.params.sellerId);
    res.json(slots);
  });

  router.post('/availability', authenticate(config), (req: AuthenticatedRequest, res) => {
    const sellerProfile = store.findSellerProfileByUserId(req.user?.sub ?? '');
    if (!sellerProfile) {
      res.status(403).json({ error: 'Seller profile required' });
      return;
    }
    try {
      const slot = {
        id: store.id(),
        sellerId: sellerProfile.id,
        startTime: parseDate((req.body as { startTime: string }).startTime),
        endTime: parseDate((req.body as { endTime: string }).endTime),
        isBooked: false,
        recurringRule: (req.body as { recurringRule?: Record<string, unknown> }).recurringRule,
      };
      store.availabilitySlots.set(slot.id, slot);
      res.status(201).json(slot);
    } catch {
      res.status(400).json({ error: 'Invalid availability payload' });
    }
  });

  router.delete('/availability/:id', authenticate(config), (req: AuthenticatedRequest, res) => {
    const slot = store.availabilitySlots.get(req.params.id);
    const sellerProfile = store.findSellerProfileByUserId(req.user?.sub ?? '');
    if (!slot || !sellerProfile || slot.sellerId !== sellerProfile.id) {
      res.status(404).json({ error: 'Availability slot not found' });
      return;
    }
    store.availabilitySlots.delete(slot.id);
    res.status(204).send();
  });

  return router;
}
