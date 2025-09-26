import express, { Request, Response } from 'express';
import { Task } from '../models/Task.js';

const router = express.Router();

// Enhanced middleware check with detailed debugging
const requireAuth = (req: Request, res: Response, next: express.NextFunction) => {
  // Check multiple possible auth sources
  let user = null;
  
  // Option 1: Check req.user (Passport.js style)
  if ((req as any).user) {
    user = (req as any).user;
    console.log('Found user in req.user');
  }
  
  // Option 2: Check session (session-based auth)
  else if ((req as any).session?.user) {
    user = (req as any).session.user;
    (req as any).user = user; // Set for consistency
    console.log('Found user in req.session.user');
  }
  
  // Option 3: Check JWT token (if using JWT)
  else if (req.headers.authorization?.startsWith('Bearer ')) {
    const token = req.headers.authorization.replace('Bearer ', '');
    try {
      // Replace this with your actual JWT verification
      // const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // user = decoded;
      console.log('JWT token found but verification not implemented');
    } catch (error) {
      console.log('JWT verification failed:', error);
    }
  }
  
  // DEMO MODE: For presentation purposes, create a default user in development
  if (!user && process.env.NODE_ENV === 'development') {
    console.log('🎭 DEMO MODE: Creating default user for presentation');
    user = {
      id: 1,
      email: 'demo@streamscene.com',
      name: 'StreamScene Demo User',
      isDemoUser: true
    };
    (req as any).user = user;
  }
  
  if (!user) {
    console.log('Authentication failed - no user found in any source');
    return res.status(401).json({ 
      error: 'Authentication required',
      debug: {
        hasReqUser: !!(req as any).user,
        hasSession: !!(req as any).session,
        hasSessionUser: !!(req as any).session?.user,
        hasAuthHeader: !!req.headers.authorization,
        hasCookies: !!req.headers.cookie
      }
    });
  }
  
  console.log('Authentication successful for user:', user.id || user.email || 'unknown');
  next();
};

// TEST TASK CREATION - Create a test task with fake user
router.post('/test-task', async (req: Request, res: Response) => {
  try {
    console.log('=== TEST TASK CREATION ===');
    
    // Create fake user for testing
    const testUser = { id: 1, email: 'test@example.com' };
    (req as any).user = testUser;
    
    console.log('Using test user:', testUser);
    
    // Set a valid deadline that won't cause database issues
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7); // 7 days from now
    
    const testTask = {
      user_id: testUser.id,
      title: 'Test Task from API',
      description: 'This is a test task created via API',
      priority: 'medium' as const,
      task_type: 'creative' as const,
      status: 'pending' as const,
      deadline: futureDate, // Fixed: providing a valid date instead of null
      estimated_hours: 2
    };
    
    console.log('Creating test task:', testTask);
    
    const task = await Task.create(testTask);
    
    console.log('Test task created successfully:', task.id);
    res.status(201).json({
      message: 'Test task created successfully',
      task: task,
      note: 'This was created with a fake user for testing'
    });
    
  } catch (error: any) {
    console.error('Test task creation failed:', error);
    
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        error: 'Foreign key constraint failed',
        details: 'User with ID 1 does not exist in database',
        solution: 'Create a user with ID 1 in your database first, or check your User model/table'
      });
    }
    
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map((err: any) => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));
      return res.status(400).json({
        error: 'Database validation failed',
        details: validationErrors,
        solution: 'Check your Task model constraints and database schema'
      });
    }
    
    res.status(500).json({ 
      error: 'Test task creation failed',
      details: error.message,
      name: error.name
    });
  }
});

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

    console.log(`✅ Found ${tasks.length} tasks for user ${userId}`);
    console.log('Task sample:', tasks.slice(0, 3).map(t => ({
      id: t.id,
      title: t.title,
      user_id: t.user_id,
      created_at: t.created_at
    })));

    // Serialize tasks to clean objects
    const cleanTasks = tasks.map(task => {
      // Helper function to safely convert dates
      const safeToISOString = (dateValue: any): string => {
        if (!dateValue) return new Date().toISOString();
        
        // If it's already a Date object
        if (dateValue instanceof Date) {
          return isNaN(dateValue.getTime()) ? new Date().toISOString() : dateValue.toISOString();
        }
        
        // If it's a string, try to parse it
        if (typeof dateValue === 'string') {
          const parsed = new Date(dateValue);
          return isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
        }
        
        // Fallback to current date
        return new Date().toISOString();
      };

      return {
        id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        task_type: task.task_type,
        status: task.status,
        deadline: task.deadline ? safeToISOString(task.deadline) : null,
        estimated_hours: task.estimated_hours,
        user_id: task.user_id,
        created_at: safeToISOString(task.created_at),
        updated_at: safeToISOString(task.updated_at)
      };
    });

    console.log(`Found ${tasks.length} tasks for user ${userId}`);
    res.json({
      message: `Found ${tasks.length} tasks`,
      tasks: cleanTasks,
      user_id: userId
    });
  } catch (error: any) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ 
      error: 'Failed to fetch tasks',
      details: error.message
    });
  }
});

// POST /api/tasks - Create a new task
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if user exists in database
    const { User } = await import('../db/index.js');
    const dbUser = await User.findByPk(userId);
    if (!dbUser) {
      console.log('❌ User not found in database:', userId);
      return res.status(400).json({ 
        error: 'User not found in database',
        userId: userId,
        solution: 'Please log out and log in again to recreate your user account'
      });
    }
    console.log('✅ User found in database:', dbUser.email);

    const {
      title,
      description,
      priority,
      task_type,
      deadline,
      estimated_hours
    } = req.body;

    console.log('📝 Extracted fields:', { title, description, priority, task_type, deadline, estimated_hours });

    // Validation
    if (!title || !priority || !task_type) {
      console.log('❌ Validation failed - missing required fields');
      return res.status(400).json({ 
        error: 'Title, priority, and task_type are required',
        received: { title, priority, task_type }
      });
    }

    // Validate priority
    if (!['low', 'medium', 'high'].includes(priority)) {
      console.log('Invalid priority:', priority);
      return res.status(400).json({ 
        error: 'Priority must be low, medium, or high',
        received: priority
      });
    }

    // Validate task_type
    if (!['creative', 'admin'].includes(task_type)) {
      console.log('Invalid task_type:', task_type);
      return res.status(400).json({ 
        error: 'Task type must be creative or admin',
        received: task_type
      });
    }

    // Validate estimated_hours if provided
    if (estimated_hours !== undefined && (estimated_hours < 0 || estimated_hours > 100)) {
      console.log('Invalid estimated_hours:', estimated_hours);
      return res.status(400).json({ 
        error: 'Estimated hours must be between 0 and 100',
        received: estimated_hours
      });
    }

    // Validate and parse deadline if provided
    let parsedDeadline: Date | null = null;
    if (deadline) {
      if (isNaN(Date.parse(deadline))) {
        console.log('Invalid deadline format:', deadline);
        return res.status(400).json({ 
          error: 'Invalid deadline format. Use ISO date format (YYYY-MM-DDTHH:mm:ss.sssZ)',
          received: deadline
        });
      }
      parsedDeadline = new Date(deadline);
    }
    // Database now allows NULL deadlines, so we don't need a default

    const taskData = {
      user_id: userId,
      title: title.trim(),
      description: description?.trim() || undefined,
      priority,
      task_type,
      status: 'pending' as const,
      deadline: parsedDeadline || undefined,
      estimated_hours: estimated_hours || undefined
    };

    console.log('Creating task with data:', taskData);

    const task = await Task.create(taskData);

    console.log('Task created successfully:', task.id);
    
    // Return clean task data without Sequelize metadata
    const cleanTask = {
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      task_type: task.task_type,
      status: task.status,
      deadline: task.deadline ? task.deadline.toISOString() : null,
      estimated_hours: task.estimated_hours,
      user_id: task.user_id,
      created_at: task.created_at.toISOString(),
      updated_at: task.updated_at.toISOString()
    };
    
    res.status(201).json({
      message: 'Task created successfully',
      task: cleanTask
    });
  } catch (error: any) {
    console.error('Error creating task:', error);
    
    // Check if it's a Sequelize validation error
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map((err: any) => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));
      console.log('Validation errors:', validationErrors);
      return res.status(400).json({ 
        error: 'Database validation failed', 
        details: validationErrors 
      });
    }
    
    // Check if it's a foreign key constraint error
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      console.log('Foreign key constraint error - user might not exist');
      return res.status(400).json({ 
        error: 'Invalid user reference',
        details: 'User does not exist in database',
        userId: (req as any).user?.id,
        solution: 'Ensure the user exists in your users table'
      });
    }

    // Check for database constraint errors
    if (error.name === 'SequelizeDatabaseError') {
      return res.status(400).json({
        error: 'Database constraint violation',
        details: error.message,
        solution: 'Check your database schema and ensure all required columns allow the values being inserted'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to create task',
      details: error.message
    });
  }
});

