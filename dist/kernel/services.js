"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServicesRouter = createServicesRouter;
const express_1 = require("express");
const common_1 = require("./common");
function createServicesRouter({ config, store }) {
    const router = (0, express_1.Router)();
    router.get('/services/search', (req, res) => {
        const { categoryId, categorySlug, examSlug, sellerId, activeOnly } = req.query;
        const listings = Array.from(store.services.values()).filter((service) => {
            const category = store.categories.get(service.categoryId);
            if (categoryId && service.categoryId !== categoryId)
                return false;
            if (sellerId && service.sellerId !== sellerId)
                return false;
            if ((categorySlug || examSlug) && category?.slug !== (categorySlug ?? examSlug))
                return false;
            if (activeOnly !== 'false' && !service.isActive)
                return false;
            return true;
        });
        res.json(listings);
    });
    router.post('/services', (0, common_1.authenticate)(config), (req, res) => {
        const sellerProfile = store.findSellerProfileByUserId(req.user?.sub ?? '');
        if (!sellerProfile) {
            res.status(403).json({ error: 'Seller profile required' });
            return;
        }
        const body = req.body;
        const listing = {
            id: store.id(),
            sellerId: sellerProfile.id,
            categoryId: String(body.categoryId ?? ''),
            title: String(body.title ?? ''),
            description: String(body.description ?? ''),
            price: Number(body.price ?? 0),
            currency: String(body.currency ?? config.defaultCurrency),
            pricingType: (body.pricingType ?? 'FIXED'),
            durationMinutes: Number(body.durationMinutes ?? 60),
            locationType: (body.locationType ?? 'REMOTE'),
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
    router.patch('/services/:id', (0, common_1.authenticate)(config), (req, res) => {
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
//# sourceMappingURL=services.js.map