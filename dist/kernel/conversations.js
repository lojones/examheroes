"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createConversationsRouter = createConversationsRouter;
const express_1 = require("express");
const common_1 = require("./common");
const ContentPolicyService_1 = require("../services/ContentPolicyService");
function getExamSlug(store, bookingId) {
    const booking = store.bookings.get(bookingId);
    const service = booking?.serviceId ? store.services.get(booking.serviceId) : undefined;
    const categoryId = service?.categoryId ?? booking?.categoryId;
    return categoryId ? store.categories.get(categoryId)?.slug : undefined;
}
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
        const content = req.body.content ?? req.body.body ?? '';
        const scan = contentPolicyService.scanText(content, getExamSlug(store, conversation.bookingId));
        if (scan.flagged) {
            res.status(422).json({ error: 'Message blocked by content policy', reasons: scan.reasons });
            return;
        }
        const message = {
            id: store.id(),
            conversationId: conversation.id,
            senderId: req.user.sub,
            content,
            attachments: (req.body.attachments ?? []),
            createdAt: store.now(),
            readAt: undefined,
        };
        store.messages.set(message.id, message);
        res.status(201).json(message);
    });
    return router;
}
//# sourceMappingURL=conversations.js.map