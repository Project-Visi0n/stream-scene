// server/routes/index.ts
import { Router } from "express";
// ESM imports
import taskRouter from './tasks.js';
import contentSchedulerRouter from './contentScheduler.js';
import socialAuthRouter from './socialAuth.js';
import threadsRouter from './threads.js';
const router = Router();
// Health check
router.get("/healthz", (_req, res) => {
    res.json({
        ok: true,
        service: "streamscene-api",
        ts: new Date().toISOString(),
        features: {
            socialAuth: true,
            contentScheduling: true,
            fileIntegration: true,
            threads: true,
        }
    });
});
// Route mounts
router.use('/api/tasks', taskRouter);
router.use('/api/content-scheduler', contentSchedulerRouter);
router.use('/api/auth/social', socialAuthRouter);
router.use('/api/threads', threadsRouter);
export default router;
//# sourceMappingURL=index.js.map