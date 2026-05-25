"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPackagesRouter = createPackagesRouter;
const express_1 = require("express");
const uuid_1 = require("uuid");
const common_1 = require("../kernel/common");
function createPackagesRouter(context) {
    const router = (0, express_1.Router)();
    router.use('/packages', (0, common_1.authenticate)(context.config));
    router.post('/packages/plans', (req, res) => {
        const sellerProfile = context.store.findSellerProfileByUserId(req.user?.sub ?? '');
        if (!sellerProfile) {
            res.status(403).json({ error: 'Seller profile required' });
            return;
        }
        const plan = {
            id: (0, uuid_1.v4)(),
            sellerProfileId: sellerProfile.id,
            title: String(req.body.title ?? ''),
            description: req.body.description,
            sessionCount: Number(req.body.sessionCount ?? 1),
            priceAmount: Number(req.body.priceAmount ?? 0),
            currency: String(req.body.currency ?? context.config.defaultCurrency),
            expiryDays: Number(req.body.expiryDays ?? 90),
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        context.store.packagePlans.set(plan.id, plan);
        res.status(201).json(plan);
    });
    router.post('/packages/purchase', (req, res) => {
        const buyerProfile = context.store.findBuyerProfileByUserId(req.user?.sub ?? '');
        if (!buyerProfile) {
            res.status(403).json({ error: 'Buyer profile required' });
            return;
        }
        const plan = context.store.packagePlans.get(String(req.body.packagePlanId ?? ''));
        if (!plan) {
            res.status(404).json({ error: 'Package plan not found' });
            return;
        }
        const purchase = {
            id: (0, uuid_1.v4)(),
            packagePlanId: plan.id,
            buyerProfileId: buyerProfile.id,
            totalSessions: plan.sessionCount,
            usedSessions: 0,
            expiresAt: new Date(Date.now() + plan.expiryDays * 24 * 60 * 60 * 1000),
            status: 'ACTIVE',
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        context.store.packagePurchases.set(purchase.id, purchase);
        res.status(201).json(purchase);
    });
    router.get('/packages/me', (req, res) => {
        const buyerProfile = context.store.findBuyerProfileByUserId(req.user?.sub ?? '');
        if (!buyerProfile) {
            res.status(403).json({ error: 'Buyer profile required' });
            return;
        }
        res.json(Array.from(context.store.packagePurchases.values()).filter((purchase) => purchase.buyerProfileId === buyerProfile.id));
    });
    router.post('/packages/:purchaseId/apply-to-booking', (req, res) => {
        const purchase = context.store.packagePurchases.get(req.params.purchaseId);
        const booking = context.store.bookings.get(String(req.body.bookingId ?? ''));
        if (!purchase || !booking) {
            res.status(404).json({ error: 'Purchase or booking not found' });
            return;
        }
        if (purchase.usedSessions >= purchase.totalSessions) {
            res.status(422).json({ error: 'No package credits remaining' });
            return;
        }
        purchase.usedSessions += 1;
        purchase.status = purchase.usedSessions >= purchase.totalSessions ? 'EXHAUSTED' : purchase.status;
        purchase.updatedAt = new Date();
        booking.requestDetails = {
            ...(booking.requestDetails ?? {}),
            packagePurchaseId: purchase.id,
        };
        booking.updatedAt = new Date();
        context.store.packagePurchases.set(purchase.id, purchase);
        context.store.bookings.set(booking.id, booking);
        res.json({ purchase, booking });
    });
    return router;
}
//# sourceMappingURL=packages.js.map