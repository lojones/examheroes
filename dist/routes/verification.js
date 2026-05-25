"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createVerificationRouter = createVerificationRouter;
const express_1 = require("express");
const uuid_1 = require("uuid");
const common_1 = require("../kernel/common");
function createVerificationRouter(context) {
    const router = (0, express_1.Router)();
    router.use('/verification', (0, common_1.authenticate)(context.config));
    router.post('/verification/score', (req, res) => {
        const sellerProfile = Array.from(context.store.sellerProfiles.values()).find((profile) => profile.userId === req.user?.sub);
        if (!sellerProfile) {
            res.status(403).json({ error: 'Seller profile required' });
            return;
        }
        const verification = {
            id: (0, uuid_1.v4)(),
            sellerProfileId: sellerProfile.id,
            examProgramId: String(req.body.examProgramId ?? ''),
            claimedScore: String(req.body.claimedScore ?? ''),
            evidenceUrl: String(req.body.evidenceUrl ?? ''),
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
    router.post('/verification/teaching-sample', (req, res) => {
        const sellerProfile = Array.from(context.store.sellerProfiles.values()).find((profile) => profile.userId === req.user?.sub);
        if (!sellerProfile) {
            res.status(403).json({ error: 'Seller profile required' });
            return;
        }
        const sample = {
            id: (0, uuid_1.v4)(),
            sellerProfileId: sellerProfile.id,
            title: String(req.body.title ?? 'Teaching sample'),
            description: req.body.description,
            sampleUrl: String(req.body.sampleUrl ?? ''),
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
//# sourceMappingURL=verification.js.map