import express, { Request, Response } from 'express';
const router = express.Router();

interface AITaskRequest {
  prompt: string;
}

interface GeneratedTask {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  task_type: 'creative' | 'admin';
  estimated_hours: number;
}

router.post('/generate-tasks', async (req: Request, res: Response) => {
  try {
    const { prompt }: AITaskRequest = req.body;
    
    // Mock data 
    const mockTasks: GeneratedTask[] = [
      {
        title: "Edit video footage",
        description: "Cut and edit raw footage for main project",
        priority: "high",
        task_type: "creative",
        estimated_hours: 8
      },
      {
        title: "Create thumbnail designs", 
        description: "Design 3 thumbnail options",
        priority: "medium",
        task_type: "creative",
        estimated_hours: 2
      }
    ];
    
    res.json({ tasks: mockTasks });
  } catch (error) {
    res.status(500).json({ error: 'AI generation failed' });
  }
});

export default router;