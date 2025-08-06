import { Router } from "express";
import taskRouter from './tasks.js';

const router = Router();

router.get("/healthz", (_req, res) => {
  res.json({ ok: true, service: "streamscene-api", ts: new Date().toISOString() });
});

router.use('/api/tasks', taskRouter);
export default router; 
