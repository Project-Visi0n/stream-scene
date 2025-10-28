// server/routes/index.ts
import { Router } from "express";

// ESM imports
import taskRouter from './tasks.js';
console.log('✅ Tasks router imported');
import contentSchedulerRouter from './contentScheduler.js';
console.log('✅ Content scheduler router imported');
import socialAuthRouter from './socialAuth.js';
console.log('✅ Social auth router imported');
import threadsRouter from './threads.js'; 
console.log('✅ Threads router imported');
import commentsRouter from './comments.js';
console.log('✅ Comments router imported');
import canvasRouter from './canvas.js'; 
console.log('✅ Canvas router imported');
import canvasCalendarRouter from './canvasCalendar.js';
console.log('✅ Canvas calendar router imported');
// Budget router now imported directly in app.ts 

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
      budget: "mounted directly in app.ts",
    }
  });
});

// Route mounts
console.log('🚀 Mounting API routes...');
router.use('/api/tasks', taskRouter);
console.log('✅ Tasks routes mounted at /api/tasks');
router.use('/api/content-scheduler', contentSchedulerRouter); 
console.log('✅ Content scheduler routes mounted at /api/content-scheduler');
router.use('/api/auth/social', socialAuthRouter);
console.log('✅ Social auth routes mounted at /api/auth/social');
router.use('/api/threads', threadsRouter);
console.log('✅ Threads routes mounted at /api/threads');
router.use('/api/comments', commentsRouter);
console.log('✅ Comments routes mounted at /api/comments');
router.use('/api/canvas', canvasRouter);
console.log('✅ Canvas routes mounted at /api/canvas');
router.use('/api/canvas-calendar', canvasCalendarRouter);
console.log('✅ Canvas calendar routes mounted at /api/canvas-calendar');
// Budget routes now mounted directly in app.ts at /api/budget

export default router;
