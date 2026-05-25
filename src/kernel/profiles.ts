import { Router } from 'express';
import { authenticate, type AuthenticatedRequest } from './common';
import { type KernelContext } from './index';

export function createProfilesRouter({ config, hooks, store }: KernelContext) {
  const router = Router();
  router.use(authenticate(config));

  router.get('/profiles/buyer', (req: AuthenticatedRequest, res) => {
    const profile = store.findBuyerProfileByUserId(req.user?.sub ?? '');
    if (!profile) {
      res.status(404).json({ error: 'Buyer profile not found' });
      return;
    }
    res.json(profile);
  });

  router.post('/profiles/buyer', (req: AuthenticatedRequest, res) => {
    const existing = store.findBuyerProfileByUserId(req.user?.sub ?? '');
    if (existing) {
      res.json(existing);
      return;
    }

    store.ensureUserRole(req.user!.sub, 'BUYER');
    const profile = {
      id: store.id(),
      userId: req.user!.sub,
      preferences: {
        displayName: (req.body as { displayName?: string }).displayName ?? req.user!.email.split('@')[0],
        timezone: (req.body as { timezone?: string }).timezone ?? 'UTC',
        bio: (req.body as { bio?: string }).bio,
      },
    };
    store.buyerProfiles.set(profile.id, profile);
    res.status(201).json(profile);
  });

  router.get('/profiles/seller', (req: AuthenticatedRequest, res) => {
    const profile = store.findSellerProfileByUserId(req.user?.sub ?? '');
    if (!profile) {
      res.status(404).json({ error: 'Seller profile not found' });
      return;
    }
    res.json(profile);
  });

  router.post('/profiles/seller', async (req: AuthenticatedRequest, res) => {
    const existing = store.findSellerProfileByUserId(req.user?.sub ?? '');
    if (existing) {
      try {
        await hooks.beforeSellerActivation?.(existing.id);
      } catch (error) {
        res.status(422).json({ error: error instanceof Error ? error.message : 'Seller activation blocked' });
        return;
      }
      res.json({ sellerProfile: existing, onboarding: await hooks.customizeSellerOnboarding?.(existing.id) });
      return;
    }

    store.ensureUserRole(req.user!.sub, 'SELLER');
    const profile = {
      id: store.id(),
      userId: req.user!.sub,
      bio: (req.body as { bio?: string }).bio,
      verificationStatus: 'PENDING' as const,
      stripeConnectAccountId: undefined,
      averageRating: 0,
      reviewCount: 0,
      location: (req.body as { location?: Record<string, unknown> }).location,
      radiusKm: Number((req.body as { radiusKm?: number }).radiusKm ?? 0),
      isOnline: Boolean((req.body as { isOnline?: boolean }).isOnline ?? false),
    };
    store.sellerProfiles.set(profile.id, profile);

    try {
      await hooks.beforeSellerActivation?.(profile.id);
    } catch (error) {
      res.status(422).json({ error: error instanceof Error ? error.message : 'Seller activation blocked' });
      return;
    }

    res.status(201).json({ sellerProfile: profile, onboarding: await hooks.customizeSellerOnboarding?.(profile.id) });
  });

  return router;
}
