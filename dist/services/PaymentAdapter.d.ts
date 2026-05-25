import { type Booking, type MarketMeshStore } from '../types/marketmesh';
export declare class PaymentAdapter {
    private readonly store;
    private readonly webhookSecret;
    constructor(store: MarketMeshStore, webhookSecret?: string);
    createPaymentIntent(booking: Booking): {
        id: string;
        clientSecret: string;
        amount: number;
        currency: string;
        status: string;
    };
    verifyWebhookSignature(payload: string, signature: string, secret?: string): boolean;
    handleWebhook(event: string | {
        id: string;
        type: string;
        data?: {
            bookingId?: string;
        };
    }, signature: string): {
        id: string;
        eventId: string;
        eventType: string;
        processed: boolean;
        processedAt: Date;
        createdAt: Date;
    };
    createRefund(bookingId: string): {
        refundId: string;
        status: string;
    };
}
//# sourceMappingURL=PaymentAdapter.d.ts.map