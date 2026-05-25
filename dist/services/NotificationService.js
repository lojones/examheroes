"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
class NotificationService {
    constructor(store) {
        this.store = store;
    }
    notify(userId, type, data) {
        return { delivered: true, userId, type, data, timestamp: new Date().toISOString() };
    }
    notifyBookingCreated(booking) {
        const buyer = this.store.buyerProfiles.get(booking.buyerProfileId);
        const seller = this.store.sellerProfiles.get(booking.sellerProfileId);
        return [buyer?.userId, seller?.userId].filter(Boolean).map((userId) => this.notify(userId, 'booking.created', { bookingId: booking.id }));
    }
    notifySessionReminder(session) {
        return this.notify(session.buyerProfileId, 'session.reminder', { sessionId: session.id, bookingId: session.bookingId });
    }
    notifyPaymentCaptured(booking) {
        return this.notify(booking.sellerProfileId, 'payment.captured', { bookingId: booking.id, amount: booking.finalPrice });
    }
}
exports.NotificationService = NotificationService;
//# sourceMappingURL=NotificationService.js.map