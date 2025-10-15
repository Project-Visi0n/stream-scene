import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  HiMagnifyingGlass,
  HiPencilSquare,
  HiLightBulb,
  HiCog6Tooth,
  HiSparkles,
  HiClock,
  HiDocumentText,
  HiChartBarSquare,
  HiExclamationTriangle
} from 'react-icons/hi2';
import { 
  FaRobot,
  FaCalendarAlt,
  FaBrain,
  FaTasks,
  FaCheckCircle,
  FaTimes
} from 'react-icons/fa';
import TaskForm from './TaskForm';
import TagInput from './TagInput';
import { Task, TaskFormData } from '../types/task';

// Replace the problematic custom SVG components with React Icons
const AIIcon = () => <FaRobot className="w-8 h-8 text-purple-400" />;
const SchedulerIcon = () => <FaCalendarAlt className="w-8 h-8 text-blue-400" />;
const AIIconSmall = () => <FaBrain className="w-5 h-5 text-purple-400" />;
const SchedulerIconSmall = () => <FaCalendarAlt className="w-6 h-6 text-blue-400" />;

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
type TaskSortOption = 'priority' | 'deadline' | 'created' | 'type';

const AIWeeklyPlanner: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed' | 'creative' | 'admin'>('all');
  const [selectedTagsFilter, setSelectedTagsFilter] = useState<string[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
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
  
  // Task filtering and sorting state
  const [taskSort, setTaskSort] = useState<TaskSortOption>('priority');
  const [expandedStats, setExpandedStats] = useState<string | null>(null);
  
  // Confirmation dialogs
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Task details modal state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetails, setShowTaskDetails] = useState(false);

  // Suggestion edit form
  const [editingSuggestion, setEditingSuggestion] = useState<AISuggestion | null>(null);

  // Notification state
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Task sorting function
  const sortTasks = (tasks: Task[], sortBy: TaskSortOption) => {
    return [...tasks].sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'deadline':
          if (!a.deadline && !b.deadline) return 0;
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        case 'created':
          if (!a.created_at && !b.created_at) return 0;
          if (!a.created_at) return 1;
          if (!b.created_at) return -1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'type':
          return a.task_type.localeCompare(b.task_type);
        default:
          return 0;
      }
    });
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const getFilteredTasks = () => {
    if (!tasks || tasks.length === 0) return [];
    
    // Apply status/type filter first
    let filtered;
    switch (taskFilter) {
      case 'pending':
        filtered = tasks.filter(task => task.status === 'pending');
        break;
      case 'in_progress':
        filtered = tasks.filter(task => task.status === 'in_progress');
        break;
      case 'completed':
        filtered = tasks.filter(task => task.status === 'completed');
        break;
      case 'creative':
        filtered = tasks.filter(task => task.task_type === 'creative');
        break;
      case 'admin':
        filtered = tasks.filter(task => task.task_type === 'admin');
        break;
      default:
        filtered = tasks;
    }
    
    // Apply tag filter if any tags are selected
    if (selectedTagsFilter.length > 0) {
      filtered = filtered.filter(task => 
        task.tags && task.tags.some(tag => selectedTagsFilter.includes(tag))
      );
    }
    
    return filtered;
  };

  const filteredTasks = getFilteredTasks();

  // Notification helper function
  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

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
        const responseData = await response.json();
        
        // Handle different API response formats
        let tasksData;
        if (Array.isArray(responseData)) {
          // Direct array response
          tasksData = responseData;
        } else if (responseData.tasks && Array.isArray(responseData.tasks)) {
          // Wrapped in tasks property
          tasksData = responseData.tasks;
        } else if (responseData.data && Array.isArray(responseData.data)) {
          // Wrapped in data property
          tasksData = responseData.data;
        } else {
          console.error('Unexpected response format:', responseData);
          tasksData = [];
        }

        // Validate and sanitize task data
        const validTasks = tasksData.filter((task: any) => {
          if (!task || typeof task !== 'object') {
            console.warn('Invalid task object:', task);
            return false;
          }
          
          // Ensure required properties exist with defaults
          const validatedTask = {
            ...task,
            priority: task.priority || 'medium',
            task_type: task.task_type || 'admin', 
            status: task.status || 'pending'
          };
          
          // Replace original task with validated version
          Object.assign(task, validatedTask);
          return true;
        });
        
        console.log('Validated tasks:', validTasks.length, 'of', tasksData.length);
        setTasks(validTasks);
      } else {
        console.error('Failed to load tasks');
        setTasks([]); // Fallback to empty array on error
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      setTasks([]); // Fallback to empty array on error
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
        const responseData = await response.json();
        // Extract the task from the response (server returns {message, task})
        const newTask = responseData.task || responseData;
        
        // Validate and sanitize the new task data
        if (!newTask.title || !newTask.priority || !newTask.task_type) {
          showNotification('error', 'Received invalid task data from server');
          return;
        }
        
        // Ensure all required fields are present with defaults
        const validatedTask = {
          ...newTask,
          priority: newTask.priority || 'medium',
          task_type: newTask.task_type || 'admin',
          status: newTask.status || 'pending',
          deadline: newTask.deadline || null,
          description: newTask.description || '',
        };
        
        setTasks(prev => [...prev, validatedTask]);
        setShowTaskForm(false);
        showNotification('success', 'Task created successfully!');
      } else if (response.status === 401) {
        showNotification('error', 'Please log in to create tasks. You need to be authenticated to use this feature.');
      } else {
        const error = await response.json();
        showNotification('error', `Failed to create task: ${error.message || error.error}`);
      }
    } catch (error) {
      console.error('Error creating task:', error);
      showNotification('error', 'Failed to create task. Please check your connection and try again.');
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
        showNotification('success', 'Task deleted successfully!');
      } else {
        const error = await response.json();
        showNotification('error', `Failed to delete task: ${error.message || error.error}`);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      showNotification('error', 'Failed to delete task. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle calendar event clicks
  const handleEventClick = (event: CalendarEvent) => {
    if (event.taskId) {
      const task = tasks.find(t => String(t.id) === event.taskId);
      if (task) {
        setSelectedTask(task);
        setShowTaskDetails(true);
      }
    }
  };

  // Generate consistent calendar events
  const generateCalendarEvents = () => {
    const events: CalendarEvent[] = [];
    
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
    } else {
      startDate = new Date(currentDate);
      endDate = new Date(currentDate);
    }

    tasks.forEach(task => {
      if (!task || typeof task !== 'object') return;
      
      if (task.deadline) {
        const deadlineDate = new Date(task.deadline);
        if (deadlineDate >= startDate && deadlineDate <= endDate) {
          events.push({
            id: `deadline-${task.id}`,
            title: `Due: ${task.title}`,
            start: task.deadline,
            end: task.deadline,
            type: 'deadline',
            taskId: String(task.id),
            priority: task.priority || 'medium'
          });
        }
      }

      if (task.estimated_hours && task.status !== 'completed') {
        let workDate: Date;
        
        if (task.deadline) {
          workDate = new Date(task.deadline);
          workDate.setDate(workDate.getDate() - Math.max(1, Math.ceil(task.estimated_hours / 4)));
        } else {
          const dayOffset = (parseInt(String(task.id)) % 7);
          workDate = new Date(startDate);
          workDate.setDate(startDate.getDate() + dayOffset);
        }
        
        const baseHour = (task.task_type === 'creative') ? 9 : 14;
        const priority = task.priority || 'medium';
        const priorityOffset = priority === 'high' ? 0 : priority === 'medium' ? 1 : 2;
        workDate.setHours(baseHour + priorityOffset, 0, 0, 0);
        
        const endTime = new Date(workDate);
        endTime.setHours(endTime.getHours() + Math.min(task.estimated_hours, 3));

        if (workDate >= startDate && workDate <= endDate) {
          events.push({
            id: `work-${task.id}`,
            title: `${(task.task_type === 'creative') ? 'Creative' : 'Admin'}: ${task.title}`,
            start: workDate.toISOString(),
            end: endTime.toISOString(),
            type: 'task',
            taskId: String(task.id),
            priority: task.priority || 'medium'
          });
        }
      }
    });

    setCalendarEvents(events);
  };

  const generateAISchedule = async () => {
    const safeTasksArray = Array.isArray(tasks) ? tasks : [];
    if (safeTasksArray.length === 0) {
      showNotification('info', 'Please add some tasks first before generating a schedule!');
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
          tasks: safeTasksArray.filter(task => task.status !== 'completed'),
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
        showNotification('error', `Failed to generate schedule: ${error.message || error.error}`);
      }
    } catch (error) {
      console.error('Error generating schedule:', error);
      showNotification('error', 'Failed to generate schedule. Please try again.');
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
    // Ensure tasks is always an array before filtering
    const safeTasksArray = Array.isArray(tasks) ? tasks : [];
    const creativeTasks = safeTasksArray.filter(t => t.task_type === 'creative' && t.status !== 'completed');
    const adminTasks = safeTasksArray.filter(t => t.task_type === 'admin' && t.status !== 'completed');
    
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
      estimated_hours: suggestion.estimatedHours || 1,
      tags: []
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
        const responseData = await response.json();
        // Extract the task from the response (server returns {message, task})
        const newTask = responseData.task || responseData;
        
        // Validate and sanitize the new task data
        if (!newTask.title || !newTask.priority || !newTask.task_type) {
          showNotification('error', 'Received invalid task data from server');
          return;
        }
        
        // Ensure all required fields are present with defaults
        const validatedTask = {
          ...newTask,
          priority: newTask.priority || 'medium',
          task_type: newTask.task_type || 'admin',
          status: newTask.status || 'pending',
          deadline: newTask.deadline || null,
          description: newTask.description || '',
        };
        
        setTasks(prev => [...prev, validatedTask]);
        setAiSuggestions(prev => Array.isArray(prev) ? prev.filter(s => s.id !== suggestion.id) : []);
        showNotification('success', `Task "${suggestion.title}" added successfully!`);
      } else if (response.status === 401) {
        showNotification('error', 'Please log in to create tasks. You need to be authenticated to use this feature.');
      } else {
        const error = await response.json();
        showNotification('error', `Failed to create task: ${error.message || error.error}`);
        console.error('Task creation failed:', error);
      }
    } catch (error) {
      console.error('Failed to add task from suggestion:', error);
      showNotification('error', 'Failed to create task. Please check your connection and try again.');
    }
  };

  // Calendar navigation functions
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    if (calendarView === 'monthly') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (calendarView === 'weekly') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
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
    const safeCalendarEvents = Array.isArray(calendarEvents) ? calendarEvents : [];
    const dayStr = date.toISOString().split('T')[0];
    return safeCalendarEvents.filter(event => {
      const eventDate = new Date(event.start).toISOString().split('T')[0];
      return eventDate === dayStr;
    });
  };

  const getTaskStats = () => {
    const safeTasksArray = Array.isArray(tasks) ? tasks : [];
    const pending = safeTasksArray.filter(t => t.status === 'pending').length;
    const inProgress = safeTasksArray.filter(t => t.status === 'in_progress').length;
    const completed = safeTasksArray.filter(t => t.status === 'completed').length;
    const creative = safeTasksArray.filter(t => t.task_type === 'creative').length;
    const admin = safeTasksArray.filter(t => t.task_type === 'admin').length;
    
    return { pending, inProgress, completed, creative, admin, total: tasks.length };
  };

  // Handle stat click to show filtered tasks
  const handleStatClick = (filterType: 'all' | 'pending' | 'in_progress' | 'completed' | 'creative' | 'admin') => {
    if (expandedStats === filterType) {
      setExpandedStats(null);
    } else {
      setExpandedStats(filterType);
      setTaskFilter(filterType);
    }
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
                      className={`text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 ${
                        event.type === 'deadline' ? 'bg-red-500/60 text-white' :
                        event.type === 'task' ? 'bg-blue-500/60 text-white' :
                        'bg-purple-500/60 text-white'
                      }`}
                      title={event.title}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEventClick(event);
                      }}
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

  const renderWeeklyView = () => {
    const weekDays = getWeekDays();
    const today = new Date();
    
    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-white">
            Week of {weekDays[0].toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - {weekDays[6].toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {weekDays.map((day, index) => {
            const events = getEventsForDay(day);
            const isToday = day.toDateString() === today.toDateString();
            
            return (
              <div key={index} className={`bg-white/5 rounded-lg p-4 min-h-[300px] ${
                isToday ? 'ring-2 ring-blue-400 bg-blue-500/10' : ''
              }`}>
                <div className={`text-center mb-4 ${
                  isToday ? 'text-blue-300 font-bold' : 'text-white'
                }`}>
                  <div className="text-sm font-medium">
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className="text-lg font-bold">
                    {day.getDate()}
                  </div>
                </div>
                
                <div className="space-y-2">
                  {events.map(event => (
                    <div 
                      key={event.id}
                      className={`text-xs p-2 rounded cursor-pointer hover:opacity-80 ${
                        event.type === 'deadline' ? 'bg-red-500/60 text-white' :
                        event.type === 'task' ? 'bg-blue-500/60 text-white' :
                        'bg-purple-500/60 text-white'
                      }`}
                      title={event.title}
                      onClick={() => handleEventClick(event)}
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
                  {events.length === 0 && (
                    <div className="text-gray-400 text-xs text-center py-4">
                      No events
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDailyView = () => {
    const events = getEventsForDay(currentDate);
    const today = new Date();
    const isToday = currentDate.toDateString() === today.toDateString();
    
    const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM
    
    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-white">
            {currentDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric', 
              year: 'numeric' 
            })}
            {isToday && <span className="text-blue-300 ml-2">(Today)</span>}
          </h3>
        </div>
        
        <div className="bg-white/5 rounded-lg p-6">
          <div className="space-y-1">
            {hours.map(hour => {
              const hourEvents = events.filter(event => {
                if (!event.start) return false;
                const eventHour = new Date(event.start).getHours();
                return eventHour === hour;
              });
              
              return (
                <div key={hour} className="flex items-start gap-4 py-2 border-b border-white/10 last:border-b-0">
                  <div className="w-16 text-sm text-gray-400 font-medium">
                    {hour === 0 ? '12 AM' : 
                     hour < 12 ? `${hour} AM` : 
                     hour === 12 ? '12 PM' : 
                     `${hour - 12} PM`}
                  </div>
                  
                  <div className="flex-1 min-h-[40px]">
                    {hourEvents.length > 0 ? (
                      <div className="space-y-1">
                        {hourEvents.map(event => (
                          <div 
                            key={event.id}
                            className={`p-2 rounded text-sm cursor-pointer hover:opacity-80 ${
                              event.type === 'deadline' ? 'bg-red-500/60 text-white' :
                              event.type === 'task' ? 'bg-blue-500/60 text-white' :
                              'bg-purple-500/60 text-white'
                            }`}
                            onClick={() => handleEventClick(event)}
                          >
                            <div className="font-medium">{event.title}</div>
                            {event.start && event.end && (
                              <div className="text-xs opacity-75">
                                {new Date(event.start).toLocaleTimeString('en-US', { 
                                  hour: 'numeric', 
                                  minute: '2-digit',
                                  hour12: true 
                                })} - {new Date(event.end).toLocaleTimeString('en-US', { 
                                  hour: 'numeric', 
                                  minute: '2-digit',
                                  hour12: true 
                                })}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-500 text-xs py-2">Available</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {events.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <div className="mb-4 flex justify-center">
                <SchedulerIconSmall />
              </div>
              <h4 className="text-lg font-medium text-white mb-2">No events today</h4>
              <p className="text-sm">Your day is completely free!</p>
            </div>
          )}
        </div>
        
        {events.length > 0 && (
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="font-medium text-white mb-3">Day Summary</h4>
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div className="bg-red-500/20 rounded-lg p-3">
                <div className="text-red-300 font-medium">Deadlines</div>
                <div className="text-xl font-bold text-white">
                  {events.filter(e => e.type === 'deadline').length}
                </div>
              </div>
              <div className="bg-blue-500/20 rounded-lg p-3">
                <div className="text-blue-300 font-medium">Tasks</div>
                <div className="text-xl font-bold text-white">
                  {events.filter(e => e.type === 'task').length}
                </div>
              </div>
              <div className="bg-purple-500/20 rounded-lg p-3">
                <div className="text-purple-300 font-medium">Meetings</div>
                <div className="text-xl font-bold text-white">
                  {events.filter(e => e.type === 'meeting').length}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCalendarView = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <SchedulerIcon />
            Calendar
          </h2>
          
          <div className="flex items-center gap-2">
            <div className="bg-white/10 rounded-lg p-1 flex">
              {[
                { key: 'monthly', label: 'Month' },
                { key: 'weekly', label: 'Week' },
                { key: 'daily', label: 'Day' }
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
                  {view.label}
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
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>
          
          <button
            onClick={goToToday}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            Today
          </button>
          
          <button 
            onClick={() => navigateDate('next')}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
          >
            Next
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {calendarView === 'monthly' && renderMonthlyView()}
        {calendarView === 'weekly' && renderWeeklyView()}
        {calendarView === 'daily' && renderDailyView()}
      </div>
    );
  };

  // Render enhanced task list with sorting
  const renderEnhancedTaskList = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-300">Sort by:</span>
            <select
              value={taskSort}
              onChange={(e) => setTaskSort(e.target.value as TaskSortOption)}
              className="px-3 py-1 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 text-sm"
            >
              <option value="priority">Priority</option>
              <option value="deadline">Deadline</option>
              <option value="created">Created Date</option>
              <option value="type">Type</option>
            </select>
          </div>
        </div>

        {filteredTasks.map(task => (
          <div key={task.id} className="bg-white/5 border border-white/10 rounded-lg p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-2">
                  <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ${
                    task.priority === 'high' ? 'bg-red-500/20 text-red-300' :
                    task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                    'bg-green-500/20 text-green-300'
                  }`}>
                    {task.priority || 'Unknown'}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ${
                    task.task_type === 'creative' ? 'bg-purple-500/20 text-purple-300' :
                    'bg-blue-500/20 text-blue-300'
                  }`}>
                    {task.task_type || 'Unknown'}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ${
                    task.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                    task.status === 'in_progress' ? 'bg-blue-500/20 text-blue-300' :
                    'bg-gray-500/20 text-gray-300'
                  }`}>
                    {task.status ? task.status.replace('_', ' ') : 'Unknown'}
                  </span>
                </div>
                <h3 className="font-medium text-white mb-1 break-words pr-2">{task.title}</h3>
                {task.description && (
                  <p className="text-sm text-gray-300 mb-2 break-words pr-2">{task.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-400">
                  {task.deadline && (
                    <span className="whitespace-nowrap">Due: {new Date(task.deadline).toLocaleDateString()}</span>
                  )}
                  {task.estimated_hours && (
                    <span className="whitespace-nowrap flex items-center gap-1">
                      <HiClock className="w-3 h-3" />
                      {task.estimated_hours}h estimated
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleDeleteTask(task)}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors mobile-tap-target"
                  title="Delete task"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderSuggestionsView = () => {
    const safeAiSuggestions = Array.isArray(aiSuggestions) ? aiSuggestions : [];
    const actionableSuggestions = safeAiSuggestions.filter(s => s.type === 'task');
    const insights = safeAiSuggestions.filter(s => s.type === 'optimization' || s.type === 'calendar_block');

    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <AIIcon />
            AI Task Suggestions
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
              <span className="flex items-center gap-2">
                <HiSparkles className="w-5 h-5" />
                Analyze & Suggest
              </span>
            )}
          </button>
        </div>

        {(actionableSuggestions.length > 0 || insights.length > 0) ? (
          <div className="space-y-8">
            {actionableSuggestions.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <HiPencilSquare className="w-6 h-6 text-blue-400" />
                  <h3 className="text-xl font-bold text-white">Suggested Tasks</h3>
                  <span className="text-sm text-gray-400">({actionableSuggestions.length} actionable items)</span>
                </div>
                <div className="space-y-4">
                  {actionableSuggestions.map((suggestion, index) => (
                    <div key={`task-${suggestion.id}-${index}`} className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-300">
                              task
                            </span>
                            {suggestion.estimatedHours && (
                              <span className="flex items-center gap-1 text-xs text-gray-400">
                                <HiClock className="w-3 h-3" />
                                {suggestion.estimatedHours}h
                              </span>
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
                            <p className="text-xs text-blue-300 mt-1">Suggested for: {new Date(suggestion.suggestedDate).toLocaleDateString()}</p>
                          )}
                        </div>
                        <div className="ml-4 flex gap-2">
                          <button
                            onClick={() => setEditingSuggestion(suggestion)}
                            className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => addTaskFromSuggestion(suggestion)}
                            className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50"
                            disabled={isCreatingTask}
                          >
                            {isCreatingTask ? 'Adding...' : 'Add Task'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {insights.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <HiLightBulb className="w-6 h-6 text-yellow-400" />
                  <h3 className="text-xl font-bold text-white">AI Insights</h3>
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
                        <div className={`ml-4 px-3 py-1 text-sm rounded flex items-center gap-1 ${
                          insight.type === 'optimization'
                            ? 'bg-purple-600/20 text-purple-300'
                            : 'bg-green-600/20 text-green-300'
                        }`}>
                          <HiCog6Tooth className="w-4 h-4" />
                          {insight.type === 'optimization' ? 'Consider This' : 'Manual Schedule'}
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
                {isGeneratingSuggestions ? 'Generating...' : 'Generate New Suggestions'}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <div className="mb-4 flex justify-center">
              <AIIcon />
            </div>
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

  const stats = getTaskStats();

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-gray-900 to-black relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-transparent to-pink-900/20"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Notification */}
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mb-6 px-4 py-3 rounded-lg text-sm max-w-md mx-auto flex items-center justify-between ${
              notification.type === 'success' 
                ? 'bg-green-900/50 border border-green-500/50 text-green-200'
                : notification.type === 'error'
                ? 'bg-red-900/50 border border-red-500/50 text-red-200'
                : 'bg-blue-900/50 border border-blue-500/50 text-blue-200'
            }`}
          >
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className={`ml-2 hover:opacity-70 ${
                notification.type === 'success' ? 'text-green-400' :
                notification.type === 'error' ? 'text-red-400' : 'text-blue-400'
              }`}
            >
              ×
            </button>
          </motion.div>
        )}

        {/* Header */}
        <div className="bg-gradient-to-br from-slate-800/50 to-gray-900/50 border border-purple-500/20 backdrop-blur-sm rounded-xl p-6 mb-6 text-center">
          <h1 className="text-4xl font-bold mb-2 flex items-center justify-center leading-relaxed">
            <AIIcon />
            <span className="ml-3 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent leading-relaxed py-1">
              AI Weekly Planner
            </span>
          </h1>
          <p className="text-gray-300">Balance creative and admin work with AI-powered scheduling</p>
          
          {/* Navigation Tabs */}
          <div className="flex justify-center mt-6">
            <div className="bg-gradient-to-br from-slate-800/50 to-gray-900/50 border border-purple-500/20 backdrop-blur-sm rounded-lg p-1 flex">
              {[
                { key: 'overview', label: 'Overview' },
                { key: 'calendar', label: 'Calendar' },
                { key: 'suggestions', label: 'AI Suggestions' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'bg-white text-gray-900'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
            <div 
              onClick={() => handleStatClick('all')}
              className={`bg-gradient-to-br from-slate-800/50 to-gray-900/50 border border-purple-500/20 backdrop-blur-sm rounded-xl p-4 cursor-pointer transition-all hover:scale-105 hover:border-purple-400/40 ${
                expandedStats === 'all' ? 'border-purple-400/50 shadow-lg shadow-purple-500/20' : ''
              }`}
            >
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-sm text-gray-300">Total Tasks</div>
            </div>
            <div 
              onClick={() => handleStatClick('pending')}
              className={`bg-gradient-to-br from-yellow-800/30 to-orange-900/30 border border-yellow-500/20 backdrop-blur-sm rounded-xl p-4 cursor-pointer transition-all hover:scale-105 hover:border-yellow-400/40 ${
                expandedStats === 'pending' ? 'border-yellow-400/50 shadow-lg shadow-yellow-500/20' : ''
              }`}
            >
              <div className="text-2xl font-bold text-yellow-300">{stats.pending}</div>
              <div className="text-sm text-gray-300">Pending</div>
            </div>
            <div 
              onClick={() => handleStatClick('in_progress')}
              className={`bg-gradient-to-br from-blue-800/30 to-cyan-900/30 border border-blue-500/20 backdrop-blur-sm rounded-xl p-4 cursor-pointer transition-all hover:scale-105 hover:border-blue-400/40 ${
                expandedStats === 'in_progress' ? 'border-blue-400/50 shadow-lg shadow-blue-500/20' : ''
              }`}
            >
              <div className="text-2xl font-bold text-blue-300">{stats.inProgress}</div>
              <div className="text-sm text-gray-300">In Progress</div>
            </div>
            <div 
              onClick={() => handleStatClick('creative')}
              className={`bg-gradient-to-br from-purple-800/30 to-pink-900/30 border border-purple-500/20 backdrop-blur-sm rounded-xl p-4 cursor-pointer transition-all hover:scale-105 hover:border-purple-400/40 ${
                expandedStats === 'creative' ? 'border-purple-400/50 shadow-lg shadow-purple-500/20' : ''
              }`}
            >
              <div className="text-2xl font-bold text-purple-300">{stats.creative}</div>
              <div className="text-sm text-gray-300">Creative</div>
            </div>
            <div 
              onClick={() => handleStatClick('admin')}
              className={`bg-gradient-to-br from-emerald-800/30 to-green-900/30 border border-emerald-500/20 backdrop-blur-sm rounded-xl p-4 cursor-pointer transition-all hover:scale-105 hover:border-emerald-400/40 ${
                expandedStats === 'admin' ? 'border-emerald-400/50 shadow-lg shadow-emerald-500/20' : ''
              }`}
            >
              <div className="text-2xl font-bold text-emerald-300">{stats.admin}</div>
              <div className="text-sm text-gray-300">Admin</div>
            </div>
          </div>
          
          {/* Expanded Stats Section */}
          {expandedStats && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-white">
                  {expandedStats === 'all' ? 'All Tasks' : 
                   expandedStats === 'pending' ? 'Pending Tasks' :
                   expandedStats === 'in_progress' ? 'In Progress Tasks' :
                   expandedStats === 'creative' ? 'Creative Tasks' :
                   'Admin Tasks'} ({filteredTasks.length})
                </h3>
                <button
                  onClick={() => setExpandedStats(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {filteredTasks.slice(0, 5).map(task => (
                  <div key={task.id} className="flex items-center justify-between p-2 bg-white/5 rounded">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">{task.title}</div>
                      <div className="text-xs text-gray-400">
                        {task.priority} priority • {task.task_type}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedTask(task);
                        setShowTaskDetails(true);
                      }}
                      className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                    >
                      View
                    </button>
                  </div>
                ))}
                {filteredTasks.length > 5 && (
                  <div className="text-xs text-gray-400 text-center py-2">
                    And {filteredTasks.length - 5} more...
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* Modals */}
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

        {/* Edit Suggestion Modal */}
        {editingSuggestion && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <TaskForm
                onSubmit={(taskData) => {
                  const updatedSuggestion = {
                    ...editingSuggestion,
                    title: taskData.title,
                    description: taskData.description,
                    priority: taskData.priority,
                    task_type: taskData.task_type,
                    suggestedDate: taskData.deadline,
                    estimatedHours: taskData.estimated_hours
                  };
                  addTaskFromSuggestion(updatedSuggestion);
                  setEditingSuggestion(null);
                }}
                onCancel={() => setEditingSuggestion(null)}
                isLoading={isCreatingTask}
                initialData={{
                  title: editingSuggestion.title,
                  description: editingSuggestion.description,
                  priority: editingSuggestion.priority || 'medium',
                  task_type: editingSuggestion.task_type || 'admin',
                  deadline: editingSuggestion.suggestedDate || '',
                  estimated_hours: editingSuggestion.estimatedHours || 1
                }}
              />
            </div>
          </div>
        )}

        {/* Task Details Modal */}
        {selectedTask && showTaskDetails && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Task Details</h3>
                <button
                  onClick={() => {
                    setShowTaskDetails(false);
                    setSelectedTask(null);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-white mb-1">{selectedTask.title}</h4>
                  {selectedTask.description && (
                    <p className="text-sm text-gray-300">{selectedTask.description}</p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <span className={`text-xs px-2 py-1 rounded ${
                    selectedTask.priority === 'high' ? 'bg-red-500/20 text-red-300' :
                    selectedTask.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                    'bg-green-500/20 text-green-300'
                  }`}>
                    {selectedTask.priority || 'Unknown'} priority
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    selectedTask.task_type === 'creative' ? 'bg-purple-500/20 text-purple-300' :
                    'bg-blue-500/20 text-blue-300'
                  }`}>
                    {selectedTask.task_type || 'Unknown'}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    selectedTask.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                    selectedTask.status === 'in_progress' ? 'bg-blue-500/20 text-blue-300' :
                    'bg-gray-500/20 text-gray-300'
                  }`}>
                    {selectedTask.status ? selectedTask.status.replace('_', ' ') : 'Unknown'}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm text-gray-400">
                  {selectedTask.deadline && (
                    <div>Deadline: {new Date(selectedTask.deadline).toLocaleDateString()}</div>
                  )}
                  {selectedTask.estimated_hours && (
                    <div className="flex items-center gap-1">
                      <HiClock className="w-4 h-4" />
                      Estimated time: {selectedTask.estimated_hours} hours
                    </div>
                  )}
                  {selectedTask.created_at && (
                    <div>Created: {new Date(selectedTask.created_at).toLocaleDateString()}</div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowTaskDetails(false);
                    setSelectedTask(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleDeleteTask(selectedTask);
                    setShowTaskDetails(false);
                    setSelectedTask(null);
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Task Confirmation */}
        {taskToDelete && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <div className="flex items-center gap-3 mb-4">
                <HiExclamationTriangle className="w-6 h-6 text-red-400" />
                <h3 className="text-lg font-bold text-white">Delete Task</h3>
              </div>
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

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex flex-wrap gap-4 justify-end">
                <button
                  onClick={generateAISchedule}
                  disabled={isGeneratingSchedule || tasks.length === 0}
                  className="flex-1 sm:flex-none bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isGeneratingSchedule ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <span className="flex items-center gap-2">
                      <AIIconSmall />
                      Generate AI Schedule
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setShowTaskForm(true)}
                  className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add New Task
                </button>
              </div>

              <div className="bg-gradient-to-br from-slate-800/50 to-gray-900/50 border border-purple-500/20 backdrop-blur-sm rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <HiDocumentText className="w-8 h-8 text-blue-400" />
                    Your Tasks
                  </h2>
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
                          Showing: {taskFilter ? taskFilter.replace('_', ' ') : 'all'} ({filteredTasks.length})
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
                    <div className="mb-4">
                      <HiMagnifyingGlass className="w-16 h-16 mx-auto text-gray-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">No {taskFilter ? taskFilter.replace('_', ' ') : 'filtered'} tasks</h3>
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
                    <div className="mb-4">
                      <HiPencilSquare className="w-16 h-16 mx-auto text-gray-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">No tasks yet</h3>
                    <p className="text-gray-300 mb-6">Create your first task to get started with AI scheduling!</p>
                    <button
                      onClick={() => setShowTaskForm(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      Add Your First Task
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gradient-to-br from-slate-800/50 to-gray-900/50 border border-purple-500/20 backdrop-blur-sm rounded-xl p-6">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <HiDocumentText className="w-8 h-8 text-blue-400" />
                  Your Weekly Schedule
                </h2>
                
                {weeklySchedule ? (
                  <div className="space-y-4">
                    <div className="text-green-300 font-medium flex items-center gap-2">
                      <HiSparkles className="w-5 h-5" />
                      Schedule Generated!
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
                        <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                          <HiLightBulb className="w-4 h-4 text-yellow-400" />
                          AI Suggestions:
                        </h4>
                        <p className="text-gray-300 text-sm">{weeklySchedule.aiSuggestions}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="mb-4 flex justify-center">
                      <AIIcon />
                    </div>
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

              <div className="bg-gradient-to-br from-slate-800/50 to-gray-900/50 border border-purple-500/20 backdrop-blur-sm rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <HiLightBulb className="w-5 h-5 text-yellow-400" />
                  Pro Tips
                </h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 mt-0.5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Mix creative and admin tasks for better balance
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 mt-0.5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Set realistic deadlines for better AI scheduling
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 mt-0.5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Use estimated hours to help AI plan your week
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 mt-0.5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    High priority tasks get scheduled first
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 mt-0.5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Check the Calendar tab to see your week layout
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 mt-0.5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Use AI Suggestions to optimize your workflow
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="bg-gradient-to-br from-slate-800/50 to-gray-900/50 border border-purple-500/20 backdrop-blur-sm rounded-xl p-6">
            {renderCalendarView()}
          </div>
        )}

        {activeTab === 'suggestions' && (
          <div className="bg-gradient-to-br from-slate-800/50 to-gray-900/50 border border-purple-500/20 backdrop-blur-sm rounded-xl p-6">
            {renderSuggestionsView()}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIWeeklyPlanner;