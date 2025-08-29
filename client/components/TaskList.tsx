import React from 'react';
import { Task } from '../types/task';

interface TaskListProps {
  tasks: Task[];
  onTaskUpdate: () => void;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, onTaskUpdate }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'creative' ? '🎨' : '📋';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isOverdue = (deadline: string) => {
    return new Date(deadline) < new Date();
  };

  // DEBUG: Log tasks to see what we're getting
  console.log('TaskList received tasks:', tasks);

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-800">
        <div className="text-4xl mb-2">📝</div>
        <p className="text-black font-medium">No tasks found</p>
        <p className="text-black mt-2">Create your first task to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200 hover:border-gray-300 transition-all shadow-sm hover:shadow-md"
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <span className="text-lg flex-shrink-0">{getTypeIcon(task.task_type)}</span>
              <h3 className="font-semibold text-black text-lg break-words">{task.title}</h3>
            </div>
            <div className="flex flex-wrap gap-1 sm:gap-2 flex-shrink-0">
              <span className={`px-2 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${getStatusColor(task.status)}`}>
                {task.status.replace('_', ' ')}
              </span>
            </div>
          </div>

          {task.description && (
            <p className="text-black text-sm mb-3 break-words">{task.description}</p>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-black">
                <span className={`whitespace-nowrap ${isOverdue(task.deadline) ? 'text-red-600 font-semibold' : 'text-black'}`}>
                📅 {formatDate(task.deadline)}
                {isOverdue(task.deadline) && ' (Overdue!)'}
              </span>
              {task.estimated_hours && (
                <span className="whitespace-nowrap">⏱️ {task.estimated_hours}h</span>
              )}
            </div>
            <div className="text-xs text-gray-400 whitespace-nowrap">
              Created {formatDate(task.created_at)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TaskList;