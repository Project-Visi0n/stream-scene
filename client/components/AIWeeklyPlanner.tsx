import React, { useState, useEffect } from 'react';
import TaskForm from './TaskForm';
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

type CalendarView = 'monthly' | 'weekly' | 'daily';

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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<CalendarView>('monthly');
  
  // Task filtering state
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed' | 'creative' | 'admin'>('all');
  
  // Confirmation dialogs
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter tasks based on current filter
  const getFilteredTasks = () => {
    switch (taskFilter) {
      case 'pending':
        return tasks.filter(t => t.status === 'pending');
      case 'in_progress':
        return tasks.filter(t => t.status === 'in_progress');
      case 'completed':
        return tasks.filter(t => t.status === 'completed');
      case 'creative':
        return tasks.filter(t => t.task_type === 'creative');
      case 'admin':
        return tasks.filter(t => t.task_type === 'admin');
      default:
        return tasks;
    }
  };

  const filteredTasks = getFilteredTasks();

  // Load tasks on component mount
  useEffect(() => {
    loadTasks();
  }, []);

  // Update calendar when tasks change
  useEffect(() => {
    generateCalendarEvents();
  }, [tasks, currentDate]);

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

  // Delete task functionality
  const handleDeleteTask = async (task: Task) => {
    setTaskToDelete(task);
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/tasks/${taskToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setTasks(prev => prev.filter(t => t.id !== taskToDelete.id));
        setTaskToDelete(null);
        alert('Task deleted successfully! 🗑️');
      } else {
        const error = await response.json();
        alert(`Failed to delete task: ${error.message || error.error}`);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const generateCalendarEvents = () => {
    const events: CalendarEvent[] = [];
    
    // Get date range based on current view
    let startDate: Date, endDate: Date;
    
    if (calendarView === 'monthly') {
      startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    } else if (calendarView === 'weekly') {
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1);
      startDate = weekStart;
      endDate = new Date(weekStart);
      endDate.setDate(endDate.getDate() + 6);
    } else { // daily
      startDate = new Date(currentDate);
      endDate = new Date(currentDate);
    }

    // Convert tasks to calendar events
    tasks.forEach(task => {
      if (task.deadline) {
        const deadlineDate = new Date(task.deadline);
        if (deadlineDate >= startDate && deadlineDate <= endDate) {
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
        const workDate = new Date(startDate);
        workDate.setDate(workDate.getDate() + Math.floor(Math.random() * 5));
        workDate.setHours(9 + Math.floor(Math.random() * 6));
        
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
        console.log('AI suggestions received:', suggestions);
        setAiSuggestions(suggestions || []);
      } else {
        console.log('AI API failed, using local suggestions');
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
    const suggestions: AISuggestion[] = [];
    const timestamp = Date.now();
    
    // Generate fresh suggestions every time
    const creativeTasks = tasks.filter(t => t.task_type === 'creative' && t.status !== 'completed');
    const adminTasks = tasks.filter(t => t.task_type === 'admin' && t.status !== 'completed');
    
    // 1. Planning and organization suggestions
    suggestions.push({
      id: `weekly-planning-${timestamp}`,
      type: 'task',
      title: 'Weekly planning and goal review',
      description: 'Review progress from last week and set priorities for the upcoming week',
      reason: 'Regular planning sessions improve productivity by 25% and help maintain focus on important goals.',
      estimatedHours: 1,
      priority: 'medium',
      task_type: 'admin'
    });

    // 2. Content creation suggestions
    if (creativeTasks.length < 3) {
      suggestions.push({
        id: `content-brainstorm-${timestamp}`,
        type: 'task',
        title: 'Content brainstorming session',
        description: 'Generate new content ideas and plan upcoming creative projects',
        reason: 'Regular creative brainstorming prevents content burnout and maintains fresh ideas.',
        estimatedHours: 2,
        priority: 'medium',
        task_type: 'creative'
      });
    }

    // 3. Balance suggestions
    if (creativeTasks.length > adminTasks.length * 2) {
      suggestions.push({
        id: `balance-admin-${timestamp}`,
        type: 'optimization',
        title: 'Business administration session',
        description: 'Handle invoicing, contracts, and other business-related tasks',
        reason: 'You have many creative tasks but few admin tasks. Balance helps prevent admin overflow.',
        estimatedHours: 2,
        priority: 'medium',
        task_type: 'admin'
      });
    }

    console.log('Generated local suggestions:', suggestions);
    setAiSuggestions(suggestions.slice(0, 6));
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
        setAiSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
        alert(`✅ Task "${suggestion.title}" added successfully!`);
      } else if (response.status === 401) {
        alert('Please log in to create tasks. You need to be authenticated to use this feature.');
      } else {
        const error = await response.json();
        alert(`Failed to create task: ${error.message || error.error}`);
        console.error('Task creation failed:', error);
      }
    } catch (error) {
      console.error('Failed to add task from suggestion:', error);
      alert('Failed to create task. Please check your connection and try again.');
    }
  };

  // Calendar navigation functions
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    if (calendarView === 'monthly') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (calendarView === 'weekly') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else { // daily
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    }
    
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Calendar rendering functions
  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getWeekDays = () => {
    const days = [];
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1);
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(day.getDate() + i);
      days.push(day);
    }
    
    return days;
  };

  const getEventsForDay = (date: Date | null) => {
    if (!date) return [];
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

  const renderMonthlyView = () => {
    const monthDays = getMonthDays();
    const today = new Date();
    
    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-white">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
        </div>
        
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-300 py-2">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {monthDays.map((day, index) => {
            if (!day) {
              return <div key={index} className="aspect-square"></div>;
            }
            
            const events = getEventsForDay(day);
            const isToday = day.toDateString() === today.toDateString();
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            
            return (
              <div 
                key={index} 
                className={`aspect-square p-2 rounded-lg border cursor-pointer transition-colors ${
                  isToday ? 'bg-blue-500/30 border-blue-400' : 
                  isCurrentMonth ? 'bg-white/5 border-white/10 hover:bg-white/10' : 
                  'bg-gray-800/30 border-gray-700'
                }`}
                onClick={() => setCurrentDate(day)}
              >
                <div className={`text-sm font-medium mb-1 ${
                  isToday ? 'text-blue-300' : 
                  isCurrentMonth ? 'text-white' : 
                  'text-gray-500'
                }`}>
                  {day.getDate()}
                </div>
                <div className="space-y-1">
                  {events.slice(0, 2).map(event => (
                    <div 
                      key={event.id}
                      className={`text-xs p-1 rounded truncate ${
                        event.type === 'deadline' ? 'bg-red-500/60 text-white' :
                        event.type === 'task' ? 'bg-blue-500/60 text-white' :
                        'bg-purple-500/60 text-white'
                      }`}
                      title={event.title}
                    >
                      {event.title}
                    </div>
                  ))}
                  {events.length > 2 && (
                    <div className="text-xs text-gray-400">+{events.length - 2} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderCalendarView = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            📅 Calendar View
          </h2>
          
          <div className="flex items-center gap-2">
            <div className="bg-white/10 rounded-lg p-1 flex">
              {[
                { key: 'monthly', label: 'Month', icon: '📅' },
                { key: 'weekly', label: 'Week', icon: '📊' },
                { key: 'daily', label: 'Day', icon: '📋' }
              ].map(view => (
                <button
                  key={view.key}
                  onClick={() => setCalendarView(view.key as CalendarView)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    calendarView === view.key
                      ? 'bg-white text-gray-900'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  {view.icon} {view.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigateDate('prev')}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
          >
            ← Previous
          </button>
          
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Today
          </button>
          
          <button 
            onClick={() => navigateDate('next')}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
          >
            Next →
          </button>
        </div>

        {calendarView === 'monthly' && renderMonthlyView()}
      </div>
    );
  };

  const renderSuggestionsView = () => {
    const actionableSuggestions = aiSuggestions.filter(s => s.type === 'task');
    const insights = aiSuggestions.filter(s => s.type === 'optimization' || s.type === 'calendar_block');

    return (
      <div className="space-y-8">
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

        {(actionableSuggestions.length > 0 || insights.length > 0) ? (
          <div className="space-y-8">
            {actionableSuggestions.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-xl font-bold text-white">✅ Suggested Tasks</h3>
                  <span className="text-sm text-gray-400">({actionableSuggestions.length} actionable items)</span>
                </div>
                <div className="space-y-4">
                  {actionableSuggestions.map((suggestion, index) => (
                    <div key={`task-${suggestion.id}-${index}`} className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-blue-400">📋</span>
                            <span className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-300">
                              task
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
                          <h4 className="font-medium text-white mb-1">{suggestion.title}</h4>
                          <p className="text-sm text-gray-300 mb-2">{suggestion.description}</p>
                          <p className="text-xs text-gray-400">{suggestion.reason}</p>
                          {suggestion.suggestedDate && (
                            <p className="text-xs text-blue-300 mt-1">Suggested for: {suggestion.suggestedDate}</p>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            console.log('Adding task suggestion:', suggestion);
                            addTaskFromSuggestion(suggestion);
                          }}
                          className="ml-4 px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50"
                          disabled={isCreatingTask}
                        >
                          {isCreatingTask ? '⏳ Adding...' : '➕ Add Task'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {insights.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-xl font-bold text-white">💡 AI Insights</h3>
                  <span className="text-sm text-gray-400">({insights.length} recommendations)</span>
                </div>
                <div className="space-y-4">
                  {insights.map((insight, index) => (
                    <div key={`insight-${insight.id}-${index}`} className={`rounded-lg p-4 border ${
                      insight.type === 'optimization' 
                        ? 'bg-purple-500/10 border-purple-400/30' 
                        : 'bg-green-500/10 border-green-400/30'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={insight.type === 'optimization' ? 'text-purple-400' : 'text-green-400'}>
                              {insight.type === 'optimization' ? '⚡' : '📅'}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              insight.type === 'optimization' 
                                ? 'bg-purple-500/20 text-purple-300' 
                                : 'bg-green-500/20 text-green-300'
                            }`}>
                              {insight.type === 'optimization' ? 'workflow optimization' : 'schedule recommendation'}
                            </span>
                          </div>
                          <h4 className="font-medium text-white mb-1">{insight.title}</h4>
                          <p className="text-sm text-gray-300 mb-2">{insight.description}</p>
                          <p className="text-xs text-gray-400">{insight.reason}</p>
                        </div>
                        <div className={`ml-4 px-3 py-1 text-sm rounded ${
                          insight.type === 'optimization'
                            ? 'bg-purple-600/20 text-purple-300'
                            : 'bg-green-600/20 text-green-300'
                        }`}>
                          {insight.type === 'optimization' ? '💭 Consider This' : '📅 Manual Schedule'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-center pt-4">
              <button
                onClick={generateAISuggestions}
                disabled={isGeneratingSuggestions}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {isGeneratingSuggestions ? '🔄 Generating...' : '🔄 Generate New Suggestions'}
              </button>
            </div>
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

  // Enhanced TaskList with delete functionality
  const renderEnhancedTaskList = () => {
    return (
      <div className="space-y-4">
        {filteredTasks.map(task => (
          <div key={task.id} className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2 py-1 rounded ${
                    task.priority === 'high' ? 'bg-red-500/20 text-red-300' :
                    task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                    'bg-green-500/20 text-green-300'
                  }`}>
                    {task.priority}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    task.task_type === 'creative' ? 'bg-purple-500/20 text-purple-300' :
                    'bg-blue-500/20 text-blue-300'
                  }`}>
                    {task.task_type}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    task.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                    task.status === 'in_progress' ? 'bg-blue-500/20 text-blue-300' :
                    'bg-gray-500/20 text-gray-300'
                  }`}>
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
                <h3 className="font-medium text-white mb-1">{task.title}</h3>
                {task.description && (
                  <p className="text-sm text-gray-300 mb-2">{task.description}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  {task.deadline && (
                    <span>📅 Due: {new Date(task.deadline).toLocaleDateString()}</span>
                  )}
                  {task.estimated_hours && (
                    <span>⏱️ {task.estimated_hours}h estimated</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => handleDeleteTask(task)}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Delete task"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const stats = getTaskStats();

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
            <div 
              onClick={() => setTaskFilter('all')}
              className={`backdrop-blur-sm rounded-lg p-4 cursor-pointer transition-all hover:scale-105 hover:bg-white/20 ${
                taskFilter === 'all' ? 'bg-white/20 ring-2 ring-white/50' : 'bg-white/10'
              }`}
            >
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-sm text-gray-300">Total Tasks</div>
            </div>
            <div 
              onClick={() => setTaskFilter('pending')}
              className={`backdrop-blur-sm rounded-lg p-4 cursor-pointer transition-all hover:scale-105 hover:bg-yellow-500/30 ${
                taskFilter === 'pending' ? 'bg-yellow-500/30 ring-2 ring-yellow-400/50' : 'bg-yellow-500/20'
              }`}
            >
              <div className="text-2xl font-bold text-yellow-300">{stats.pending}</div>
              <div className="text-sm text-gray-300">Pending</div>
            </div>
            <div 
              onClick={() => setTaskFilter('in_progress')}
              className={`backdrop-blur-sm rounded-lg p-4 cursor-pointer transition-all hover:scale-105 hover:bg-blue-500/30 ${
                taskFilter === 'in_progress' ? 'bg-blue-500/30 ring-2 ring-blue-400/50' : 'bg-blue-500/20'
              }`}
            >
              <div className="text-2xl font-bold text-blue-300">{stats.inProgress}</div>
              <div className="text-sm text-gray-300">In Progress</div>
            </div>
            <div 
              onClick={() => setTaskFilter('creative')}
              className={`backdrop-blur-sm rounded-lg p-4 cursor-pointer transition-all hover:scale-105 hover:bg-purple-500/30 ${
                taskFilter === 'creative' ? 'bg-purple-500/30 ring-2 ring-purple-400/50' : 'bg-purple-500/20'
              }`}
            >
              <div className="text-2xl font-bold text-purple-300">{stats.creative}</div>
              <div className="text-sm text-gray-300">Creative</div>
            </div>
            <div 
              onClick={() => setTaskFilter('admin')}
              className={`backdrop-blur-sm rounded-lg p-4 cursor-pointer transition-all hover:scale-105 hover:bg-green-500/30 ${
                taskFilter === 'admin' ? 'bg-green-500/30 ring-2 ring-green-400/50' : 'bg-green-500/20'
              }`}
            >
              <div className="text-2xl font-bold text-green-300">{stats.admin}</div>
              <div className="text-sm text-gray-300">Admin</div>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
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

              {taskToDelete && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
                    <h3 className="text-lg font-bold text-white mb-4">Delete Task</h3>
                    <p className="text-gray-300 mb-6">
                      Are you sure you want to delete "{taskToDelete.title}"? This action cannot be undone.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setTaskToDelete(null)}
                        className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={confirmDeleteTask}
                        disabled={isDeleting}
                        className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-white">📋 Your Tasks</h2>
                  <div className="flex items-center gap-2">
                    {taskFilter !== 'all' && (
                      <div className="flex items-center gap-2">
                        <span className={`text-sm px-3 py-1 rounded-full ${
                          taskFilter === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                          taskFilter === 'in_progress' ? 'bg-blue-500/20 text-blue-300' :
                          taskFilter === 'completed' ? 'bg-green-500/20 text-green-300' :
                          taskFilter === 'creative' ? 'bg-purple-500/20 text-purple-300' :
                          'bg-green-500/20 text-green-300'
                        }`}>
                          Showing: {taskFilter.replace('_', ' ')} ({filteredTasks.length})
                        </span>
                        <button
                          onClick={() => setTaskFilter('all')}
                          className="text-xs px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                        >
                          Clear Filter
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {isLoadingTasks ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
                    <p className="text-gray-300 mt-4">Loading tasks...</p>
                  </div>
                ) : filteredTasks.length > 0 ? (
                  renderEnhancedTaskList()
                ) : taskFilter !== 'all' ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-xl font-semibold text-white mb-2">No {taskFilter.replace('_', ' ')} tasks</h3>
                    <p className="text-gray-300 mb-6">You don't have any tasks in this category yet.</p>
                    <button
                      onClick={() => setTaskFilter('all')}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      View All Tasks
                    </button>
                  </div>
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

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <h3 className="text-lg font-bold text-white mb-3">💡 Pro Tips</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• Mix creative and admin tasks for better balance</li>
                  <li>• Set realistic deadlines for better AI scheduling</li>
                  <li>• Use estimated hours to help AI plan your week</li>
                  <li>• High priority tasks get scheduled first</li>
                  <li>• Check the Calendar tab to see your week layout</li>
                  <li>• Use AI Suggestions to optimize your workflow</li>
                  <li>• Click 🗑️ to delete tasks you no longer need</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            {renderCalendarView()}
          </div>
        )}

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