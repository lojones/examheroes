"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSessionsRouter = createSessionsRouter;
const express_1 = require("express");
const common_1 = require("../kernel/common");
function createSessionsRouter(context) {
    const router = (0, express_1.Router)();
    router.use('/sessions', (0, common_1.authenticate)(context.config));
    router.post('/sessions/:bookingId/check-in', (req, res) => {
        const session = Array.from(context.store.tutoringSessions.values()).find((item) => item.bookingId === req.params.bookingId);
        if (!session) {
            res.status(404).json({ error: 'Session not found' });
            return;
        }
        res.json({ sessionId: session.id, ready: true, policyVersion: session.policySnapshotVersion });
    });
    router.post('/sessions/:bookingId/start', (req, res) => {
        const session = Array.from(context.store.tutoringSessions.values()).find((item) => item.bookingId === req.params.bookingId);
        if (!session) {
            res.status(404).json({ error: 'Session not found' });
            return;
        }
        session.status = 'IN_PROGRESS';
        session.startedAt = new Date();
        session.updatedAt = new Date();
        context.store.tutoringSessions.set(session.id, session);
        res.json(session);
    });
    router.post('/sessions/:bookingId/end', (req, res) => {
        const session = Array.from(context.store.tutoringSessions.values()).find((item) => item.bookingId === req.params.bookingId);
        if (!session) {
            res.status(404).json({ error: 'Session not found' });
            return;
        }
        session.status = 'COMPLETED';
        session.completedAt = new Date();
        session.updatedAt = new Date();
        context.store.tutoringSessions.set(session.id, session);
        res.json(session);
    });
    router.post('/sessions/:bookingId/summary', (req, res) => {
        const session = Array.from(context.store.tutoringSessions.values()).find((item) => item.bookingId === req.params.bookingId);
        if (!session) {
            res.status(404).json({ error: 'Session not found' });
            return;
        }
        session.heroSummary = req.body.heroSummary;
        session.homeworkNotes = req.body.homeworkNotes;
        session.updatedAt = new Date();
        context.store.tutoringSessions.set(session.id, session);
        res.json(session);
    });
    return router;
}
//# sourceMappingURL=sessions.js.map