// server/routes/index.ts
import { Router } from "express";

// ESM imports
import taskRouter from './tasks.js';
import contentSchedulerRouter from './contentScheduler.js';
import socialAuthRouter from './socialAuth.js';
import threadsRouter from './threads.js'; 
import commentsRouter from './comments.js';
import canvasRouter from './canvas.js'; 
import canvasCalendarRouter from './canvasCalendar.js'; 

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
      comments: true,
      canvas: true,
      canvasCalendar: true,
    }
  });
});

// Route mounts
router.use('/api/tasks', taskRouter);
router.use('/api/content-scheduler', contentSchedulerRouter); 
router.use('/api/auth/social', socialAuthRouter);
router.use('/api/threads', threadsRouter);
router.use('/api/comments', commentsRouter);
router.use('/api/canvas', canvasRouter);
router.use('/api/canvas-calendar', canvasCalendarRouter);

export default router;
