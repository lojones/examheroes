import { Router } from 'express';
import { type KernelContext } from './index';

export function createCategoriesRouter({ store }: KernelContext) {
  const router = Router();

  router.get('/categories', (_req, res) => {
    res.json(Array.from(store.categories.values()));
  });

  router.get('/categories/:slug', (req, res) => {
    const category = Array.from(store.categories.values()).find((item) => item.slug === req.params.slug);
    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    res.json(category);
  });

  return router;
}
