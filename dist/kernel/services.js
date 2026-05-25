"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServicesRouter = createServicesRouter;
const express_1 = require("express");
const uuid_1 = require("uuid");
const common_1 = require("./common");
function createServicesRouter({ config, store }) {
    const router = (0, express_1.Router)();
    router.get('/services/search', (req, res) => {
        const { examSlug, categoryId, sellerProfileId, serviceType, activeOnly } = req.query;
        const listings = Array.from(store.serviceListings.values()).filter((service) => {
            if (examSlug && service.examSlug !== examSlug)
                return false;
            if (categoryId && service.categoryId !== categoryId)
                return false;
            if (sellerProfileId && service.sellerProfileId !== sellerProfileId)
                return false;
            if (serviceType && service.serviceType !== serviceType)
                return false;
            if (activeOnly !== 'false' && !service.isActive)
                return false;
            return true;
        });
        res.json(listings);
    });
    router.post('/services', (0, common_1.authenticate)(config), (req, res) => {
        const sellerProfile = Array.from(store.sellerProfiles.values()).find((profile) => profile.userId === req.user?.sub);
        if (!sellerProfile) {
            res.status(403).json({ error: 'Seller profile required' });
            return;
        }
        const now = new Date();
        const body = req.body;
        const listing = {
            id: (0, uuid_1.v4)(),
            sellerProfileId: sellerProfile.id,
            categoryId: String(body.categoryId),
            title: String(body.title ?? ''),
            description: String(body.description ?? ''),
            serviceType: String(body.serviceType ?? 'concept'),
            priceAmount: Number(body.priceAmount ?? 0),
            currency: String(body.currency ?? store.platformConfig.defaultCurrency),
            durationMinutes: Number(body.durationMinutes ?? 60),
            isActive: Boolean(body.isActive ?? true),
            examSlug: String(body.examSlug ?? ''),
            sections: Array.isArray(body.sections) ? body.sections : [],
            topics: Array.isArray(body.topics) ? body.topics : [],
            prerequisitesSummary: body.prerequisitesSummary ? String(body.prerequisitesSummary) : undefined,
            allowedMaterialsSummary: body.allowedMaterialsSummary ? String(body.allowedMaterialsSummary) : undefined,
            recordingPolicy: body.recordingPolicy ? String(body.recordingPolicy) : undefined,
            homeworkPolicy: body.homeworkPolicy ? String(body.homeworkPolicy) : undefined,
            packagePlanId: body.packagePlanId ? String(body.packagePlanId) : undefined,
            cohortClassId: body.cohortClassId ? String(body.cohortClassId) : undefined,
            createdAt: now,
            updatedAt: now,
        };
        store.serviceListings.set(listing.id, listing);
        res.status(201).json(listing);
    });
    router.get('/services/:id', (req, res) => {
        const listing = store.serviceListings.get(req.params.id);
        if (!listing) {
            res.status(404).json({ error: 'Service not found' });
            return;
        }
        res.json(listing);
    });
    router.patch('/services/:id', (0, common_1.authenticate)(config), (req, res) => {
        const listing = store.serviceListings.get(req.params.id);
        if (!listing) {
            res.status(404).json({ error: 'Service not found' });
            return;
        }
        const sellerProfile = Array.from(store.sellerProfiles.values()).find((profile) => profile.userId === req.user?.sub);
        if (!sellerProfile || sellerProfile.id !== listing.sellerProfileId) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }
        Object.assign(listing, req.body, { updatedAt: new Date() });
        store.serviceListings.set(listing.id, listing);
        res.json(listing);
    });
    return router;
}
//# sourceMappingURL=services.js.map