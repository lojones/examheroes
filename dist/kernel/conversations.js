"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createConversationsRouter = createConversationsRouter;
const express_1 = require("express");
const uuid_1 = require("uuid");
const common_1 = require("./common");
const ContentPolicyService_1 = require("../services/ContentPolicyService");
function createConversationsRouter({ config, store }) {
    const router = (0, express_1.Router)();
    const contentPolicyService = new ContentPolicyService_1.ContentPolicyService();
    router.get('/conversations/:id', (0, common_1.authenticate)(config), (req, res) => {
        const conversation = store.conversations.get(req.params.id);
        if (!conversation) {
            res.status(404).json({ error: 'Conversation not found' });
            return;
        }
        res.json(conversation);
    });
    router.get('/conversations/:id/messages', (0, common_1.authenticate)(config), (req, res) => {
        const messages = Array.from(store.messages.values()).filter((message) => message.conversationId === req.params.id);
        res.json(messages);
    });
    router.post('/conversations/:id/messages', (0, common_1.authenticate)(config), (req, res) => {
        const conversation = store.conversations.get(req.params.id);
        if (!conversation) {
            res.status(404).json({ error: 'Conversation not found' });
            return;
        }
        const booking = Array.from(store.bookings.values()).find((item) => item.id === conversation.bookingId);
        const service = booking ? store.serviceListings.get(booking.serviceListingId) : undefined;
        const body = req.body.body ?? '';
        const scan = contentPolicyService.scanText(body, service?.examSlug);
        if (scan.flagged) {
            res.status(422).json({ error: 'Message blocked by content policy', reasons: scan.reasons });
            return;
        }
        const message = {
            id: (0, uuid_1.v4)(),
            conversationId: conversation.id,
            authorUserId: req.user.sub,
            body,
            flagged: false,
            createdAt: new Date(),
        };
        store.messages.set(message.id, message);
        res.status(201).json(message);
    });
    return router;
}
//# sourceMappingURL=conversations.js.map