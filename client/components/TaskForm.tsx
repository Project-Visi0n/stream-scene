import React, { useState } from 'react';

const StreamSceneTodoList = () => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    type: 'creative', 
    priority: 'medium',
    deadline: '',
    estimatedHours: 1
  });
  const [showForm, setShowForm] = useState(false);

  const addTask = () => {
    if (!newTask.title.trim()) return;

    const task = {
      id: Date.now(),
      ...newTask,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    setTasks([...tasks, task]);
    setNewTask({
      title: '',
      description: '',
      type: 'creative',
      priority: 'medium',
      deadline: '',
      estimatedHours: 1
    });
    setShowForm(false);
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(task => 
      task.id === id 
        ? { ...task, status: task.status === 'completed' ? 'pending' : 'completed' }
        : task
    ));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-400 border-red-400';
      case 'medium': return 'text-yellow-400 border-yellow-400';
      case 'low': return 'text-green-400 border-green-400';
      default: return 'text-gray-400 border-gray-400';
    }
  };

  const getTypeColor = (type) => {
    return type === 'creative' ? 'bg-purple-900/30 text-purple-300' : 'bg-blue-900/30 text-blue-300';
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-900 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">StreamScene Tasks</h1>
        <p className="text-gray-400">Manage your creative and admin work</p>
      </div>

      {/* Add Task Button */}
      <div className="mb-8">
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors border border-gray-700"
        >
          <span className={`text-xl transition-transform ${showForm ? 'rotate-45' : ''}`}>+</span>
          {showForm ? 'Close Form' : 'Add New Task'}
        </button>
      </div>

      {/* Task Form */}
      {showForm && (
        <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Task Title
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-purple-500"
                  placeholder="Enter task title..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Type
                </label>
                <select
                  value={newTask.type}
                  onChange={(e) => setNewTask({...newTask, type: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-purple-500"
                >
                  <option value="creative">Creative Work</option>
                  <option value="admin">Admin Work</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={newTask.description}
                onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                className="w-full bg-gray-900 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-purple-500 h-20 resize-none"
                placeholder="Task description (optional)..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Priority
                </label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-purple-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Deadline
                </label>
                <input
                  type="date"
                  value={newTask.deadline}
                  onChange={(e) => setNewTask({...newTask, deadline: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Estimated Hours
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={newTask.estimatedHours}
                  onChange={(e) => setNewTask({...newTask, estimatedHours: parseFloat(e.target.value)})}
                  className="w-full bg-gray-900 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={addTask}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Add Task
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task List */}
      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4 opacity-50">⏰</div>
            <p>No tasks yet. Add your first task to get started!</p>
          </div>
        ) : (
          tasks.map(task => (
            <div
              key={task.id}
              className={`bg-gray-800 rounded-lg p-4 border border-gray-700 transition-all ${
                task.status === 'completed' ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <button
                      onClick={() => toggleTask(task.id)}
                      className={`flex items-center justify-center w-6 h-6 rounded border-2 transition-colors ${
                        task.status === 'completed'
                          ? 'bg-green-600 border-green-600 text-white'
                          : 'border-gray-500 hover:border-green-500'
                      }`}
                    >
                      {task.status === 'completed' && <span className="text-sm">✓</span>}
                    </button>
                    
                    <h3 className={`text-lg font-medium ${
                      task.status === 'completed' ? 'line-through text-gray-500' : 'text-white'
                    }`}>
                      {task.title}
                    </h3>
                  </div>

                  {task.description && (
                    <p className="text-gray-400 mb-3 ml-9">{task.description}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 ml-9">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(task.type)}`}>
                      {task.type === 'creative' ? 'Creative' : 'Admin'}
                    </span>
                    
                    <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs border ${getPriorityColor(task.priority)}`}>
                      <span className="text-xs">🚩</span>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </span>

                    {task.deadline && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <span>⏰</span>
                        {new Date(task.deadline).toLocaleDateString()}
                      </span>
                    )}

                    <span className="text-xs text-gray-400">
                      {task.estimatedHours}h estimated
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => deleteTask(task.id)}
                  className="text-gray-500 hover:text-red-400 transition-colors p-1 text-lg"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Stats */}
      {tasks.length > 0 && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800 rounded-lg p-4 text-center border border-gray-700">
            <div className="text-2xl font-bold text-white">
              {tasks.filter(t => t.status === 'pending').length}
            </div>
            <div className="text-gray-400 text-sm">Pending Tasks</div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4 text-center border border-gray-700">
            <div className="text-2xl font-bold text-green-400">
              {tasks.filter(t => t.status === 'completed').length}
            </div>
            <div className="text-gray-400 text-sm">Completed</div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4 text-center border border-gray-700">
            <div className="text-2xl font-bold text-purple-400">
              {tasks.reduce((acc, task) => acc + task.estimatedHours, 0)}h
            </div>
            <div className="text-gray-400 text-sm">Total Hours</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StreamSceneTodoList;