// PUT /api/tasks/:id - Update a task
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const taskId = parseInt(req.params.id);
    console.log('Updating task:', taskId, 'for user:', userId);
    
    if (isNaN(taskId)) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }

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
      console.log('Task not found or not owned by user');
      return res.status(404).json({ error: 'Task not found' });
    }

    // Validate fields if provided
    if (priority && !['low', 'medium', 'high'].includes(priority)) {
      return res.status(400).json({ 
        error: 'Priority must be low, medium, or high',
        received: priority
      });
    }

    if (task_type && !['creative', 'admin'].includes(task_type)) {
      return res.status(400).json({ 
        error: 'Task type must be creative or admin',
        received: task_type
      });
    }

    if (status && !['pending', 'in_progress', 'completed'].includes(status)) {
      return res.status(400).json({ 
        error: 'Status must be pending, in_progress, or completed',
        received: status
      });
    }

    if (estimated_hours !== undefined && (estimated_hours < 0 || estimated_hours > 100)) {
      return res.status(400).json({ 
        error: 'Estimated hours must be between 0 and 100',
        received: estimated_hours
      });
    }

    // Validate and parse deadline if provided
    let parsedDeadline: Date | null | undefined = undefined;
    if (deadline !== undefined) {
      if (deadline === null) {
        parsedDeadline = null;
      } else if (deadline && isNaN(Date.parse(deadline))) {
        return res.status(400).json({ 
          error: 'Invalid deadline format',
          received: deadline
        });
      } else {
        parsedDeadline = deadline ? new Date(deadline) : null;
      }
    }

    // Build update object with only provided fields
    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (priority !== undefined) updateData.priority = priority;
    if (task_type !== undefined) updateData.task_type = task_type;
    if (status !== undefined) updateData.status = status;
    if (deadline !== undefined) updateData.deadline = parsedDeadline;
    if (estimated_hours !== undefined) updateData.estimated_hours = estimated_hours || null;

    console.log('Updating task with data:', updateData);

    // Update the task
    await task.update(updateData);

    console.log('Task updated successfully:', taskId);
    res.json({
      message: 'Task updated successfully',
      task: task
    });
  } catch (error: any) {
    console.error('Error updating task:', error);
    res.status(500).json({ 
      error: 'Failed to update task',
      details: error.message
    });
  }
});

// DELETE /api/tasks/:id - Delete a task
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const taskId = parseInt(req.params.id);
    console.log('Deleting task:', taskId, 'for user:', userId);
    
    if (isNaN(taskId)) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }

    // Find the task and verify ownership
    const task = await Task.findOne({
      where: { 
        id: taskId,
        user_id: userId 
      }
    });

    if (!task) {
      console.log('Task not found or not owned by user');
      return res.status(404).json({ error: 'Task not found' });
    }

    // Store task info before deletion
    const deletedTaskInfo = {
      id: task.id,
      title: task.title,
      status: task.status
    };

    // Delete the task
    await task.destroy();

    console.log('Task deleted successfully:', taskId);
    res.json({ 
      message: 'Task deleted successfully',
      deletedTask: deletedTaskInfo
    });
  } catch (error: any) {
    console.error('Error deleting task:', error);
    res.status(500).json({ 
      error: 'Failed to delete task',
      details: error.message
    });
  }
});

// GET /api/tasks/:id - Get a specific task
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const taskId = parseInt(req.params.id);
    
    if (isNaN(taskId)) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }

    const task = await Task.findOne({
      where: { 
        id: taskId,
        user_id: userId 
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({
      message: 'Task found',
      task: task
    });
  } catch (error: any) {
    console.error('Error fetching task:', error);
    res.status(500).json({ 
      error: 'Failed to fetch task',
      details: error.message
    });
  }
});

export default router;