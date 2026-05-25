import { type Booking, type MarketMeshStore, type TutoringSession } from '../types/marketmesh';

export class NotificationService {
  constructor(private readonly store: MarketMeshStore) {}

  notify(userId: string, type: string, data: Record<string, unknown>) {
    return { delivered: true, userId, type, data, timestamp: new Date().toISOString() };
  }

  notifyBookingCreated(booking: Booking) {
    const buyer = this.store.buyerProfiles.get(booking.buyerProfileId);
    const seller = this.store.sellerProfiles.get(booking.sellerProfileId);
    return [buyer?.userId, seller?.userId].filter(Boolean).map((userId) => this.notify(userId as string, 'booking.created', { bookingId: booking.id }));
  }

  notifySessionReminder(session: TutoringSession) {
    return this.notify(session.buyerProfileId, 'session.reminder', { sessionId: session.id, bookingId: session.bookingId });
  }

  notifyPaymentCaptured(booking: Booking) {
    return this.notify(booking.sellerProfileId, 'payment.captured', { bookingId: booking.id, amount: booking.finalPrice });
  }
}
