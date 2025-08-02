// Task-related types for the frontend
export interface Task {
  id: number;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  task_type: 'creative' | 'admin';
  status: 'pending' | 'in_progress' | 'completed';
  deadline: string; // ISO date string
  estimated_hours?: number;
  user_id: number;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

export interface TaskFormData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  task_type: 'creative' | 'admin';
  deadline: string;
  estimated_hours: number | '';
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  task_type: 'creative' | 'admin';
  deadline: string;
  estimated_hours?: number;
}

export interface UpdateTaskRequest extends Partial<CreateTaskRequest> {
  status?: 'pending' | 'in_progress' | 'completed';
}

export interface TaskFilters {
  status?: 'all' | 'pending' | 'in_progress' | 'completed';
  priority?: 'all' | 'low' | 'medium' | 'high';
  task_type?: 'all' | 'creative' | 'admin';
  search?: string;
}

export interface TaskStats {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  overdue: number;
  creative: number;
  admin: number;
}

// API Response types
export interface TaskResponse {
  tasks: Task[];
  total: number;
}

export interface ApiError {
  error: string;
  message?: string;
}