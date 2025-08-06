import express, { Request, Response } from 'express';
import { Task } from '../models/Task.js';

const router = express.Router();

// Simple middleware check (adjust this based on your existing auth setup)
const requireAuth = (req: Request, res: Response, next: express.NextFunction) => {
  // Replace this with your actual auth check
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// GET /api/tasks - Get all tasks for the authenticated user
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const tasks = await Task.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']]
    });

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// POST /api/tasks - Create a new task
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const {
      title,
      description,
      priority,
      task_type,
      deadline,
      estimated_hours
    } = req.body;

    // Validation
    if (!title || !priority || !task_type) {
      return res.status(400).json({ 
        error: 'Title, priority, and task_type are required' 
      });
    }

    // Validate priority
    if (!['low', 'medium', 'high'].includes(priority)) {
      return res.status(400).json({ 
        error: 'Priority must be low, medium, or high' 
      });
    }

    // Validate task_type
    if (!['creative', 'admin'].includes(task_type)) {
      return res.status(400).json({ 
        error: 'Task type must be creative or admin' 
      });
    }

    // Validate estimated_hours if provided
    if (estimated_hours !== undefined && (estimated_hours < 0 || estimated_hours > 100)) {
      return res.status(400).json({ 
        error: 'Estimated hours must be between 0 and 100' 
      });
    }

    // Validate deadline if provided
    if (deadline && isNaN(Date.parse(deadline))) {
      return res.status(400).json({ 
        error: 'Invalid deadline format' 
      });
    }

    const task = await Task.create({
      user_id: userId,
      title: title.trim(),
      description: description?.trim() || null,
      priority,
      task_type,
      status: 'pending',
      deadline: deadline || null,
      estimated_hours: estimated_hours || null
    });

    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PUT /api/tasks/:id - Update a task
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const taskId = parseInt(req.params.id); // Convert to number if your ID is numeric
    const {
      title,
      description,
      priority,
      task_type,
      status,
      deadline,
      estimated_hours
    } = req.body;

    // Find the task and verify ownership
    const task = await Task.findOne({
      where: { 
        id: taskId,
        user_id: userId 
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Validate fields if provided
    if (priority && !['low', 'medium', 'high'].includes(priority)) {
      return res.status(400).json({ 
        error: 'Priority must be low, medium, or high' 
      });
    }

    if (task_type && !['creative', 'admin'].includes(task_type)) {
      return res.status(400).json({ 
        error: 'Task type must be creative or admin' 
      });
    }

    if (status && !['pending', 'in_progress', 'completed'].includes(status)) {
      return res.status(400).json({ 
        error: 'Status must be pending, in_progress, or completed' 
      });
    }

    if (estimated_hours !== undefined && (estimated_hours < 0 || estimated_hours > 100)) {
      return res.status(400).json({ 
        error: 'Estimated hours must be between 0 and 100' 
      });
    }

    if (deadline && isNaN(Date.parse(deadline))) {
      return res.status(400).json({ 
        error: 'Invalid deadline format' 
      });
    }

    // Update the task
    await task.update({
      ...(title !== undefined && { title: title.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
      ...(priority !== undefined && { priority }),
      ...(task_type !== undefined && { task_type }),
      ...(status !== undefined && { status }),
      ...(deadline !== undefined && { deadline: deadline || null }),
      ...(estimated_hours !== undefined && { estimated_hours: estimated_hours || null })
    });

    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /api/tasks/:id - Delete a task
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const taskId = parseInt(req.params.id); // Convert to number if your ID is numeric

    // Find the task and verify ownership
    const task = await Task.findOne({
      where: { 
        id: taskId,
        user_id: userId 
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Delete the task
    await task.destroy();

    res.json({ 
      message: 'Task deleted successfully',
      deletedTask: {
        id: task.id,
        title: task.title
      }
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// GET /api/tasks/:id - Get a specific task
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const taskId = parseInt(req.params.id); // Convert to number if your ID is numeric

    const task = await Task.findOne({
      where: { 
        id: taskId,
        user_id: userId 
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

export default router;