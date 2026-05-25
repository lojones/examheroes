import { type Booking, type MarketMeshStore, type TutoringSession } from '../types/marketmesh';
export declare class NotificationService {
    private readonly store;
    constructor(store: MarketMeshStore);
    notify(userId: string, type: string, data: Record<string, unknown>): {
        delivered: boolean;
        userId: string;
        type: string;
        data: Record<string, unknown>;
        timestamp: string;
    };
    notifyBookingCreated(booking: Booking): {
        delivered: boolean;
        userId: string;
        type: string;
        data: Record<string, unknown>;
        timestamp: string;
    }[];
    notifySessionReminder(session: TutoringSession): {
        delivered: boolean;
        userId: string;
        type: string;
        data: Record<string, unknown>;
        timestamp: string;
    };
    notifyPaymentCaptured(booking: Booking): {
        delivered: boolean;
        userId: string;
        type: string;
        data: Record<string, unknown>;
        timestamp: string;
    };
}
//# sourceMappingURL=NotificationService.d.ts.map