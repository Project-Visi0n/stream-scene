import express from 'express';
import { Task } from '../models/Task.js';
const router = express.Router();
// Debug endpoint to check auth details
router.get('/debug/auth', (req, res) => {
    var _a;
    console.log('=== TASK AUTH DEBUG ===');
    console.log('Session ID:', req.sessionID);
    console.log('Session data:', req.session);
    console.log('User object:', req.user);
    console.log('Is authenticated:', (_a = req.isAuthenticated) === null || _a === void 0 ? void 0 : _a.call(req));
    console.log('Cookies:', req.headers.cookie);
    console.log('User-Agent:', req.headers['user-agent']);
    console.log('Referer:', req.headers.referer);
    console.log('Request headers:', req.headers);
    const userInfo = req.user;
    res.json({
        authenticated: !!req.user,
        user: req.user || null,
        userId: (userInfo === null || userInfo === void 0 ? void 0 : userInfo.id) || null,
        sessionId: req.sessionID,
        debug: {
            hasSession: !!req.session,
            hasUser: !!req.user,
            userType: typeof req.user,
            userKeys: req.user ? Object.keys(req.user) : null,
            sessionKeys: req.session ? Object.keys(req.session) : null
        }
    });
});
// Enhanced middleware check with detailed debugging
const requireAuth = (req, res, next) => {
    var _a, _b, _c;
    console.log('=== AUTH DEBUG START ===');
    console.log('req.user:', req.user);
    console.log('req.session:', req.session);
    console.log('req.headers.authorization:', req.headers.authorization);
    console.log('req.headers.cookie:', req.headers.cookie);
    console.log('req.cookies:', req.cookies);
    console.log('=== AUTH DEBUG END ===');
    // Check multiple possible auth sources
    let user = null;
    // Option 1: Check req.user (Passport.js style)
    if (req.user) {
        user = req.user;
        console.log('Found user in req.user');
    }
    // Option 2: Check session (session-based auth)
    else if ((_a = req.session) === null || _a === void 0 ? void 0 : _a.user) {
        user = req.session.user;
        req.user = user; // Set for consistency
        console.log('Found user in req.session.user');
    }
    // Option 3: Check JWT token (if using JWT)
    else if ((_b = req.headers.authorization) === null || _b === void 0 ? void 0 : _b.startsWith('Bearer ')) {
        const token = req.headers.authorization.replace('Bearer ', '');
        try {
            // Replace this with your actual JWT verification
            // const decoded = jwt.verify(token, process.env.JWT_SECRET);
            // user = decoded;
            console.log('JWT token found but verification not implemented');
        }
        catch (error) {
            console.log('JWT verification failed:', error);
        }
    }
    if (!user) {
        console.log('Authentication failed - no user found in any source');
        return res.status(401).json({
            error: 'Authentication required',
            debug: {
                hasReqUser: !!req.user,
                hasSession: !!req.session,
                hasSessionUser: !!((_c = req.session) === null || _c === void 0 ? void 0 : _c.user),
                hasAuthHeader: !!req.headers.authorization,
                hasCookies: !!req.headers.cookie
            }
        });
    }
    console.log('Authentication successful for user:', user.id || user.email || 'unknown');
    next();
};
// Debug endpoint to check what tasks are returned
router.get('/debug/tasks', requireAuth, async (req, res) => {
    const user = req.user;
    const userId = user === null || user === void 0 ? void 0 : user.id;
    console.log('=== TASK DEBUG ===');
    console.log('User ID for task query:', userId);
    console.log('User object:', user);
    try {
        // Get ALL tasks first (this is dangerous but for debugging)
        const allTasks = await Task.findAll({
            limit: 10
        });
        console.log('ALL TASKS (first 10):', allTasks.map(t => ({
            id: t.id,
            title: t.title,
            user_id: t.user_id,
            created_at: t.created_at
        })));
        // Get user-specific tasks
        const userTasks = await Task.findAll({
            where: { user_id: userId },
            limit: 10
        });
        console.log('USER TASKS:', userTasks.map(t => ({
            id: t.id,
            title: t.title,
            user_id: t.user_id,
            created_at: t.created_at
        })));
        res.json({
            userId,
            totalTasks: allTasks.length,
            userSpecificTasks: userTasks.length,
            allTasksSample: allTasks.slice(0, 5).map(t => ({
                id: t.id,
                title: t.title,
                user_id: t.user_id
            })),
            userTasks: userTasks.map(t => ({
                id: t.id,
                title: t.title,
                user_id: t.user_id
            }))
        });
    }
    catch (error) {
        console.error('Debug task query error:', error);
        res.status(500).json({ error: 'Debug query failed' });
    }
});
// DEBUG ENDPOINT - Remove this in production!
router.get('/debug-auth', (req, res) => {
    var _a;
    console.log('=== DEBUG AUTH ENDPOINT ===');
    const debugInfo = {
        timestamp: new Date().toISOString(),
        user: req.user,
        session: req.session,
        authenticated: !!req.user || !!((_a = req.session) === null || _a === void 0 ? void 0 : _a.user),
        headers: {
            authorization: req.headers.authorization,
            cookie: req.headers.cookie,
            'user-agent': req.headers['user-agent']
        },
        cookies: req.cookies,
        sessionID: req.sessionID,
        ip: req.ip
    };
    console.log('Debug info:', JSON.stringify(debugInfo, null, 2));
    res.json(debugInfo);
});
// TEST ENDPOINT - Create a test user and task (Remove in production!)
router.post('/test-setup', async (req, res) => {
    try {
        // This is a testing endpoint - create a fake user session
        const testUser = {
            id: 1,
            email: 'test@example.com',
            name: 'Test User'
        };
        // Initialize session if it doesn't exist
        if (!req.session) {
            console.log('Warning: Session not initialized. Make sure session middleware is configured.');
            return res.status(500).json({
                error: 'Session not configured',
                solution: 'Ensure express-session middleware is properly set up'
            });
        }
        // Set user in session (adjust based on your auth system)
        req.session.user = testUser;
        req.user = testUser;
        console.log('Test user session created:', testUser);
        res.json({
            message: 'Test user session created',
            user: testUser,
            sessionId: req.sessionID,
            nextSteps: [
                'Now try: curl -X POST http://localhost:8000/api/tasks/test-task -b cookies.txt',
                'Or visit: curl http://localhost:8000/api/tasks/debug-auth -b cookies.txt'
            ]
        });
    }
    catch (error) {
        console.error('Test setup failed:', error);
        res.status(500).json({ error: 'Test setup failed' });
    }
});
// TEST TASK CREATION - Create a test task with fake user
router.post('/test-task', async (req, res) => {
    try {
        console.log('=== TEST TASK CREATION ===');
        // Create fake user for testing
        const testUser = { id: 1, email: 'test@example.com' };
        req.user = testUser;
        console.log('Using test user:', testUser);
        // Set a valid deadline that won't cause database issues
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7); // 7 days from now
        const testTask = {
            user_id: testUser.id,
            title: 'Test Task from API',
            description: 'This is a test task created via API',
            priority: 'medium',
            task_type: 'creative',
            status: 'pending',
            deadline: futureDate,
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
    }
    catch (error) {
        console.error('Test task creation failed:', error);
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(400).json({
                error: 'Foreign key constraint failed',
                details: 'User with ID 1 does not exist in database',
                solution: 'Create a user with ID 1 in your database first, or check your User model/table'
            });
        }
        if (error.name === 'SequelizeValidationError') {
            const validationErrors = error.errors.map((err) => ({
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
router.get('/', requireAuth, async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        console.log('=== FETCHING TASKS ===');
        console.log('User ID:', userId);
        console.log('User object:', req.user);
        console.log('Session ID:', req.sessionID);
        console.log('Request headers:', req.headers);
        if (!userId) {
            console.log('❌ No user ID found, returning 401');
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
        const cleanTasks = tasks.map(task => ({
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
        }));
        console.log(`Found ${tasks.length} tasks for user ${userId}`);
        res.json({
            message: `Found ${tasks.length} tasks`,
            tasks: cleanTasks,
            user_id: userId
        });
    }
    catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({
            error: 'Failed to fetch tasks',
            details: error.message
        });
    }
});
// POST /api/tasks - Create a new task
router.post('/', requireAuth, async (req, res) => {
    var _a, _b;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        console.log('=== TASK CREATION DEBUG ===');
        console.log('Creating task for user:', userId);
        console.log('User object:', req.user);
        console.log('Request body:', req.body);
        console.log('Headers:', req.headers);
        if (!userId) {
            console.log('❌ User ID not found in request');
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
        const { title, description, priority, task_type, deadline, estimated_hours } = req.body;
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
        let parsedDeadline = null;
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
            description: (description === null || description === void 0 ? void 0 : description.trim()) || undefined,
            priority,
            task_type,
            status: 'pending',
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
    }
    catch (error) {
        console.error('Error creating task:', error);
        // Check if it's a Sequelize validation error
        if (error.name === 'SequelizeValidationError') {
            const validationErrors = error.errors.map((err) => ({
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
                userId: (_b = req.user) === null || _b === void 0 ? void 0 : _b.id,
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
        let parsedDeadline = undefined;
        if (deadline !== undefined) {
            if (deadline === null) {
                parsedDeadline = null;
            }
            else if (deadline && isNaN(Date.parse(deadline))) {
                return res.status(400).json({
                    error: 'Invalid deadline format',
                    received: deadline
                });
            }
            else {
                parsedDeadline = deadline ? new Date(deadline) : null;
            }
        }
        // Build update object with only provided fields
        const updateData = {};
        if (title !== undefined)
            updateData.title = title.trim();
        if (description !== undefined)
            updateData.description = (description === null || description === void 0 ? void 0 : description.trim()) || null;
        if (priority !== undefined)
            updateData.priority = priority;
        if (task_type !== undefined)
            updateData.task_type = task_type;
        if (status !== undefined)
            updateData.status = status;
        if (deadline !== undefined)
            updateData.deadline = parsedDeadline;
        if (estimated_hours !== undefined)
            updateData.estimated_hours = estimated_hours || null;
        console.log('Updating task with data:', updateData);
        // Update the task
        await task.update(updateData);
        console.log('Task updated successfully:', taskId);
        res.json({
            message: 'Task updated successfully',
            task: task
        });
    }
    catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({
            error: 'Failed to update task',
            details: error.message
        });
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
    }
    catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({
            error: 'Failed to delete task',
            details: error.message
        });
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
        res.json({
            message: 'Task found',
            task: task
        });
    }
    catch (error) {
        console.error('Error fetching task:', error);
        res.status(500).json({
            error: 'Failed to fetch task',
            details: error.message
        });
    }
});
export default router;
