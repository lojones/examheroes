import { Router } from 'express';
import { authenticate, requireRole, type AuthenticatedRequest } from '../kernel/common';
import { type ReturnTypeContext } from './shared';

export function createAdminHostRouter(context: ReturnTypeContext) {
  const router = Router();
  router.use('/admin', authenticate(context.config), requireRole(['ADMIN']));

  router.post('/admin/hero-review/:sellerProfileId/approve', (req: AuthenticatedRequest, res) => {
    res.json(context.services.heroVerificationService.approveHero(req.params.sellerProfileId, req.user!.sub));
  });

  router.post('/admin/hero-review/:sellerProfileId/suspend', (req: AuthenticatedRequest, res) => {
    res.json(
      context.services.heroVerificationService.suspendHero(
        req.params.sellerProfileId,
        req.user!.sub,
        String((req.body as { reason?: string }).reason ?? 'No reason provided'),
      ),
    );
  });

  router.get('/admin/moderation/reports', (_req, res) => {
    res.json(Array.from(context.store.integrityReports.values()));
  });

  router.post('/admin/moderation/reports/:id/action', (req: AuthenticatedRequest, res) => {
    res.json(
      context.services.integrityModerationService.reviewReport(
        req.params.id,
        String((req.body as { action?: string }).action ?? 'resolve'),
        req.user!.sub,
        String((req.body as { reason?: string }).reason ?? 'Reviewed'),
      ),
    );
  });

  return router;
}
