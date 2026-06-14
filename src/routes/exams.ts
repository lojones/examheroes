import { Router } from 'express';
import { type ReturnTypeContext } from './shared';

export function createExamsRouter(context: ReturnTypeContext) {
  const router = Router();

  router.get('/exams', (_req, res) => {
    res.json(context.services.examTaxonomyService.getAllExams());
  });

  router.get('/exams/:slug', (req, res) => {
    const exam = context.services.examTaxonomyService.getExamBySlug(req.params.slug);
    if (!exam) {
      res.status(404).json({ error: 'Exam not found' });
      return;
    }
    res.json(exam);
  });

  router.get('/exams/:slug/topics', (req, res) => {
    res.json(context.services.examTaxonomyService.getTopics(req.params.slug));
  });

  router.get('/exams/:slug/policy', (req, res) => {
    const policy = context.services.examTaxonomyService.getPolicy(req.params.slug);
    if (!policy) {
      res.status(404).json({ error: 'Policy not found' });
      return;
    }
    res.json(policy);
  });

  return router;
}
