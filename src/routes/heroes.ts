import { Router } from 'express';
import { authenticate, type AuthenticatedRequest } from '../kernel/common';
import { type ReturnTypeContext } from './shared';

export function createHeroesRouter(context: ReturnTypeContext) {
  const router = Router();
  router.get('/heroes/onboarding/me', authenticate(context.config), (req: AuthenticatedRequest, res) => {
    const sellerProfile = Array.from(context.store.sellerProfiles.values()).find((profile) => profile.userId === req.user?.sub);
    if (!sellerProfile) {
      res.status(404).json({ error: 'Seller profile not found' });
      return;
    }
    const expertise = Array.from(context.store.heroExamExpertise.values()).filter((item) => item.sellerProfileId === sellerProfile.id);
    const credential = Array.from(context.store.heroCredentials.values()).find((item) => item.sellerProfileId === sellerProfile.id);
    res.json({
      sellerProfile,
      credentialSubmitted: Boolean(credential),
      expertiseClaims: expertise,
      canPublish: expertise.some((item) => context.services.heroVerificationService.canPublishService(sellerProfile.id, context.store.examPrograms.get(item.examProgramId)?.slug ?? '')),
    });
  });
  return router;
}
