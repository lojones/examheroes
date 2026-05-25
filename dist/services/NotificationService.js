"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
class NotificationService {
    constructor(store) {
        this.store = store;
    }
    notify(userId, type, data) {
        const notification = {
            id: this.store.id(),
            userId,
            type,
            data,
            createdAt: this.store.now(),
            readAt: undefined,
        };
        this.store.notifications.set(notification.id, notification);
        return { delivered: true, ...notification, timestamp: notification.createdAt.toISOString() };
    }
    notifyBookingCreated(booking) {
        const buyer = this.store.buyerProfiles.get(booking.buyerId);
        const seller = this.store.sellerProfiles.get(booking.sellerId);
        return [buyer?.userId, seller?.userId].filter(Boolean).map((userId) => this.notify(userId, 'booking.created', { bookingId: booking.id }));
    }
    notifySessionReminder(session) {
        const buyer = this.store.buyerProfiles.get(session.buyerProfileId);
        return this.notify(buyer?.userId ?? session.buyerProfileId, 'session.reminder', { sessionId: session.id, bookingId: session.bookingId });
    }
    notifyPaymentCaptured(booking) {
        const seller = this.store.sellerProfiles.get(booking.sellerId);
        return this.notify(seller?.userId ?? booking.sellerId, 'payment.captured', { bookingId: booking.id, amount: booking.finalPrice ?? 0 });
    }
}
exports.NotificationService = NotificationService;
//# sourceMappingURL=NotificationService.js.map