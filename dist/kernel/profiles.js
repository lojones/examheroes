"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProfilesRouter = createProfilesRouter;
const express_1 = require("express");
const uuid_1 = require("uuid");
const common_1 = require("./common");
const marketmesh_1 = require("../types/marketmesh");
function createProfilesRouter({ config, hooks, store }) {
    const router = (0, express_1.Router)();
    router.use((0, common_1.authenticate)(config));
    router.get('/profiles/buyer', (req, res) => {
        const profile = Array.from(store.buyerProfiles.values()).find((item) => item.userId === req.user?.sub);
        if (!profile) {
            res.status(404).json({ error: 'Buyer profile not found' });
            return;
        }
        res.json(profile);
    });
    router.post('/profiles/buyer', (req, res) => {
        const existing = Array.from(store.buyerProfiles.values()).find((item) => item.userId === req.user?.sub);
        if (existing) {
            res.json(existing);
            return;
        }
        const now = new Date();
        const profile = {
            id: (0, uuid_1.v4)(),
            userId: req.user.sub,
            displayName: req.body.displayName ?? req.user.email.split('@')[0],
            timezone: req.body.timezone ?? 'UTC',
            bio: req.body.bio,
            createdAt: now,
            updatedAt: now,
        };
        store.buyerProfiles.set(profile.id, profile);
        res.status(201).json(profile);
    });
    router.get('/profiles/seller', (req, res) => {
        const profile = Array.from(store.sellerProfiles.values()).find((item) => item.userId === req.user?.sub);
        if (!profile) {
            res.status(404).json({ error: 'Seller profile not found' });
            return;
        }
        res.json(profile);
    });
    router.post('/profiles/seller', async (req, res) => {
        const existing = Array.from(store.sellerProfiles.values()).find((item) => item.userId === req.user?.sub);
        if (existing) {
            const activation = await hooks.beforeSellerActivation?.(existing, store);
            res.json({ sellerProfile: existing, activation });
            return;
        }
        const now = new Date();
        const profile = {
            id: (0, uuid_1.v4)(),
            userId: req.user.sub,
            displayName: req.body.displayName ?? req.user.email.split('@')[0],
            bio: req.body.bio,
            verificationStatus: marketmesh_1.VerificationStatus.PENDING,
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
//# sourceMappingURL=profiles.js.map