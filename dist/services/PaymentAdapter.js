"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentAdapter = void 0;
const crypto_1 = __importDefault(require("crypto"));
const uuid_1 = require("uuid");
class PaymentAdapter {
    constructor(store, webhookSecret = 'webhook-secret') {
        this.store = store;
        this.webhookSecret = webhookSecret;
    }
    createPaymentIntent(booking) {
        return {
            id: `pi_${booking.id}`,
            clientSecret: `secret_${booking.id}`,
            amount: booking.finalPrice ?? 0,
            currency: 'usd',
            status: 'requires_capture',
        };
    }
    verifyWebhookSignature(payload, signature, secret = this.webhookSecret) {
        const expected = crypto_1.default.createHmac('sha256', secret).update(payload).digest('hex');
        return crypto_1.default.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    }
    handleWebhook(event, signature) {
        const payload = typeof event === 'string' ? event : JSON.stringify(event);
        if (!this.verifyWebhookSignature(payload, signature, this.webhookSecret)) {
            throw new Error('Invalid webhook signature');
        }
        const parsed = typeof event === 'string' ? JSON.parse(event) : event;
        const stripeEvent = {
            id: (0, uuid_1.v4)(),
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
    createRefund(bookingId) {
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
exports.PaymentAdapter = PaymentAdapter;
//# sourceMappingURL=PaymentAdapter.js.map