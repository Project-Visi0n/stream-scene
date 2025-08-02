import express from 'express';
import { Task, TaskCreationAttributes } from '../models/Task';
import { ensureAuthenticated } from '../middleware/authMiddleWare';

const router = express.Router();

// Get all tasks for authenticated user
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const tasks = await Task.findByUserId(userId);
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Get a specific task
router.get('/:id', ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id;
    const taskId = parseInt(req.params.id);

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (isNaN(taskId)) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }

    const task = await Task.findByUserIdAndId(taskId, userId);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// Create a new task
router.post('/', ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { title, description, priority, task_type, deadline, estimated_hours } = req.body;

    // Validation
    if (!title || !priority || !task_type || !deadline) {
      return res.status(400).json({ 
        error: 'Missing required fields: title, priority, task_type, deadline' 
      });
    }

    if (!['low', 'medium', 'high'].includes(priority)) {
      return res.status(400).json({ error: 'Priority must be low, medium, or high' });
    }

    if (!['creative', 'admin'].includes(task_type)) {
      return res.status(400).json({ error: 'Task type must be creative or admin' });
    }

    const taskData: TaskCreationAttributes = {
      title,
      description,
      priority,
      task_type,
      status: 'pending',
      deadline: new Date(deadline),
      estimated_hours: estimated_hours ? parseInt(estimated_hours) : undefined,
      user_id: userId
    };

    const newTask = await Task.create(taskData);
    res.status(201).json(newTask);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update a task
router.put('/:id', ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id;
    const taskId = parseInt(req.params.id);

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (isNaN(taskId)) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }

    const task = await Task.findByUserIdAndId(taskId, userId);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const updates = req.body;

    // Validate priority if provided
    if (updates.priority && !['low', 'medium', 'high'].includes(updates.priority)) {
      return res.status(400).json({ error: 'Priority must be low, medium, or high' });
    }

    // Validate task_type if provided
    if (updates.task_type && !['creative', 'admin'].includes(updates.task_type)) {
      return res.status(400).json({ error: 'Task type must be creative or admin' });
    }

    // Validate status if provided
    if (updates.status && !['pending', 'in_progress', 'completed'].includes(updates.status)) {
      return res.status(400).json({ error: 'Status must be pending, in_progress, or completed' });
    }

    // Convert deadline to Date if provided
    if (updates.deadline) {
      updates.deadline = new Date(updates.deadline);
    }

    await task.update(updates);
    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete a task
router.delete('/:id', ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id;
    const taskId = parseInt(req.params.id);

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (isNaN(taskId)) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }

    const task = await Task.findByUserIdAndId(taskId, userId);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await task.destroy();
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Get tasks by status
router.get('/status/:status', ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id;
    const status = req.params.status as 'pending' | 'in_progress' | 'completed';

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!['pending', 'in_progress', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const tasks = await Task.getTasksByStatus(userId, status);
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks by status:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

export default router;