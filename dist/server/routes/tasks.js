import express from 'express';
import { Task } from '../models/Task.js';
const router = express.Router();
// Simple middleware check (adjust this based on your existing auth setup)
const requireAuth = (req, res, next) => {
    console.log('Auth check - req.user:', req.user); // Debug log
    // Replace this with your actual auth check
    if (!req.user) {
        console.log('Authentication failed - no user found');
        return res.status(401).json({ error: 'Authentication required' });
    }
    next();
};
// GET /api/tasks - Get all tasks for the authenticated user
router.get('/', requireAuth, async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        console.log('Fetching tasks for user:', userId);
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const tasks = await Task.findAll({
            where: { user_id: userId },
            order: [['created_at', 'DESC']]
        });
        console.log(`Found ${tasks.length} tasks for user ${userId}`);
        res.json(tasks);
    }
    catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});
// POST /api/tasks - Create a new task
router.post('/', requireAuth, async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        console.log('Creating task for user:', userId);
        console.log('Request body:', req.body);
        if (!userId) {
            console.log('User ID not found in request');
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const { title, description, priority, task_type, deadline, estimated_hours } = req.body;
        // Validation
        if (!title || !priority || !task_type) {
            console.log('Validation failed - missing required fields');
            return res.status(400).json({
                error: 'Title, priority, and task_type are required'
            });
        }
        // Validate priority
        if (!['low', 'medium', 'high'].includes(priority)) {
            console.log('Invalid priority:', priority);
            return res.status(400).json({
                error: 'Priority must be low, medium, or high'
            });
        }
        // Validate task_type
        if (!['creative', 'admin'].includes(task_type)) {
            console.log('Invalid task_type:', task_type);
            return res.status(400).json({
                error: 'Task type must be creative or admin'
            });
        }
        // Validate estimated_hours if provided
        if (estimated_hours !== undefined && (estimated_hours < 0 || estimated_hours > 100)) {
            console.log('Invalid estimated_hours:', estimated_hours);
            return res.status(400).json({
                error: 'Estimated hours must be between 0 and 100'
            });
        }
        // Validate and parse deadline if provided
        let parsedDeadline = undefined;
        if (deadline) {
            if (isNaN(Date.parse(deadline))) {
                console.log('Invalid deadline format:', deadline);
                return res.status(400).json({
                    error: 'Invalid deadline format'
                });
            }
            parsedDeadline = new Date(deadline);
        }
        console.log('Creating task with data:', {
            user_id: userId,
            title: title.trim(),
            description: (description === null || description === void 0 ? void 0 : description.trim()) || null,
            priority,
            task_type,
            status: 'pending',
            deadline: parsedDeadline,
            estimated_hours: estimated_hours || null
        });
        const task = await Task.create({
            user_id: userId,
            title: title.trim(),
            description: (description === null || description === void 0 ? void 0 : description.trim()) || null,
            priority,
            task_type,
            status: 'pending',
            deadline: parsedDeadline,
            estimated_hours: estimated_hours || null
        });
        console.log('Task created successfully:', task.id);
        res.status(201).json(task);
    }
    catch (error) {
        console.error('Error creating task:', error);
        // Check if it's a Sequelize validation error
        if (error.name === 'SequelizeValidationError') {
            const validationErrors = error.errors.map((err) => ({
                field: err.path,
                message: err.message
            }));
            console.log('Validation errors:', validationErrors);
            return res.status(400).json({
                error: 'Validation failed',
                details: validationErrors
            });
        }
        // Check if it's a foreign key constraint error
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            console.log('Foreign key constraint error - user might not exist');
            return res.status(400).json({
                error: 'Invalid user reference'
            });
        }
        res.status(500).json({ error: 'Failed to create task' });
    }
});
// PUT /api/tasks/:id - Update a task
router.put('/:id', requireAuth, async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const taskId = parseInt(req.params.id);
        console.log('Updating task:', taskId, 'for user:', userId);
        if (isNaN(taskId)) {
            return res.status(400).json({ error: 'Invalid task ID' });
        }
        const { title, description, priority, task_type, status, deadline, estimated_hours } = req.body;
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
        // Validate and parse deadline if provided
        let parsedDeadline = undefined;
        if (deadline !== undefined) {
            if (deadline && isNaN(Date.parse(deadline))) {
                return res.status(400).json({
                    error: 'Invalid deadline format'
                });
            }
            parsedDeadline = deadline ? new Date(deadline) : undefined;
        }
        // Update the task
        await task.update(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (title !== undefined && { title: title.trim() })), (description !== undefined && { description: (description === null || description === void 0 ? void 0 : description.trim()) || null })), (priority !== undefined && { priority })), (task_type !== undefined && { task_type })), (status !== undefined && { status })), (deadline !== undefined && { deadline: parsedDeadline })), (estimated_hours !== undefined && { estimated_hours: estimated_hours || null })));
        console.log('Task updated successfully:', taskId);
        res.json(task);
    }
    catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ error: 'Failed to update task' });
    }
});
// DELETE /api/tasks/:id - Delete a task
router.delete('/:id', requireAuth, async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
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
        // Delete the task
        await task.destroy();
        console.log('Task deleted successfully:', taskId);
        res.json({
            message: 'Task deleted successfully',
            deletedTask: {
                id: task.id,
                title: task.title
            }
        });
    }
    catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ error: 'Failed to delete task' });
    }
});
// GET /api/tasks/:id - Get a specific task
router.get('/:id', requireAuth, async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
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
        res.json(task);
    }
    catch (error) {
        console.error('Error fetching task:', error);
        res.status(500).json({ error: 'Failed to fetch task' });
    }
});
export default router;
