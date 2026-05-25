"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProfilesRouter = createProfilesRouter;
const express_1 = require("express");
const common_1 = require("./common");
function createProfilesRouter({ config, hooks, store }) {
    const router = (0, express_1.Router)();
    router.use((0, common_1.authenticate)(config));
    router.get('/profiles/buyer', (req, res) => {
        const profile = store.findBuyerProfileByUserId(req.user?.sub ?? '');
        if (!profile) {
            res.status(404).json({ error: 'Buyer profile not found' });
            return;
        }
        res.json(profile);
    });
    router.post('/profiles/buyer', (req, res) => {
        const existing = store.findBuyerProfileByUserId(req.user?.sub ?? '');
        if (existing) {
            res.json(existing);
            return;
        }
        store.ensureUserRole(req.user.sub, 'BUYER');
        const profile = {
            id: store.id(),
            userId: req.user.sub,
            preferences: {
                displayName: req.body.displayName ?? req.user.email.split('@')[0],
                timezone: req.body.timezone ?? 'UTC',
                bio: req.body.bio,
            },
        };
        store.buyerProfiles.set(profile.id, profile);
        res.status(201).json(profile);
    });
    router.get('/profiles/seller', (req, res) => {
        const profile = store.findSellerProfileByUserId(req.user?.sub ?? '');
        if (!profile) {
            res.status(404).json({ error: 'Seller profile not found' });
            return;
        }
        res.json(profile);
    });
    router.post('/profiles/seller', async (req, res) => {
        const existing = store.findSellerProfileByUserId(req.user?.sub ?? '');
        if (existing) {
            try {
                await hooks.beforeSellerActivation?.(existing.id);
            }
            catch (error) {
                res.status(422).json({ error: error instanceof Error ? error.message : 'Seller activation blocked' });
                return;
            }
            res.json({ sellerProfile: existing, onboarding: await hooks.customizeSellerOnboarding?.(existing.id) });
            return;
        }
        store.ensureUserRole(req.user.sub, 'SELLER');
        const profile = {
            id: store.id(),
            userId: req.user.sub,
            bio: req.body.bio,
            verificationStatus: 'PENDING',
            stripeConnectAccountId: undefined,
            averageRating: 0,
            reviewCount: 0,
            location: req.body.location,
            radiusKm: Number(req.body.radiusKm ?? 0),
            isOnline: Boolean(req.body.isOnline ?? false),
        };
        store.sellerProfiles.set(profile.id, profile);
        try {
            await hooks.beforeSellerActivation?.(profile.id);
        }
        catch (error) {
            res.status(422).json({ error: error instanceof Error ? error.message : 'Seller activation blocked' });
            return;
        }
        res.status(201).json({ sellerProfile: profile, onboarding: await hooks.customizeSellerOnboarding?.(profile.id) });
    });
    return router;
}
//# sourceMappingURL=profiles.js.map