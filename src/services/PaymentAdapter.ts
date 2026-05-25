import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { type Booking, type MarketMeshStore } from '../types/marketmesh';

export class PaymentAdapter {
  constructor(private readonly store: MarketMeshStore, private readonly webhookSecret: string = 'webhook-secret') {}

  createPaymentIntent(booking: Booking) {
    return {
      id: `pi_${booking.id}`,
      clientSecret: `secret_${booking.id}`,
      amount: booking.finalPrice,
      currency: 'usd',
      status: 'requires_capture',
    };
  }

  verifyWebhookSignature(payload: string, signature: string, secret = this.webhookSecret): boolean {
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  }

  handleWebhook(event: string | { id: string; type: string; data?: { bookingId?: string } }, signature: string) {
    const payload = typeof event === 'string' ? event : JSON.stringify(event);
    if (!this.verifyWebhookSignature(payload, signature, this.webhookSecret)) {
      throw new Error('Invalid webhook signature');
    }

    const parsed = typeof event === 'string' ? (JSON.parse(event) as { id: string; type: string; data?: { bookingId?: string } }) : event;
    const stripeEvent = {
      id: uuidv4(),
      eventId: parsed.id,
      eventType: parsed.type,
      processed: true,
      processedAt: new Date(),
      createdAt: new Date(),
    };
    this.store.stripeEvents.set(stripeEvent.id, stripeEvent);
    if (parsed.type === 'payment_intent.succeeded' && parsed.data?.bookingId) {
      const booking = this.store.bookings.get(parsed.data.bookingId);
      if (booking) {
        booking.payoutStatus = 'CAPTURED';
        booking.updatedAt = new Date();
        this.store.bookings.set(booking.id, booking);
      }
    }
    return stripeEvent;
  }

  createRefund(bookingId: string) {
    const booking = this.store.bookings.get(bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }
    booking.payoutStatus = 'REFUNDED';
    booking.updatedAt = new Date();
    this.store.bookings.set(booking.id, booking);
    return { refundId: `re_${bookingId}`, status: 'succeeded' };
  }
}
