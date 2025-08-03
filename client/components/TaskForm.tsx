import React, { useState } from 'react';

interface TaskFormData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  task_type: 'creative' | 'admin';
  deadline: string;
  estimated_hours: number | '';
}

interface TaskFormProps {
  onSubmit: (taskData: TaskFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

const TaskForm: React.FC<TaskFormProps> = ({ onSubmit, onCancel, isLoading = false }) => {
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    priority: 'medium',
    task_type: 'creative',
    deadline: '',
    estimated_hours: ''
  });

  const [errors, setErrors] = useState<Partial<TaskFormData>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'estimated_hours' ? (value === '' ? '' : parseInt(value)) : value
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof TaskFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<TaskFormData> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.deadline) {
      newErrors.deadline = 'Deadline is required';
    } else {
      const deadlineDate = new Date(formData.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (deadlineDate < today) {
        newErrors.deadline = 'Deadline cannot be in the past';
      }
    }

    if (formData.estimated_hours !== '' && (formData.estimated_hours < 1 || formData.estimated_hours > 168)) {
      newErrors.estimated_hours = 'Hours must be between 1 and 168' as any;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      task_type: 'creative',
      deadline: '',
      estimated_hours: ''
    });
    setErrors({});
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTaskTypeColor = (type: string) => {
    switch (type) {
      case 'creative': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'admin': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-black mb-2">Create New Task</h2>
        <p className="text-black">Add a new task to your project schedule</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-black mb-2">
            Task Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white ${
              errors.title ? 'border-red-300' : 'border-gray-300'
            }`}
            style={{ backgroundColor: 'white', color: 'black' }}
            placeholder="Enter task title..."
            disabled={isLoading}
          />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-black mb-2">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
            style={{ backgroundColor: 'white', color: 'black' }}
            placeholder="Describe the task details..."
            disabled={isLoading}
          />
        </div>

        {/* Priority and Task Type Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Priority */}
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-black mb-2">
              Priority *
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white ${getPriorityColor(formData.priority)}`}
              style={{ backgroundColor: 'white', color: 'black' }}
              disabled={isLoading}
            >
              <option value="low">🟢 Low Priority</option>
              <option value="medium">🟡 Medium Priority</option>
              <option value="high">🔴 High Priority</option>
            </select>
          </div>

          {/* Task Type */}
          <div>
            <label htmlFor="task_type" className="block text-sm font-medium text-black mb-2">
              Task Type *
            </label>
            <select
              id="task_type"
              name="task_type"
              value={formData.task_type}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white ${getTaskTypeColor(formData.task_type)}`}
              style={{ backgroundColor: 'white', color: 'black' }}
              disabled={isLoading}
            >
              <option value="creative">🎨 Creative Work</option>
              <option value="admin">📋 Admin Work</option>
            </select>
          </div>
        </div>

        {/* Deadline and Estimated Hours Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Deadline */}
          <div>
            <label htmlFor="deadline" className="block text-sm font-medium text-black mb-2">
              Deadline *
            </label>
            <input
              type="datetime-local"
              id="deadline"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white ${
                errors.deadline ? 'border-red-300' : 'border-gray-300'
              }`}
              style={{ backgroundColor: 'white', color: 'black' }}
              disabled={isLoading}
            />
            {errors.deadline && <p className="mt-1 text-sm text-red-600">{errors.deadline}</p>}
          </div>

          {/* Estimated Hours */}
          <div>
            <label htmlFor="estimated_hours" className="block text-sm font-medium text-black mb-2">
              Estimated Hours
            </label>
            <input
              type="number"
              id="estimated_hours"
              name="estimated_hours"
              value={formData.estimated_hours}
              onChange={handleChange}
              min="1"
              max="168"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white ${
                errors.estimated_hours ? 'border-red-300' : 'border-gray-300'
              }`}
              style={{ backgroundColor: 'white', color: 'black' }}
              placeholder="Hours needed"
              disabled={isLoading}
            />
            {errors.estimated_hours && <p className="mt-1 text-sm text-red-600">{errors.estimated_hours}</p>}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Task...
              </span>
            ) : (
              '✅ Create Task'
            )}
          </button>

          <button
            type="button"
            onClick={resetForm}
            disabled={isLoading}
            className="flex-1 sm:flex-none bg-gray-300 text-black py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            🔄 Reset
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 sm:flex-none bg-red-300 text-black py-2 px-4 rounded-md hover:bg-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ❌ Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default TaskForm;