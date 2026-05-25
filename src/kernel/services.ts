import { Router } from 'express';
import { authenticate, type AuthenticatedRequest } from './common';
import { type KernelContext } from './index';
import type { LocationType, PricingType } from '../types/marketmesh';

export function createServicesRouter({ config, store }: KernelContext) {
  const router = Router();

  router.get('/services/search', (req, res) => {
    const { categoryId, categorySlug, examSlug, sellerId, activeOnly } = req.query as Record<string, string | undefined>;
    const listings = Array.from(store.services.values()).filter((service) => {
      const category = store.categories.get(service.categoryId);
      if (categoryId && service.categoryId !== categoryId) return false;
      if (sellerId && service.sellerId !== sellerId) return false;
      if ((categorySlug || examSlug) && category?.slug !== (categorySlug ?? examSlug)) return false;
      if (activeOnly !== 'false' && !service.isActive) return false;
      return true;
    });
    res.json(listings);
  });

  router.post('/services', authenticate(config), (req: AuthenticatedRequest, res) => {
    const sellerProfile = store.findSellerProfileByUserId(req.user?.sub ?? '');
    if (!sellerProfile) {
      res.status(403).json({ error: 'Seller profile required' });
      return;
    }

    const body = req.body as Partial<{
      categoryId: string;
      title: string;
      description: string;
      price: number;
      currency: string;
      pricingType: PricingType;
      durationMinutes: number;
      locationType: LocationType;
      location: Record<string, unknown>;
      mediaUrls: string[];
      isActive: boolean;
      examSlug: string;
      sections: string[];
      topics: string[];
    }>;

    const listing = {
      id: store.id(),
      sellerId: sellerProfile.id,
      categoryId: String(body.categoryId ?? ''),
      title: String(body.title ?? ''),
      description: String(body.description ?? ''),
      price: Number(body.price ?? 0),
      currency: String(body.currency ?? config.defaultCurrency),
      pricingType: (body.pricingType ?? 'FIXED') as PricingType,
      durationMinutes: Number(body.durationMinutes ?? 60),
      locationType: (body.locationType ?? 'REMOTE') as LocationType,
      location: body.location ?? {
        examSlug: body.examSlug,
        sections: body.sections ?? [],
        topics: body.topics ?? [],
      },
      mediaUrls: Array.isArray(body.mediaUrls) ? body.mediaUrls : [],
      isActive: Boolean(body.isActive ?? true),
      createdAt: store.now(),
    };

    store.services.set(listing.id, listing);
    res.status(201).json(listing);
  });

  router.get('/services/:id', (req, res) => {
    const listing = store.services.get(req.params.id);
    if (!listing) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }
    res.json(listing);
  });

  router.patch('/services/:id', authenticate(config), (req: AuthenticatedRequest, res) => {
    const listing = store.services.get(req.params.id);
    if (!listing) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }
    const sellerProfile = store.findSellerProfileByUserId(req.user?.sub ?? '');
    if (!sellerProfile || sellerProfile.id !== listing.sellerId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    Object.assign(listing, req.body);
    store.services.set(listing.id, listing);
    res.json(listing);
  });

  return router;
}
