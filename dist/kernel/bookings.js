"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBookingsRouter = createBookingsRouter;
const express_1 = require("express");
const uuid_1 = require("uuid");
const common_1 = require("./common");
const marketmesh_1 = require("../types/marketmesh");
function createBookingsRouter({ config, hooks, store }) {
    const router = (0, express_1.Router)();
    router.post('/bookings', (0, common_1.authenticate)(config), async (req, res) => {
        const buyerProfile = Array.from(store.buyerProfiles.values()).find((profile) => profile.userId === req.user?.sub);
        if (!buyerProfile) {
            res.status(403).json({ error: 'Buyer profile required' });
            return;
        }
        const body = req.body;
        if (!body.sellerProfileId || !body.serviceListingId || !body.availabilitySlotId) {
            res.status(400).json({ error: 'Missing booking fields' });
            return;
        }
        const preflight = await hooks.beforeBooking?.({
            buyerProfileId: buyerProfile.id,
            sellerProfileId: body.sellerProfileId,
            serviceListingId: body.serviceListingId,
            availabilitySlotId: body.availabilitySlotId,
            requestDescription: body.requestDescription,
            examProgramId: body.examProgramId,
            packagePurchaseId: body.packagePurchaseId,
            contentUploadIds: body.contentUploadIds,
        }, store);
        if (preflight && !preflight.allowed) {
            res.status(422).json(preflight);
            return;
        }
        const service = store.serviceListings.get(body.serviceListingId);
        const slot = store.availabilitySlots.get(body.availabilitySlotId);
        if (!service || !slot) {
            res.status(404).json({ error: 'Service or slot not found' });
            return;
        }
        const finalPrice = service.priceAmount;
        const platformFeePercent = store.platformConfig.platformFeePercent;
        const platformFeeAmount = Number(((finalPrice * platformFeePercent) / 100).toFixed(2));
        const sellerPayoutAmount = Number((finalPrice - platformFeeAmount).toFixed(2));
        const now = new Date();
        const booking = {
            id: (0, uuid_1.v4)(),
            buyerProfileId: buyerProfile.id,
            sellerProfileId: body.sellerProfileId,
            serviceListingId: body.serviceListingId,
            availabilitySlotId: body.availabilitySlotId,
            status: marketmesh_1.BookingStatus.PENDING,
            finalPrice,
            platformFeePercent,
            platformFeeAmount,
            sellerPayoutAmount,
            payoutStatus: body.packagePurchaseId ? 'PACKAGE_APPLIED' : 'PENDING',
            notes: body.notes,
            packagePurchaseId: body.packagePurchaseId,
            contentUploadIds: body.contentUploadIds ?? [],
            createdAt: now,
            updatedAt: now,
        };
        store.bookings.set(booking.id, booking);
        slot.isBooked = true;
        slot.updatedAt = new Date();
        store.availabilitySlots.set(slot.id, slot);
        if (body.packagePurchaseId) {
            const purchase = store.packagePurchases.get(body.packagePurchaseId);
            if (purchase) {
                purchase.usedSessions += 1;
                purchase.status = purchase.usedSessions >= purchase.totalSessions ? 'EXHAUSTED' : purchase.status;
                purchase.updatedAt = new Date();
                store.packagePurchases.set(purchase.id, purchase);
            }
        }
        await hooks.onBookingCreated?.(booking, store);
        res.status(201).json(booking);
    });
    router.get('/bookings/:id', (0, common_1.authenticate)(config), async (req, res) => {
        const booking = store.bookings.get(req.params.id);
        if (!booking) {
            res.status(404).json({ error: 'Booking not found' });
            return;
        }
        const extended = (await hooks.extendBookingPayload?.(booking, store)) ?? booking;
        res.json(extended);
    });
    router.patch('/bookings/:id/status', (0, common_1.authenticate)(config), (req, res) => {
        const booking = store.bookings.get(req.params.id);
        if (!booking) {
            res.status(404).json({ error: 'Booking not found' });
            return;
        }
        const nextStatus = req.body.status;
        if (!nextStatus) {
            res.status(400).json({ error: 'Missing status' });
            return;
        }
        booking.status = nextStatus;
        booking.updatedAt = new Date();
        store.bookings.set(booking.id, booking);
        res.json(booking);
    });
    router.post('/bookings/:id/reviews', (0, common_1.authenticate)(config), (req, res) => {
        const booking = store.bookings.get(req.params.id);
        if (!booking) {
            res.status(404).json({ error: 'Booking not found' });
            return;
        }
        if (booking.status !== marketmesh_1.BookingStatus.COMPLETED) {
            res.status(422).json({ error: 'Booking must be completed before review' });
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
//# sourceMappingURL=bookings.js.map