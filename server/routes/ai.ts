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

// New interfaces for suggestions feature
interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  task_type: 'creative' | 'admin';
  status: 'pending' | 'in_progress' | 'completed';
  deadline: string;
  estimated_hours?: number;
  created_at: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  type: 'task' | 'meeting' | 'deadline' | 'focus_time';
  taskId?: string;
  priority?: string;
}

interface AISuggestionsRequest {
  tasks: Task[];
  calendarEvents: CalendarEvent[];
  preferences: {
    workHoursPerDay: number;
    workDaysPerWeek: number;
    creativeBias: number;
  };
}

interface AISuggestion {
  id: string;
  type: 'task' | 'calendar_block' | 'optimization';
  title: string;
  description: string;
  reason: string;
  suggestedDate?: string;
  suggestedTime?: string;
  estimatedHours?: number;
  priority?: 'low' | 'medium' | 'high';
  task_type?: 'creative' | 'admin';
}

// Existing route
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

// New suggestions route for the enhanced planner
router.post('/suggestions', async (req: Request, res: Response) => {
  try {
    const { tasks, calendarEvents, preferences }: AISuggestionsRequest = req.body;
    
    // Generate intelligent suggestions based on user's tasks and calendar
    const suggestions: AISuggestion[] = generateIntelligentSuggestions(tasks, calendarEvents, preferences);
    
    res.json(suggestions);
  } catch (error) {
    console.error('Error generating AI suggestions:', error);
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});

// Helper function to generate intelligent suggestions
function generateIntelligentSuggestions(
  tasks: Task[], 
  calendarEvents: CalendarEvent[], 
  preferences: any
): AISuggestion[] {
  const suggestions: AISuggestion[] = [];
  const now = new Date();
  
  // Filter incomplete tasks
  const incompleteTasks = tasks.filter(t => t.status !== 'completed');
  const creativeTasks = incompleteTasks.filter(t => t.task_type === 'creative');
  const adminTasks = incompleteTasks.filter(t => t.task_type === 'admin');
  
  // 1. Suggest preparation tasks for upcoming deadlines
  const upcomingDeadlines = incompleteTasks.filter(task => {
    if (!task.deadline) return false;
    const deadline = new Date(task.deadline);
    const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilDeadline <= 3 && daysUntilDeadline > 0;
  });

  upcomingDeadlines.forEach(task => {
    const reviewDate = new Date(task.deadline);
    reviewDate.setDate(reviewDate.getDate() - 1);
    
    suggestions.push({
      id: `prep-${task.id}`,
      type: 'task',
      title: `Final review: ${task.title}`,
      description: 'Review, polish, and prepare for submission',
      reason: `"${task.title}" is due soon. Adding a review buffer helps ensure quality delivery.`,
      suggestedDate: reviewDate.toISOString().split('T')[0],
      estimatedHours: Math.max(1, Math.floor((task.estimated_hours || 2) * 0.25)),
      priority: task.priority,
      task_type: task.task_type
    });
  });

  // 2. Suggest work-life balance improvements
  const creativeBias = creativeTasks.length / (creativeTasks.length + adminTasks.length || 1);
  
  if (creativeBias > 0.8 && adminTasks.length < 3) {
    suggestions.push({
      id: 'balance-admin',
      type: 'task',
      title: 'Admin catchup session',
      description: 'Handle pending emails, invoices, and administrative tasks',
      reason: 'You have many creative tasks but few admin tasks. Balance helps prevent admin overflow.',
      estimatedHours: 2,
      priority: 'medium',
      task_type: 'admin'
    });
  } else if (creativeBias < 0.3 && creativeTasks.length < 2) {
    suggestions.push({
      id: 'balance-creative',
      type: 'task',
      title: 'Creative exploration time',
      description: 'Dedicate time to brainstorming, sketching, or creative experimentation',
      reason: 'You have many admin tasks but few creative ones. Creative work prevents burnout and sparks innovation.',
      estimatedHours: 3,
      priority: 'medium',
      task_type: 'creative'
    });
  }

  // 3. Suggest focus blocks for high-priority tasks
  const highPriorityTasks = incompleteTasks.filter(t => t.priority === 'high');
  if (highPriorityTasks.length >= 2) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    suggestions.push({
      id: 'focus-block-high',
      type: 'calendar_block',
      title: 'Deep Focus Block - High Priority Work',
      description: 'Protected time block for tackling your most important tasks without interruptions',
      reason: `You have ${highPriorityTasks.length} high-priority tasks. Blocking focused time increases completion rates by 60%.`,
      suggestedDate: tomorrow.toISOString().split('T')[0],
      suggestedTime: '09:00',
      estimatedHours: 3
    });
  }

  // 4. Suggest planning sessions if none exist
  const hasRecentPlanning = tasks.some(task => {
    const planningKeywords = ['plan', 'review', 'strategy', 'organize', 'goal'];
    const titleLower = task.title.toLowerCase();
    const isRecent = new Date(task.created_at) > new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return planningKeywords.some(keyword => titleLower.includes(keyword)) && isRecent;
  });
  
  if (!hasRecentPlanning) {
    const nextMonday = getNextMonday();
    suggestions.push({
      id: 'weekly-planning',
      type: 'task',
      title: 'Weekly planning and goal setting',
      description: 'Review last week\'s progress and set priorities for the upcoming week',
      reason: 'Regular planning sessions improve productivity by 25% and help maintain focus on important goals.',
      suggestedDate: nextMonday.toISOString().split('T')[0],
      estimatedHours: 1,
      priority: 'medium',
      task_type: 'admin'
    });
  }

  // 5. Suggest breaks for overloaded schedules
  const totalEstimatedHours = incompleteTasks.reduce((sum, task) => sum + (task.estimated_hours || 0), 0);
  const maxWeeklyHours = preferences.workHoursPerDay * preferences.workDaysPerWeek;
  
  if (totalEstimatedHours > maxWeeklyHours * 1.2) {
    suggestions.push({
      id: 'schedule-optimization',
      type: 'optimization',
      title: 'Consider task prioritization',
      description: 'Your current task load exceeds optimal weekly capacity',
      reason: `You have ${totalEstimatedHours}h of work but only ${maxWeeklyHours}h available. Consider postponing low-priority tasks.`,
      estimatedHours: 0.5,
      priority: 'high',
      task_type: 'admin'
    });
  }

  // 6. Suggest creative blocks if user has creative bias
  if (preferences.creativeBias > 0.6 && creativeTasks.length >= 2) {
    const creativeBlockDate = getOptimalCreativeDay();
    suggestions.push({
      id: 'creative-block',
      type: 'calendar_block',
      title: 'Creative Deep Dive Session',
      description: 'Extended time block for creative work when your energy is highest',
      reason: 'Your creative preference suggests blocking longer creative sessions for better flow state.',
      suggestedDate: creativeBlockDate.toISOString().split('T')[0],
      suggestedTime: '10:00',
      estimatedHours: 4
    });
  }

  // 7. Suggest task breakdown for large tasks
  const largeTasks = incompleteTasks.filter(task => (task.estimated_hours || 0) > 6);
  largeTasks.forEach(task => {
    suggestions.push({
      id: `breakdown-${task.id}`,
      type: 'task',
      title: `Plan phases for: ${task.title}`,
      description: 'Break down large task into smaller, manageable phases',
      reason: `"${task.title}" is estimated at ${task.estimated_hours}h. Breaking it down improves completion rates.`,
      estimatedHours: 0.5,
      priority: 'medium',
      task_type: 'admin'
    });
  });

  return suggestions.slice(0, 8); // Limit to 8 suggestions to avoid overwhelming
}

// Helper functions
function getNextMonday(): Date {
  const date = new Date();
  const day = date.getDay();
  const daysUntilMonday = day === 0 ? 1 : 8 - day; // If Sunday, next day; otherwise, days until next Monday
  date.setDate(date.getDate() + daysUntilMonday);
  return date;
}

function getOptimalCreativeDay(): Date {
  // Suggest Wednesday (day 3) as optimal creative day
  const date = new Date();
  const currentDay = date.getDay();
  const daysUntilWednesday = currentDay <= 3 ? 3 - currentDay : 10 - currentDay;
  date.setDate(date.getDate() + daysUntilWednesday);
  return date;
}

export default router;