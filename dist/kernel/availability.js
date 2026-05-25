"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAvailabilityRouter = createAvailabilityRouter;
const express_1 = require("express");
const common_1 = require("./common");
function createAvailabilityRouter({ config, store }) {
    const router = (0, express_1.Router)();
    router.get('/availability/:sellerId', (req, res) => {
        const slots = Array.from(store.availabilitySlots.values()).filter((slot) => slot.sellerId === req.params.sellerId);
        res.json(slots);
    });
    router.post('/availability', (0, common_1.authenticate)(config), (req, res) => {
        const sellerProfile = store.findSellerProfileByUserId(req.user?.sub ?? '');
        if (!sellerProfile) {
            res.status(403).json({ error: 'Seller profile required' });
            return;
        }
        try {
            const slot = {
                id: store.id(),
                sellerId: sellerProfile.id,
                startTime: (0, common_1.parseDate)(req.body.startTime),
                endTime: (0, common_1.parseDate)(req.body.endTime),
                isBooked: false,
                recurringRule: req.body.recurringRule,
            };
            store.availabilitySlots.set(slot.id, slot);
            res.status(201).json(slot);
        }
        catch {
            res.status(400).json({ error: 'Invalid availability payload' });
        }
    });
    router.delete('/availability/:id', (0, common_1.authenticate)(config), (req, res) => {
        const slot = store.availabilitySlots.get(req.params.id);
        const sellerProfile = store.findSellerProfileByUserId(req.user?.sub ?? '');
        if (!slot || !sellerProfile || slot.sellerId !== sellerProfile.id) {
            res.status(404).json({ error: 'Availability slot not found' });
            return;
        }
        store.availabilitySlots.delete(slot.id);
        res.status(204).send();
    });
    return router;
}
//# sourceMappingURL=availability.js.map