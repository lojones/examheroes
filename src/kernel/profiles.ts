import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, type AuthenticatedRequest } from './common';
import { type KernelContext } from './index';
import { VerificationStatus } from '../types/marketmesh';

export function createProfilesRouter({ config, hooks, store }: KernelContext) {
  const router = Router();
  router.use(authenticate(config));

  router.get('/profiles/buyer', (req: AuthenticatedRequest, res) => {
    const profile = Array.from(store.buyerProfiles.values()).find((item) => item.userId === req.user?.sub);
    if (!profile) {
      res.status(404).json({ error: 'Buyer profile not found' });
      return;
    }
    res.json(profile);
  });

  router.post('/profiles/buyer', (req: AuthenticatedRequest, res) => {
    const existing = Array.from(store.buyerProfiles.values()).find((item) => item.userId === req.user?.sub);
    if (existing) {
      res.json(existing);
      return;
    }
    const now = new Date();
    const profile = {
      id: uuidv4(),
      userId: req.user!.sub,
      displayName: (req.body as { displayName?: string }).displayName ?? req.user!.email.split('@')[0],
      timezone: (req.body as { timezone?: string }).timezone ?? 'UTC',
      bio: (req.body as { bio?: string }).bio,
      createdAt: now,
      updatedAt: now,
    };
    store.buyerProfiles.set(profile.id, profile);
    res.status(201).json(profile);
  });

  router.get('/profiles/seller', (req: AuthenticatedRequest, res) => {
    const profile = Array.from(store.sellerProfiles.values()).find((item) => item.userId === req.user?.sub);
    if (!profile) {
      res.status(404).json({ error: 'Seller profile not found' });
      return;
    }
    res.json(profile);
  });

  router.post('/profiles/seller', async (req: AuthenticatedRequest, res) => {
    const existing = Array.from(store.sellerProfiles.values()).find((item) => item.userId === req.user?.sub);
    if (existing) {
      const activation = await hooks.beforeSellerActivation?.(existing, store);
      res.json({ sellerProfile: existing, activation });
      return;
    }
    const now = new Date();
    const profile = {
      id: uuidv4(),
      userId: req.user!.sub,
      displayName: (req.body as { displayName?: string }).displayName ?? req.user!.email.split('@')[0],
      bio: (req.body as { bio?: string }).bio,
      verificationStatus: VerificationStatus.PENDING,
      payoutSetup: false,
      createdAt: now,
      updatedAt: now,
    };
    store.sellerProfiles.set(profile.id, profile);
    const activation = await hooks.beforeSellerActivation?.(profile, store);
    res.status(201).json({ sellerProfile: profile, activation });
  });

  return router;
}
