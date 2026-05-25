import { type Booking, type MarketMeshStore, type TutoringSession } from '../types/marketmesh';
export declare class NotificationService {
    private readonly store;
    constructor(store: MarketMeshStore);
    notify(userId: string, type: string, data: Record<string, unknown>): {
        timestamp: string;
        id: string;
        userId: string;
        type: string;
        data: Record<string, unknown>;
        createdAt: Date;
        readAt: undefined;
        delivered: boolean;
    };
    notifyBookingCreated(booking: Booking): {
        timestamp: string;
        id: string;
        userId: string;
        type: string;
        data: Record<string, unknown>;
        createdAt: Date;
        readAt: undefined;
        delivered: boolean;
    }[];
    notifySessionReminder(session: TutoringSession): {
        timestamp: string;
        id: string;
        userId: string;
        type: string;
        data: Record<string, unknown>;
        createdAt: Date;
        readAt: undefined;
        delivered: boolean;
    };
    notifyPaymentCaptured(booking: Booking): {
        timestamp: string;
        id: string;
        userId: string;
        type: string;
        data: Record<string, unknown>;
        createdAt: Date;
        readAt: undefined;
        delivered: boolean;
    };
}
//# sourceMappingURL=NotificationService.d.ts.map