import express, { Request, Response } from 'express';
const router = express.Router();

router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { tasks, preferences } = req.body;
    
    // Mock AI schedule
    const creativeHours = tasks.filter((t: any) => t.task_type === 'creative')
      .reduce((sum: number, t: any) => sum + (t.estimated_hours || 2), 0);
    
    const adminHours = tasks.filter((t: any) => t.task_type === 'admin')
      .reduce((sum: number, t: any) => sum + (t.estimated_hours || 1), 0);

    const schedule = {
      id: Date.now().toString(),
      weekStarting: new Date().toISOString(),
      tasks: tasks,
      aiSuggestions: "Focus on creative work in the morning when energy is high. Schedule admin tasks for afternoons. Take breaks between intensive creative sessions.",
      creativeHours,
      adminHours,
      totalHours: creativeHours + adminHours
    };

    res.json(schedule);
  } catch (error) {
    res.status(500).json({ error: 'Schedule generation failed' });
  }
});

export default router;