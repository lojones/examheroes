import { Router } from 'express';
import { authenticate, requireRole } from './common';
import { type KernelContext } from './index';

export function createAdminRouter({ config, store }: KernelContext) {
  const router = Router();
  router.use('/admin', authenticate(config), requireRole(['ADMIN']));

  router.get('/admin/analytics', (_req, res) => {
    res.json({
      users: store.users.size,
      buyers: store.buyerProfiles.size,
      sellers: store.sellerProfiles.size,
      listings: store.services.size,
      bookings: store.bookings.size,
      reviews: store.reviews.size,
      openReports: Array.from(store.integrityReports.values()).filter((report) => report.status === 'OPEN').length,
    });
  });

  return router;
}
