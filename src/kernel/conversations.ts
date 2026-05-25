import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, type AuthenticatedRequest } from './common';
import { type KernelContext } from './index';
import { ContentPolicyService } from '../services/ContentPolicyService';

export function createConversationsRouter({ config, store }: KernelContext) {
  const router = Router();
  const contentPolicyService = new ContentPolicyService();

  router.get('/conversations/:id', authenticate(config), (req, res) => {
    const conversation = store.conversations.get(req.params.id);
    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }
    res.json(conversation);
  });

  router.get('/conversations/:id/messages', authenticate(config), (req, res) => {
    const messages = Array.from(store.messages.values()).filter((message) => message.conversationId === req.params.id);
    res.json(messages);
  });

  router.post('/conversations/:id/messages', authenticate(config), (req: AuthenticatedRequest, res) => {
    const conversation = store.conversations.get(req.params.id);
    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }
    const booking = Array.from(store.bookings.values()).find((item) => item.id === conversation.bookingId);
    const service = booking ? store.serviceListings.get(booking.serviceListingId) : undefined;
    const body = (req.body as { body?: string }).body ?? '';
    const scan = contentPolicyService.scanText(body, service?.examSlug);
    if (scan.flagged) {
      res.status(422).json({ error: 'Message blocked by content policy', reasons: scan.reasons });
      return;
    }
    const message = {
      id: uuidv4(),
      conversationId: conversation.id,
      authorUserId: req.user!.sub,
      body,
      flagged: false,
      createdAt: new Date(),
    };
    store.messages.set(message.id, message);
    res.status(201).json(message);
  });

  return router;
}
