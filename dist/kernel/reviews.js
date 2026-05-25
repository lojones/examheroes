"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReviewsRouter = createReviewsRouter;
const express_1 = require("express");
const common_1 = require("./common");
function createReviewsRouter({ config, store }) {
    const router = (0, express_1.Router)();
    router.get('/reviews/seller/:sellerId', (req, res) => {
        const reviews = Array.from(store.reviews.values()).filter((review) => review.recipientId === req.params.sellerId && review.role === 'BUYER');
        res.json(reviews);
    });
    router.post('/reviews/:bookingId', (0, common_1.authenticate)(config), (req, res) => {
        const booking = store.bookings.get(req.params.bookingId);
        if (!booking || booking.status !== 'COMPLETED') {
            res.status(422).json({ error: 'Completed booking required' });
            return;
        }
        const buyerProfile = store.findBuyerProfileByUserId(req.user?.sub ?? '');
        if (!buyerProfile || buyerProfile.id !== booking.buyerId) {
            res.status(403).json({ error: 'Buyer participant required' });
            return;
        }
        const review = {
            id: store.id(),
            bookingId: booking.id,
            authorId: req.user.sub,
            recipientId: booking.sellerId,
            role: 'BUYER',
            rating: Number(req.body.rating ?? 5),
            comment: req.body.comment ?? req.body.body,
            createdAt: store.now(),
        };
        store.reviews.set(review.id, review);
        res.status(201).json(review);
    });
    return router;
}
//# sourceMappingURL=reviews.js.map