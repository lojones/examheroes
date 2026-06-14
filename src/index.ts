import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { initializeJobs } from './jobs';
import { createExamHeroesContext } from './marketmesh';
import { createAdminHostRouter } from './routes/admin';
import { createDiagnosticsRouter } from './routes/diagnostics';
import { createExamsRouter } from './routes/exams';
import { createHeroesRouter } from './routes/heroes';
import { createIntegrityRouter } from './routes/integrity';
import { createLearnerRouter } from './routes/learner';
import { createMatchingRouter } from './routes/matching';
import { createPackagesRouter } from './routes/packages';
import { createPracticeRouter } from './routes/practice';
import { createSessionsRouter } from './routes/sessions';
import { createStudyPlansRouter } from './routes/study-plans';
import { createVerificationRouter } from './routes/verification';

dotenv.config();

const app = express();
const context = createExamHeroesContext();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.use('/api/v1', context.kernel.getRouter());
app.use('/api/v1', createExamsRouter(context));
app.use('/api/v1', createHeroesRouter(context));
app.use('/api/v1', createVerificationRouter(context));
app.use('/api/v1', createDiagnosticsRouter(context));
app.use('/api/v1', createStudyPlansRouter(context));
app.use('/api/v1', createPracticeRouter(context));
app.use('/api/v1', createSessionsRouter(context));
app.use('/api/v1', createPackagesRouter(context));
app.use('/api/v1', createIntegrityRouter(context));
app.use('/api/v1', createMatchingRouter(context));
app.use('/api/v1', createAdminHostRouter(context));
app.use('/api/v1', createLearnerRouter(context));
app.get('/health', (_req, res) => res.json({ ok: true, jobs: initializeJobs(context.store) }));

if (require.main === module) {
  const port = Number(process.env.PORT || 3000);
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Exam Heroes listening on port ${port}`);
  });
}

export { app, context };
