"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.context = exports.app = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const jobs_1 = require("./jobs");
const marketmesh_1 = require("./marketmesh");
const admin_1 = require("./routes/admin");
const diagnostics_1 = require("./routes/diagnostics");
const exams_1 = require("./routes/exams");
const heroes_1 = require("./routes/heroes");
const integrity_1 = require("./routes/integrity");
const learner_1 = require("./routes/learner");
const matching_1 = require("./routes/matching");
const packages_1 = require("./routes/packages");
const practice_1 = require("./routes/practice");
const sessions_1 = require("./routes/sessions");
const study_plans_1 = require("./routes/study-plans");
const verification_1 = require("./routes/verification");
dotenv_1.default.config();
const app = (0, express_1.default)();
exports.app = app;
const context = (0, marketmesh_1.createExamHeroesContext)();
exports.context = context;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '2mb' }));
context.kernel.mountOn(app, '/api/v1');
app.use('/api/v1', (0, exams_1.createExamsRouter)(context));
app.use('/api/v1', (0, heroes_1.createHeroesRouter)(context));
app.use('/api/v1', (0, verification_1.createVerificationRouter)(context));
app.use('/api/v1', (0, diagnostics_1.createDiagnosticsRouter)(context));
app.use('/api/v1', (0, study_plans_1.createStudyPlansRouter)(context));
app.use('/api/v1', (0, practice_1.createPracticeRouter)(context));
app.use('/api/v1', (0, sessions_1.createSessionsRouter)(context));
app.use('/api/v1', (0, packages_1.createPackagesRouter)(context));
app.use('/api/v1', (0, integrity_1.createIntegrityRouter)(context));
app.use('/api/v1', (0, matching_1.createMatchingRouter)(context));
app.use('/api/v1', (0, admin_1.createAdminHostRouter)(context));
app.use('/api/v1', (0, learner_1.createLearnerRouter)(context));
app.get('/health', (_req, res) => res.json({ ok: true, jobs: (0, jobs_1.initializeJobs)(context.store) }));
if (require.main === module) {
    const port = Number(process.env.PORT || 3000);
    app.listen(port, () => {
        // eslint-disable-next-line no-console
        console.log(`Exam Heroes listening on port ${port}`);
    });
}
//# sourceMappingURL=index.js.map