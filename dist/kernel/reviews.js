"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReviewsRouter = createReviewsRouter;
const express_1 = require("express");
const uuid_1 = require("uuid");
const common_1 = require("./common");
const marketmesh_1 = require("../types/marketmesh");
function createReviewsRouter({ config, store }) {
    const router = (0, express_1.Router)();
    router.get('/reviews/seller/:sellerProfileId', (req, res) => {
        const reviews = Array.from(store.reviews.values()).filter((review) => review.targetSellerProfileId === req.params.sellerProfileId);
        res.json(reviews);
    });
    router.post('/reviews/:bookingId', (0, common_1.authenticate)(config), (req, res) => {
        const booking = store.bookings.get(req.params.bookingId);
        if (!booking || booking.status !== marketmesh_1.BookingStatus.COMPLETED) {
            res.status(422).json({ error: 'Completed booking required' });
            return;
        }
        const review = {
            id: (0, uuid_1.v4)(),
            bookingId: booking.id,
            authorUserId: req.user.sub,
            targetSellerProfileId: booking.sellerProfileId,
            rating: Number(req.body.rating ?? 5),
            body: req.body.body,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        store.reviews.set(review.id, review);
        res.status(201).json(review);
    });
    return router;
}
//# sourceMappingURL=reviews.js.map