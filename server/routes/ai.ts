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
  // Temporarily disable Gemini AI due to model compatibility issues
  // Use rule-based fallback suggestions instead
  console.log('Using rule-based suggestions due to Gemini API model issues');
  return generateIntelligentSuggestions(tasks, calendarEvents, preferences);

  /* Disabled until Gemini API model issues are resolved
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
  */
}

// Enhanced intelligent suggestions with smart workflow analysis
function generateIntelligentSuggestions(
  tasks: Task[], 
  calendarEvents: CalendarEvent[], 
  preferences: AISuggestionsRequest['preferences']
): AISuggestion[] {
  const suggestions: AISuggestion[] = [];
  const timestamp = Date.now();
  
  // Ensure tasks is always an array before filtering
  const safeTasksArray = Array.isArray(tasks) ? tasks : [];
  const creativeTasks = safeTasksArray.filter(t => t.task_type === 'creative' && t.status !== 'completed');
  const adminTasks = safeTasksArray.filter(t => t.task_type === 'admin' && t.status !== 'completed');
  const completedTasks = safeTasksArray.filter(t => t.status === 'completed');
  const upcomingDeadlines = safeTasksArray.filter(t => {
    if (!t.deadline) return false;
    const deadline = new Date(t.deadline);
    const now = new Date();
    const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil > 0 && daysUntil <= 7 && t.status !== 'completed';
  });

  // Analyze existing tasks for intelligent suggestions  
  const taskTitles = safeTasksArray.map(t => t.title.toLowerCase());
  const taskDescriptions = safeTasksArray.map(t => (t.description || '').toLowerCase()).join(' ');

  // Helper function to check if a keyword exists in user's tasks
  const hasKeyword = (keywords: string[]) => {
    return keywords.some(keyword => 
      taskTitles.some(title => title.includes(keyword)) ||
      taskDescriptions.includes(keyword)
    );
  };

  // 1. SMART FOLLOW-UP SUGGESTIONS based on existing tasks
  safeTasksArray.forEach(task => {
    const title = task.title.toLowerCase();
    const isCreative = task.task_type === 'creative';
    
    // Video/Content creation workflow suggestions
    if (title.includes('script') && !hasKeyword(['record', 'film', 'shoot'])) {
      suggestions.push({
        id: `record-${task.id}-${timestamp}`,
        type: 'task',
        title: `Record ${task.title.replace(/script/i, 'Video')}`,
        description: `Film the video content for "${task.title}"`,
        reason: `You have a script ready - the next logical step is recording the content.`,
        estimatedHours: isCreative ? 3 : 2,
        priority: task.priority,
        task_type: 'creative',
        suggestedDate: task.deadline ? new Date(new Date(task.deadline).getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined
      });
    }

    if (title.includes('record') && !hasKeyword(['edit', 'editing'])) {
      suggestions.push({
        id: `edit-${task.id}-${timestamp}`,
        type: 'task',
        title: `Edit ${task.title.replace(/record/i, 'Video')}`,
        description: `Post-production editing for "${task.title}"`,
        reason: `After recording, editing is essential to create polished content.`,
        estimatedHours: 4,
        priority: task.priority,
        task_type: 'creative'
      });
    }

    if ((title.includes('video') || title.includes('content')) && !hasKeyword(['thumbnail', 'cover'])) {
      suggestions.push({
        id: `thumbnail-${task.id}-${timestamp}`,
        type: 'task',
        title: `Create thumbnail for ${task.title}`,
        description: `Design eye-catching thumbnail for "${task.title}"`,
        reason: `Thumbnails can increase click-through rates by up to 90%.`,
        estimatedHours: 1,
        priority: 'medium',
        task_type: 'creative'
      });
    }

    // Meeting follow-ups
    if (title.includes('meeting') && task.status === 'completed' && !hasKeyword(['follow-up', 'followup'])) {
      suggestions.push({
        id: `followup-${task.id}-${timestamp}`,
        type: 'task',
        title: `Follow-up: ${task.title}`,
        description: `Send follow-up email and action items from "${task.title}"`,
        reason: `Following up within 24 hours increases project success rates by 40%.`,
        estimatedHours: 0.5,
        priority: 'high',
        task_type: 'admin'
      });
    }

    // Brand/Partnership workflow
    if (title.includes('brand') || title.includes('partnership') || title.includes('sponsor')) {
      if (!hasKeyword(['contract', 'agreement'])) {
        suggestions.push({
          id: `contract-${task.id}-${timestamp}`,
          type: 'task',
          title: `Review contract for ${task.title}`,
          description: `Legal review and contract negotiation for "${task.title}"`,
          reason: `Proper contracts protect your interests and clarify expectations.`,
          estimatedHours: 1,
          priority: 'high',
          task_type: 'admin'
        });
      }
      if (!hasKeyword(['content plan', 'deliverables'])) {
        suggestions.push({
          id: `content-plan-${task.id}-${timestamp}`,
          type: 'task',
          title: `Content planning for ${task.title}`,
          description: `Plan deliverables and content timeline for "${task.title}"`,
          reason: `Clear content planning ensures successful brand partnerships.`,
          estimatedHours: 2,
          priority: 'medium',
          task_type: 'creative'
        });
      }
    }
  });

  // 2. DEADLINE-BASED URGENT SUGGESTIONS
  if (upcomingDeadlines.length > 0) {
    suggestions.push({
      id: `deadline-prep-${timestamp}`,
      type: 'optimization',
      title: 'Prepare for upcoming deadlines',
      description: `You have ${upcomingDeadlines.length} task(s) due this week. Consider breaking them into smaller chunks.`,
      reason: `Breaking large tasks into smaller ones increases completion rates by 60%.`,
      estimatedHours: 1,
      priority: 'high',
      task_type: 'admin'
    });
  }

  // 3. WORKLOAD BALANCE SUGGESTIONS
  const creativeHours = creativeTasks.reduce((sum, task) => sum + (task.estimated_hours || 0), 0);
  const adminHours = adminTasks.reduce((sum, task) => sum + (task.estimated_hours || 0), 0);

  if (creativeHours > adminHours * 3) {
    suggestions.push({
      id: `admin-balance-${timestamp}`,
      type: 'optimization',
      title: 'Schedule admin time',
      description: 'You have mostly creative work scheduled. Consider blocking time for business tasks.',
      reason: `Creative-heavy schedules often lead to admin task pile-up. Balance prevents overwhelm.`,
      estimatedHours: 2,
      priority: 'medium',
      task_type: 'admin'
    });
  }

  if (adminHours > creativeHours * 2) {
    suggestions.push({
      id: `creative-balance-${timestamp}`,
      type: 'optimization',
      title: 'Schedule creative time',
      description: 'Add some creative work to balance your administrative tasks.',
      reason: `Too much admin work can lead to creative burnout. Maintain your creative flow.`,
      estimatedHours: 3,
      priority: 'medium',
      task_type: 'creative'
    });
  }

  // 4. PROJECT-SPECIFIC SUGGESTIONS based on patterns
  if (hasKeyword(['tech', 'review', 'iphone', 'camera', 'gadget'])) {
    if (!hasKeyword(['unbox', 'first look'])) {
      suggestions.push({
        id: `unboxing-${timestamp}`,
        type: 'task',
        title: 'Create unboxing content',
        description: 'Film first impressions and unboxing experience',
        reason: 'Unboxing videos perform 300% better than standard reviews.',
        estimatedHours: 2,
        priority: 'medium',
        task_type: 'creative'
      });
    }
    if (!hasKeyword(['comparison', 'vs', 'compare'])) {
      suggestions.push({
        id: `comparison-${timestamp}`,
        type: 'task',
        title: 'Create comparison content',
        description: 'Compare with competing products or previous versions',
        reason: 'Comparison content helps viewers make informed decisions.',
        estimatedHours: 3,
        priority: 'medium',
        task_type: 'creative'
      });
    }
  }

  // 5. MAINTENANCE & GROWTH SUGGESTIONS  
  if (completedTasks.length > 0 && !hasKeyword(['analytics', 'metrics', 'performance'])) {
    suggestions.push({
      id: `analytics-review-${timestamp}`,
      type: 'task',
      title: 'Review content performance',
      description: 'Analyze metrics and performance of recent content',
      reason: 'Regular analytics review improves content strategy by 45%.',
      estimatedHours: 1,
      priority: 'low',
      task_type: 'admin'
    });
  }

  if (safeTasksArray.length > 3 && !hasKeyword(['social media', 'promotion', 'marketing'])) {
    suggestions.push({
      id: `social-promotion-${timestamp}`,
      type: 'task',
      title: 'Social media promotion strategy',
      description: 'Plan social media posts to promote your content',
      reason: 'Consistent social promotion increases content reach by 200%.',
      estimatedHours: 1,
      priority: 'medium',
      task_type: 'admin'
    });
  }

  // Remove duplicates and limit to 8 suggestions
  const uniqueSuggestions = suggestions.filter((suggestion, index, self) => 
    index === self.findIndex(s => s.title === suggestion.title)
  );

  return uniqueSuggestions.slice(0, 8);
}

export default router;