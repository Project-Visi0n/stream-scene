import React, { useState, useEffect } from 'react';
import TaskForm from './TaskForm';
import TaskList from './TaskList';
import { Task, TaskFormData } from '../types/task';

interface WeeklySchedule {
  id?: string;
  weekStarting: string;
  tasks: Task[];
  aiSuggestions?: string;
  creativeHours: number;
  adminHours: number;
  totalHours: number;
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

const AIWeeklyPlanner: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isGeneratingSchedule, setIsGeneratingSchedule] = useState(false);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'calendar' | 'suggestions'>('overview');
  
  // Calendar and AI suggestions state
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    return monday;
  });

  // Load tasks on component mount
  useEffect(() => {
    loadTasks();
  }, []);

  // Update calendar when tasks change
  useEffect(() => {
    generateCalendarEvents();
  }, [tasks, currentWeekStart]);

  const loadTasks = async () => {
    setIsLoadingTasks(true);
    try {
      const response = await fetch('/api/tasks', {
        credentials: 'include',
      });

      if (response.ok) {
        const tasksData = await response.json();
        setTasks(tasksData);
      } else {
        console.error('Failed to load tasks');
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const handleTaskSubmit = async (taskData: TaskFormData) => {
    setIsCreatingTask(true);
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: taskData.title,
          description: taskData.description,
          priority: taskData.priority,
          task_type: taskData.task_type,
          deadline: taskData.deadline,
          estimated_hours: taskData.estimated_hours || undefined
        })
      });

      if (response.ok) {
        const newTask = await response.json();
        setTasks(prev => [...prev, newTask]);
        setShowTaskForm(false);
        alert('Task created successfully! 🎉');
      } else if (response.status === 401) {
        alert('Please log in to create tasks. You need to be authenticated to use this feature.');
      } else {
        const error = await response.json();
        alert(`Failed to create task: ${error.message || error.error}`);
      }
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task. Please check your connection and try again.');
    } finally {
      setIsCreatingTask(false);
    }
  };

  const generateCalendarEvents = () => {
    const events: CalendarEvent[] = [];
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    // Convert tasks to calendar events
    tasks.forEach(task => {
      if (task.deadline) {
        const deadlineDate = new Date(task.deadline);
        if (deadlineDate >= currentWeekStart && deadlineDate <= weekEnd) {
          events.push({
            id: `deadline-${task.id}`,
            title: `📅 ${task.title} (Due)`,
            start: task.deadline,
            end: task.deadline,
            type: 'deadline',
            taskId: String(task.id),
            priority: task.priority
          });
        }
      }

      // Add suggested work blocks for incomplete tasks
      if (task.estimated_hours && task.status !== 'completed') {
        const workDate = new Date(currentWeekStart);
        workDate.setDate(workDate.getDate() + Math.floor(Math.random() * 5)); // Random weekday
        workDate.setHours(9 + Math.floor(Math.random() * 6)); // 9 AM to 3 PM slots
        
        const endTime = new Date(workDate);
        endTime.setHours(endTime.getHours() + Math.min(task.estimated_hours, 3));

        events.push({
          id: `work-${task.id}`,
          title: `${task.task_type === 'creative' ? '🎨' : '📋'} ${task.title}`,
          start: workDate.toISOString(),
          end: endTime.toISOString(),
          type: 'task',
          taskId: String(task.id),
          priority: task.priority
        });
      }
    });

    setCalendarEvents(events);
  };

  const generateAISchedule = async () => {
    if (tasks.length === 0) {
      alert('Please add some tasks first before generating a schedule!');
      return;
    }

    setIsGeneratingSchedule(true);
    try {
      const response = await fetch('/api/schedule/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          tasks: tasks.filter(task => task.status !== 'completed'),
          preferences: {
            workHoursPerDay: 8,
            workDaysPerWeek: 5,
            creativeBias: 0.6 
          }
        })
      });

      if (response.ok) {
        const schedule = await response.json();
        setWeeklySchedule(schedule);
      } else {
        const error = await response.json();
        alert(`Failed to generate schedule: ${error.message || error.error}`);
      }
    } catch (error) {
      console.error('Error generating schedule:', error);
      alert('Failed to generate schedule. Please try again.');
    } finally {
      setIsGeneratingSchedule(false);
    }
  };

  const generateAISuggestions = async () => {
    setIsGeneratingSuggestions(true);
    
    try {
      // Call your existing AI route or create a new one
      const response = await fetch('/api/ai/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          tasks: tasks,
          calendarEvents: calendarEvents,
          preferences: {
            workHoursPerDay: 8,
            workDaysPerWeek: 5,
            creativeBias: 0.6
          }
        })
      });

      if (response.ok) {
        const suggestions = await response.json();
        setAiSuggestions(suggestions);
      } else {
        // Fallback to local suggestions if API doesn't exist yet
        generateLocalSuggestions();
      }
    } catch (error) {
      console.error('Error calling AI API, using local suggestions:', error);
      generateLocalSuggestions();
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  const generateLocalSuggestions = () => {
    // Local AI-like analysis as fallback
    const suggestions: AISuggestion[] = [];
    
    // Analyze existing tasks for intelligent suggestions
    const creativeTasks = tasks.filter(t => t.task_type === 'creative' && t.status !== 'completed');
    const adminTasks = tasks.filter(t => t.task_type === 'admin' && t.status !== 'completed');
    const upcomingDeadlines = tasks.filter(t => {
      if (!t.deadline) return false;
      const deadline = new Date(t.deadline);
      const inThreeDays = new Date();
      inThreeDays.setDate(inThreeDays.getDate() + 3);
      return deadline <= inThreeDays && t.status !== 'completed';
    });

    // Suggest preparation tasks for upcoming deadlines
    upcomingDeadlines.forEach(task => {
      suggestions.push({
        id: `prep-${task.id}`,
        type: 'task',
        title: `Review and finalize: ${task.title}`,
        description: 'Add a buffer task to review and polish before deadline',
        reason: `You have "${task.title}" due soon. Adding a review step helps ensure quality.`,
        suggestedDate: new Date(new Date(task.deadline).getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedHours: Math.max(1, Math.floor((task.estimated_hours || 2) * 0.3)),
        priority: task.priority,
        task_type: task.task_type
      });
    });

    // Suggest balance if too many of one type
    if (creativeTasks.length > adminTasks.length * 2) {
      suggestions.push({
        id: 'balance-admin',
        type: 'task',
        title: 'Email inbox cleanup',
        description: 'Organize and respond to pending emails',
        reason: 'You have many creative tasks but few admin tasks. Balance helps productivity.',
        estimatedHours: 1,
        priority: 'low',
        task_type: 'admin'
      });
    } else if (adminTasks.length > creativeTasks.length * 2) {
      suggestions.push({
        id: 'balance-creative',
        type: 'task',
        title: 'Brainstorm new project ideas',
        description: 'Spend time on creative thinking and ideation',
        reason: 'You have many admin tasks but few creative ones. Creative work boosts innovation.',
        estimatedHours: 2,
        priority: 'medium',
        task_type: 'creative'
      });
    }

    // Suggest focus blocks for high-priority tasks
    const highPriorityTasks = tasks.filter(t => t.priority === 'high' && t.status !== 'completed');
    if (highPriorityTasks.length > 0) {
      suggestions.push({
        id: 'focus-block',
        type: 'calendar_block',
        title: 'Deep Focus Block - High Priority Tasks',
        description: 'Protected time for your most important work',
        reason: `You have ${highPriorityTasks.length} high-priority tasks. Block focused time to tackle them.`,
        suggestedTime: '09:00',
        estimatedHours: 3
      });
    }

    // Suggest weekly planning if no recent planning tasks
    const hasPlanning = tasks.some(t => 
      t.title.toLowerCase().includes('plan') || 
      t.title.toLowerCase().includes('review') ||
      t.title.toLowerCase().includes('strategy')
    );
    
    if (!hasPlanning) {
      suggestions.push({
        id: 'weekly-planning',
        type: 'task',
        title: 'Weekly planning and review session',
        description: 'Review progress and plan upcoming priorities',
        reason: 'Regular planning sessions improve productivity and goal alignment.',
        estimatedHours: 1,
        priority: 'medium',
        task_type: 'admin'
      });
    }

    setAiSuggestions(suggestions);
  };

  const addTaskFromSuggestion = async (suggestion: AISuggestion) => {
    const taskData: TaskFormData = {
      title: suggestion.title,
      description: suggestion.description,
      priority: suggestion.priority || 'medium',
      task_type: suggestion.task_type || 'admin',
      deadline: suggestion.suggestedDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      estimated_hours: suggestion.estimatedHours || 1
    };

    try {
      await handleTaskSubmit(taskData);
      setAiSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    } catch (error) {
      console.error('Failed to add task from suggestion:', error);
      // Don't remove the suggestion if it failed to create
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeekStart(newDate);
  };

  const getWeekDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(currentWeekStart);
      day.setDate(day.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getEventsForDay = (date: Date) => {
    const dayStr = date.toISOString().split('T')[0];
    return calendarEvents.filter(event => {
      const eventDate = new Date(event.start).toISOString().split('T')[0];
      return eventDate === dayStr;
    });
  };

  const getTaskStats = () => {
    const pending = tasks.filter(t => t.status === 'pending').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const creative = tasks.filter(t => t.task_type === 'creative').length;
    const admin = tasks.filter(t => t.task_type === 'admin').length;
    
    return { pending, inProgress, completed, creative, admin, total: tasks.length };
  };

  const stats = getTaskStats();

  const renderCalendarView = () => {
    const weekDays = getWeekDays();
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            📅 Calendar View
          </h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigateWeek('prev')}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
            >
              ←
            </button>
            <span className="text-white font-medium px-4">
              Week of {currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
            <button 
              onClick={() => navigateWeek('next')}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
            >
              →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, index) => {
            const events = getEventsForDay(day);
            const isToday = day.toDateString() === new Date().toDateString();
            
            return (
              <div key={index} className={`p-3 rounded-lg border ${isToday ? 'bg-blue-500/20 border-blue-400' : 'bg-white/5 border-white/10'}`}>
                <div className="text-center mb-2">
                  <div className="text-xs text-gray-300">
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className={`text-lg font-bold ${isToday ? 'text-blue-300' : 'text-white'}`}>
                    {day.getDate()}
                  </div>
                </div>
                <div className="space-y-1">
                  {events.map(event => (
                    <div 
                      key={event.id}
                      className={`text-xs p-2 rounded text-white ${
                        event.type === 'deadline' ? 'bg-red-500/80' :
                        event.type === 'task' ? 'bg-blue-500/80' :
                        'bg-purple-500/80'
                      }`}
                    >
                      <div className="font-medium truncate">{event.title}</div>
                      {event.start && (
                        <div className="text-xs opacity-75">
                          {new Date(event.start).toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit',
                            hour12: true 
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderSuggestionsView = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            🤖 AI Task Suggestions
          </h2>
          <button
            onClick={generateAISuggestions}
            disabled={isGeneratingSuggestions}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {isGeneratingSuggestions ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing...
              </span>
            ) : (
              '🧠 Analyze & Suggest'
            )}
          </button>
        </div>

        {aiSuggestions.length > 0 ? (
          <div className="space-y-4">
            {aiSuggestions.map(suggestion => (
              <div key={suggestion.id} className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-yellow-400">💡</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        suggestion.type === 'task' ? 'bg-blue-500/20 text-blue-300' :
                        suggestion.type === 'calendar_block' ? 'bg-green-500/20 text-green-300' :
                        'bg-purple-500/20 text-purple-300'
                      }`}>
                        {suggestion.type.replace('_', ' ')}
                      </span>
                      {suggestion.estimatedHours && (
                        <span className="text-xs text-gray-400">~{suggestion.estimatedHours}h</span>
                      )}
                      {suggestion.priority && (
                        <span className={`text-xs px-2 py-1 rounded ${
                          suggestion.priority === 'high' ? 'bg-red-500/20 text-red-300' :
                          suggestion.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                          'bg-green-500/20 text-green-300'
                        }`}>
                          {suggestion.priority}
                        </span>
                      )}
                    </div>
                    <h3 className="font-medium text-white mb-1">{suggestion.title}</h3>
                    <p className="text-sm text-gray-300 mb-2">{suggestion.description}</p>
                    <p className="text-xs text-gray-400">{suggestion.reason}</p>
                    {suggestion.suggestedDate && (
                      <p className="text-xs text-blue-300 mt-1">Suggested for: {suggestion.suggestedDate}</p>
                    )}
                  </div>
                  {suggestion.type === 'task' && (
                    <button
                      onClick={() => addTaskFromSuggestion(suggestion)}
                      className="ml-4 px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                    >
                      ➕ Add Task
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-lg font-semibold text-white mb-2">Ready for AI Magic?</h3>
            <p className="text-gray-300 text-sm mb-4">Let AI analyze your tasks and calendar to suggest optimizations</p>
            <button
              onClick={generateAISuggestions}
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Get Suggestions
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            🤖 AI Weekly Planner
          </h1>
          <p className="text-xl text-gray-300 mb-6">
            Balance creative and admin work with AI-powered scheduling
          </p>
          
          {/* Navigation Tabs */}
          <div className="flex justify-center mb-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-1 flex">
              {[
                { key: 'overview', label: '📋 Overview', icon: '📋' },
                { key: 'calendar', label: '📅 Calendar', icon: '📅' },
                { key: 'suggestions', label: '🤖 AI Suggestions', icon: '🤖' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'bg-white text-gray-900'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-sm text-gray-300">Total Tasks</div>
            </div>
            <div className="bg-yellow-500/20 backdrop-blur-sm rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-300">{stats.pending}</div>
              <div className="text-sm text-gray-300">Pending</div>
            </div>
            <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-300">{stats.inProgress}</div>
              <div className="text-sm text-gray-300">In Progress</div>
            </div>
            <div className="bg-purple-500/20 backdrop-blur-sm rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-300">{stats.creative}</div>
              <div className="text-sm text-gray-300">Creative</div>
            </div>
            <div className="bg-green-500/20 backdrop-blur-sm rounded-lg p-4">
              <div className="text-2xl font-bold text-green-300">{stats.admin}</div>
              <div className="text-sm text-gray-300">Admin</div>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Task Management */}
            <div className="lg:col-span-2 space-y-6">
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => setShowTaskForm(true)}
                  className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                >
                  ➕ Add New Task
                </button>
                <button
                  onClick={generateAISchedule}
                  disabled={isGeneratingSchedule || tasks.length === 0}
                  className="flex-1 sm:flex-none bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingSchedule ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </span>
                  ) : (
                    '🚀 Generate AI Schedule'
                  )}
                </button>
              </div>

              {/* Task Form Modal */}
              {showTaskForm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <TaskForm
                      onSubmit={handleTaskSubmit}
                      onCancel={() => setShowTaskForm(false)}
                      isLoading={isCreatingTask}
                    />
                  </div>
                </div>
              )}

              {/* Task List */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <h2 className="text-2xl font-bold text-white mb-4">📋 Your Tasks</h2>
                {isLoadingTasks ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
                    <p className="text-gray-300 mt-4">Loading tasks...</p>
                  </div>
                ) : tasks.length > 0 ? (
                  <TaskList tasks={tasks} onTaskUpdate={loadTasks} />
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📝</div>
                    <h3 className="text-xl font-semibold text-white mb-2">No tasks yet</h3>
                    <p className="text-gray-300 mb-6">Create your first task to get started with AI scheduling!</p>
                    <button
                      onClick={() => setShowTaskForm(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      ➕ Add Your First Task
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - AI Schedule */}
            <div className="space-y-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <h2 className="text-2xl font-bold text-white mb-4">🤖 AI Weekly Schedule</h2>
                
                {weeklySchedule ? (
                  <div className="space-y-4">
                    <div className="text-green-300 font-medium">
                      ✅ Schedule Generated!
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-purple-500/20 rounded-lg p-3">
                        <div className="font-medium text-purple-300">Creative Hours</div>
                        <div className="text-2xl font-bold text-white">{weeklySchedule.creativeHours}h</div>
                      </div>
                      <div className="bg-blue-500/20 rounded-lg p-3">
                        <div className="font-medium text-blue-300">Admin Hours</div>
                        <div className="text-2xl font-bold text-white">{weeklySchedule.adminHours}h</div>
                      </div>
                    </div>

                    {weeklySchedule.aiSuggestions && (
                      <div className="bg-gray-800/50 rounded-lg p-4">
                        <h4 className="font-medium text-white mb-2">💡 AI Suggestions:</h4>
                        <p className="text-gray-300 text-sm">{weeklySchedule.aiSuggestions}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">🤖</div>
                    <h3 className="text-lg font-semibold text-white mb-2">Ready for AI Magic?</h3>
                    <p className="text-gray-300 text-sm mb-4">Add some tasks and let AI create your perfect weekly schedule</p>
                    <button
                      onClick={generateAISchedule}
                      disabled={tasks.length === 0}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Generate Schedule
                    </button>
                  </div>
                )}
              </div>

              {/* Quick Tips */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <h3 className="text-lg font-bold text-white mb-3">💡 Pro Tips</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• Mix creative and admin tasks for better balance</li>
                  <li>• Set realistic deadlines for better AI scheduling</li>
                  <li>• Use estimated hours to help AI plan your week</li>
                  <li>• High priority tasks get scheduled first</li>
                  <li>• Check the Calendar tab to see your week layout</li>
                  <li>• Use AI Suggestions to optimize your workflow</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Calendar Tab */}
        {activeTab === 'calendar' && (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            {renderCalendarView()}
          </div>
        )}

        {/* Suggestions Tab */}
        {activeTab === 'suggestions' && (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            {renderSuggestionsView()}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIWeeklyPlanner;