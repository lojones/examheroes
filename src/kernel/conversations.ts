import { Router } from 'express';
import { authenticate, type AuthenticatedRequest } from './common';
import { type KernelContext } from './index';
import { ContentPolicyService } from '../services/ContentPolicyService';

function getExamSlug(store: KernelContext['store'], bookingId: string): string | undefined {
  const booking = store.bookings.get(bookingId);
  const service = booking?.serviceId ? store.services.get(booking.serviceId) : undefined;
  const categoryId = service?.categoryId ?? booking?.categoryId;
  return categoryId ? store.categories.get(categoryId)?.slug : undefined;
}

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

    const content = (req.body as { content?: string; body?: string }).content ?? (req.body as { body?: string }).body ?? '';
    const scan = contentPolicyService.scanText(content, getExamSlug(store, conversation.bookingId));
    if (scan.flagged) {
      res.status(422).json({ error: 'Message blocked by content policy', reasons: scan.reasons });
      return;
    }

    const message = {
      id: store.id(),
      conversationId: conversation.id,
      senderId: req.user!.sub,
      content,
      attachments: ((req.body as { attachments?: string[] }).attachments ?? []) as string[],
      createdAt: store.now(),
      readAt: undefined,
    };
    store.messages.set(message.id, message);
    res.status(201).json(message);
  });

  return router;
}
