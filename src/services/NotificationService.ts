import { type Booking, type MarketMeshStore, type TutoringSession } from '../types/marketmesh';

export class NotificationService {
  constructor(private readonly store: MarketMeshStore) {}

  notify(userId: string, type: string, data: Record<string, unknown>) {
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

  notifyBookingCreated(booking: Booking) {
    const buyer = this.store.buyerProfiles.get(booking.buyerId);
    const seller = this.store.sellerProfiles.get(booking.sellerId);
    return [buyer?.userId, seller?.userId].filter(Boolean).map((userId) => this.notify(userId as string, 'booking.created', { bookingId: booking.id }));
  }

  notifySessionReminder(session: TutoringSession) {
    const buyer = this.store.buyerProfiles.get(session.buyerProfileId);
    return this.notify(buyer?.userId ?? session.buyerProfileId, 'session.reminder', { sessionId: session.id, bookingId: session.bookingId });
  }

  notifyPaymentCaptured(booking: Booking) {
    const seller = this.store.sellerProfiles.get(booking.sellerId);
    return this.notify(seller?.userId ?? booking.sellerId, 'payment.captured', { bookingId: booking.id, amount: booking.finalPrice ?? 0 });
  }
}
