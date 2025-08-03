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

const AIWeeklyPlanner: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isGeneratingSchedule, setIsGeneratingSchedule] = useState(false);
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);

  // Load tasks on component mount
  useEffect(() => {
    loadTasks();
  }, []);

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
        
        // Show success message
        alert('Task created successfully! 🎉');
      } else {
        const error = await response.json();
        alert(`Failed to create task: ${error.message || error.error}`);
      }
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task. Please try again.');
    } finally {
      setIsCreatingTask(false);
    }
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

  const getTaskStats = () => {
    const pending = tasks.filter(t => t.status === 'pending').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const creative = tasks.filter(t => t.task_type === 'creative').length;
    const admin = tasks.filter(t => t.task_type === 'admin').length;
    
    return { pending, inProgress, completed, creative, admin, total: tasks.length };
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

        {/* Main Content */}
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
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIWeeklyPlanner;