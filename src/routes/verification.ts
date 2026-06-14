import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, type AuthenticatedRequest } from '../kernel/common';
import { type ReturnTypeContext } from './shared';

export function createVerificationRouter(context: ReturnTypeContext) {
  const router = Router();
  router.use('/verification', authenticate(context.config));

  router.post('/verification/score', (req: AuthenticatedRequest, res) => {
    const sellerProfile = Array.from(context.store.sellerProfiles.values()).find((profile) => profile.userId === req.user?.sub);
    if (!sellerProfile) {
      res.status(403).json({ error: 'Seller profile required' });
      return;
    }
    const verification = {
      id: uuidv4(),
      sellerProfileId: sellerProfile.id,
      examProgramId: String((req.body as { examProgramId?: string }).examProgramId ?? ''),
      claimedScore: String((req.body as { claimedScore?: string }).claimedScore ?? ''),
      evidenceUrl: String((req.body as { evidenceUrl?: string }).evidenceUrl ?? ''),
      verificationStatus: 'PENDING',
      reviewedBy: undefined,
      reviewedAt: undefined,
      notes: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    context.store.scoreVerifications.set(verification.id, verification);
    res.status(201).json(verification);
  });

  router.post('/verification/teaching-sample', (req: AuthenticatedRequest, res) => {
    const sellerProfile = Array.from(context.store.sellerProfiles.values()).find((profile) => profile.userId === req.user?.sub);
    if (!sellerProfile) {
      res.status(403).json({ error: 'Seller profile required' });
      return;
    }
    const sample = {
      id: uuidv4(),
      sellerProfileId: sellerProfile.id,
      title: String((req.body as { title?: string }).title ?? 'Teaching sample'),
      description: (req.body as { description?: string }).description,
      sampleUrl: String((req.body as { sampleUrl?: string }).sampleUrl ?? ''),
      verificationStatus: 'PENDING',
      reviewedBy: undefined,
      reviewedAt: undefined,
      notes: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    context.store.teachingSamples.set(sample.id, sample);
    res.status(201).json(sample);
  });

  return router;
}
