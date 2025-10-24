import express, { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({
  model: 'gemini-pro',
  generationConfig: {
    temperature: 0.7,
    topP: 0.8,
    topK: 40,
    maxOutputTokens: 8192,
  }
});

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

// Enhanced route with actual Gemini AI
router.post('/generate-tasks', async (req: Request, res: Response) => {
  try {
    const { prompt }: AITaskRequest = req.body;
    
    if (!prompt || prompt.trim().length === 0) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const aiPrompt = `
You are a productivity assistant for content creators and streamers. Based on the following request, generate 2-5 relevant tasks in JSON format.

User Request: "${prompt}"

Please respond with ONLY a valid JSON array of tasks, where each task has:
- title: string (concise, actionable)
- description: string (more detailed explanation)
- priority: "low" | "medium" | "high"
- task_type: "creative" | "admin"
- estimated_hours: number (realistic estimate)

Example format:
[
  {
    "title": "Edit highlight reel",
    "description": "Create a 3-minute highlight compilation from last week's streams",
    "priority": "high",
    "task_type": "creative",
    "estimated_hours": 4
  }
]

Focus on practical, actionable tasks that help with content creation, streaming, social media, or business administration.`;

    const result = await model.generateContent(aiPrompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the AI response
    let tasks: GeneratedTask[];
    try {
      // Clean the response (remove any markdown formatting)
      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
      tasks = JSON.parse(cleanedText);
      
      // Validate the response structure
      if (!Array.isArray(tasks)) {
        throw new Error('Response is not an array');
      }
      
      // Validate each task
      tasks = tasks.map(task => ({
        title: task.title || 'Untitled Task',
        description: task.description || '',
        priority: ['low', 'medium', 'high'].includes(task.priority) ? task.priority : 'medium',
        task_type: ['creative', 'admin'].includes(task.task_type) ? task.task_type : 'creative',
        estimated_hours: typeof task.estimated_hours === 'number' ? task.estimated_hours : 2
      }));
      
    } catch (parseError) {
      console.error('Failed to parse AI response:', text);
      // Fallback to mock data if parsing fails
      tasks = [
        {
          title: "Review generated content",
          description: "The AI had trouble understanding your request. Please try rephrasing it.",
          priority: "medium",
          task_type: "admin",
          estimated_hours: 1
        }
      ];
    }
    
    res.json({ 
      tasks,
      message: `Generated ${tasks.length} tasks based on your request`
    });
    
  } catch (error: unknown) {
    console.error('AI generation error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Check if it's an API key issue
    if (errorMessage.includes('API key')) {
      return res.status(401).json({ 
        error: 'AI service authentication failed. Please check your API key configuration.' 
      });
    }
    
    // Check if it's a rate limit issue
    if (errorMessage.includes('quota')) {
      return res.status(429).json({ 
        error: 'AI service rate limit exceeded. Please try again later.' 
      });
    }
    
    res.status(500).json({ 
      error: 'AI generation failed. Please try again.',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
});

// Enhanced suggestions route with Gemini AI
router.post('/suggestions', async (req: Request, res: Response) => {
  try {
    const { tasks, calendarEvents, preferences }: AISuggestionsRequest = req.body;
    
    // First generate rule-based suggestions (your existing logic)
    const ruleBased = generateIntelligentSuggestions(tasks, calendarEvents, preferences);
    
    // Then enhance with AI-powered suggestions
    const aiEnhanced = await generateAISuggestions(tasks, calendarEvents, preferences);
    
    // Combine and deduplicate
    const allSuggestions = [...ruleBased, ...aiEnhanced];
    const uniqueSuggestions = allSuggestions.filter((suggestion, index, self) => 
      index === self.findIndex(s => s.title === suggestion.title)
    );
    
    res.json(uniqueSuggestions.slice(0, 10));
  } catch (error: unknown) {
    console.error('Error generating AI suggestions:', error);
    
    // Fallback to rule-based suggestions only
    const { tasks, calendarEvents, preferences }: AISuggestionsRequest = req.body;
    const fallbackSuggestions = generateIntelligentSuggestions(tasks, calendarEvents, preferences);
    res.json(fallbackSuggestions);
  }
});

// New AI-powered suggestions function
async function generateAISuggestions(
  tasks: Task[], 
  calendarEvents: CalendarEvent[], 
  preferences: AISuggestionsRequest['preferences']
): Promise<AISuggestion[]> {
  try {
    const aiPrompt = `
You are an AI productivity coach analyzing a content creator's workflow. Based on their current tasks and calendar, provide intelligent suggestions.

Current Tasks:
${JSON.stringify(tasks.map(t => ({
  title: t.title,
  priority: t.priority,
  type: t.task_type,
  status: t.status,
  deadline: t.deadline,
  hours: t.estimated_hours
})), null, 2)}

Calendar Events:
${JSON.stringify(calendarEvents.map(e => ({
  title: e.title,
  start: e.start,
  type: e.type
})), null, 2)}

User Preferences:
- Work hours per day: ${preferences.workHoursPerDay}
- Work days per week: ${preferences.workDaysPerWeek}
- Creative bias: ${preferences.creativeBias}

Generate 2-3 actionable suggestions in JSON format. Each suggestion should have:
- id: string (unique identifier)
- type: "task" | "calendar_block" | "optimization"
- title: string
- description: string
- reason: string (why this suggestion helps)
- suggestedDate?: string (YYYY-MM-DD format, optional)
- suggestedTime?: string (HH:MM format, optional)
- estimatedHours?: number
- priority?: "low" | "medium" | "high"
- task_type?: "creative" | "admin"

Focus on workflow optimization, preventing burnout, and improving content quality.

Respond with ONLY valid JSON array:`;

    const result = await model.generateContent(aiPrompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
      const suggestions = JSON.parse(cleanedText);
      
      return Array.isArray(suggestions) ? suggestions.slice(0, 3) : [];
    } catch (parseError) {
      console.error('Failed to parse AI suggestions:', text);
      return [];
    }
  } catch (error) {
    console.error('AI suggestions generation failed:', error);
    return [];
  }
}

// Your existing rule-based suggestions (keeping this as fallback)
function generateIntelligentSuggestions(
  tasks: Task[], 
  calendarEvents: CalendarEvent[], 
  preferences: AISuggestionsRequest['preferences']
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
  }

  return suggestions.slice(0, 5);
}

// Helper functions
function getNextMonday(): Date {
  const date = new Date();
  const day = date.getDay();
  const daysUntilMonday = day === 0 ? 1 : 8 - day;
  date.setDate(date.getDate() + daysUntilMonday);
  return date;
}

function getOptimalCreativeDay(): Date {
  const date = new Date();
  const currentDay = date.getDay();
  const daysUntilWednesday = currentDay <= 3 ? 3 - currentDay : 10 - currentDay;
  date.setDate(date.getDate() + daysUntilWednesday);
  return date;
}

export default router;