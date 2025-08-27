import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
const router = express.Router();
// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
// POST /api/schedule/generate - Generate AI-powered weekly schedule
router.post('/generate', async (req, res) => {
    try {
        const { tasks, preferences } = req.body;
        if (!tasks || tasks.length === 0) {
            return res.status(400).json({
                error: 'No tasks provided. Please add some tasks first.'
            });
        }
        // Filter out completed tasks
        const incompleteTasks = tasks.filter(task => task.status !== 'completed');
        if (incompleteTasks.length === 0) {
            return res.status(400).json({
                error: 'All tasks are completed. Add some pending tasks to generate a schedule.'
            });
        }
        // Generate schedule using AI
        const schedule = await generateAISchedule(incompleteTasks, preferences);
        res.json(schedule);
    }
    catch (error) {
        console.error('Error generating schedule:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        if (errorMessage.includes('API key') || errorMessage.includes('authentication')) {
            return res.status(401).json({
                error: 'AI service authentication failed. Please check your API key.'
            });
        }
        if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
            return res.status(429).json({
                error: 'AI service rate limit exceeded. Please try again later.'
            });
        }
        // Fallback to rule-based scheduling
        console.log('Falling back to rule-based scheduling...');
        const fallbackSchedule = generateRuleBasedSchedule(req.body.tasks.filter((task) => task.status !== 'completed'), req.body.preferences);
        res.json(fallbackSchedule);
    }
});
// AI-powered schedule generation
async function generateAISchedule(tasks, preferences) {
    const aiPrompt = `
You are an AI productivity coach specializing in content creator workflows. Generate an optimal weekly schedule based on these tasks and preferences.

TASKS TO SCHEDULE:
${JSON.stringify(tasks.map(t => ({
        id: t.id,
        title: t.title,
        type: t.task_type,
        priority: t.priority,
        estimatedHours: t.estimated_hours || 2,
        deadline: t.deadline
    })), null, 2)}

USER PREFERENCES:
- Work hours per day: ${preferences.workHoursPerDay}
- Work days per week: ${preferences.workDaysPerWeek}
- Creative bias: ${preferences.creativeBias} (0 = admin focused, 1 = creative focused)

SCHEDULING RULES:
1. High priority tasks get scheduled first
2. Creative work should be done during peak energy hours (9 AM - 1 PM)
3. Admin tasks can be done during lower energy periods
4. Respect the creative bias preference
5. Don't overload any single day
6. Leave buffer time between tasks

Respond with ONLY valid JSON in this format:
{
  "creativeHours": number,
  "adminHours": number,
  "totalHours": number,
  "timeBlocks": [
    {
      "day": "Monday",
      "startTime": "09:00",
      "endTime": "11:00", 
      "taskId": "task_id",
      "taskTitle": "Task Title",
      "taskType": "creative",
      "priority": "high"
    }
  ],
  "aiSuggestions": "Brief summary of scheduling strategy and tips",
  "insights": ["insight 1", "insight 2", "insight 3"]
}`;
    try {
        const result = await model.generateContent(aiPrompt);
        const response = await result.response;
        const text = response.text();
        // Clean and parse AI response
        const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
        const aiSchedule = JSON.parse(cleanedText);
        // Create the final schedule object
        const schedule = {
            id: `schedule_${Date.now()}`,
            weekStarting: getNextMonday().toISOString().split('T')[0],
            tasks: tasks,
            aiSuggestions: aiSchedule.aiSuggestions || "AI-generated schedule optimized for your workflow.",
            creativeHours: aiSchedule.creativeHours || 0,
            adminHours: aiSchedule.adminHours || 0,
            totalHours: aiSchedule.totalHours || 0,
            timeBlocks: aiSchedule.timeBlocks || [],
            insights: aiSchedule.insights || []
        };
        return schedule;
    }
    catch (parseError) {
        console.error('AI parsing failed, using rule-based fallback:', parseError);
        return generateRuleBasedSchedule(tasks, preferences);
    }
}
// Rule-based fallback schedule generation
function generateRuleBasedSchedule(tasks, preferences) {
    const creativeTasks = tasks.filter(t => t.task_type === 'creative');
    const adminTasks = tasks.filter(t => t.task_type === 'admin');
    const creativeHours = creativeTasks.reduce((sum, task) => sum + (task.estimated_hours || 2), 0);
    const adminHours = adminTasks.reduce((sum, task) => sum + (task.estimated_hours || 1), 0);
    // Simple time block generation
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const timeBlocks = [];
    let currentDay = 0;
    let currentHour = 9;
    // Schedule high priority tasks first
    const sortedTasks = [...tasks].sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
    sortedTasks.forEach(task => {
        if (currentDay >= days.length)
            return; // Don't overflow the week
        const duration = Math.min(task.estimated_hours || 2, 3); // Max 3 hours per block
        const endHour = currentHour + duration;
        // If this would go past work hours, move to next day
        if (endHour > 9 + preferences.workHoursPerDay) {
            currentDay++;
            currentHour = 9;
            if (currentDay >= days.length)
                return;
        }
        timeBlocks.push({
            day: days[currentDay],
            startTime: `${currentHour.toString().padStart(2, '0')}:00`,
            endTime: `${(currentHour + duration).toString().padStart(2, '0')}:00`,
            taskId: task.id,
            taskTitle: task.title,
            taskType: task.task_type,
            priority: task.priority
        });
        currentHour += duration + 0.5; // Add 30min buffer
    });
    return {
        id: `schedule_${Date.now()}`,
        weekStarting: getNextMonday().toISOString().split('T')[0],
        tasks: tasks,
        aiSuggestions: `Generated a balanced schedule with ${creativeTasks.length} creative tasks and ${adminTasks.length} admin tasks. High priority items are scheduled during peak productivity hours.`,
        creativeHours,
        adminHours,
        totalHours: creativeHours + adminHours,
        timeBlocks,
        insights: [
            `Total workload: ${creativeHours + adminHours} hours across ${timeBlocks.length} time blocks`,
            `Creative vs Admin ratio: ${Math.round((creativeHours / (creativeHours + adminHours)) * 100)}% creative work`,
            'High priority tasks scheduled during morning hours for better focus'
        ]
    };
}
// Helper function
function getNextMonday() {
    const date = new Date();
    const day = date.getDay();
    const daysUntilMonday = day === 0 ? 1 : 8 - day;
    date.setDate(date.getDate() + daysUntilMonday);
    return date;
}
export default router;
