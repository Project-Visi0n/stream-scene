import React from 'react';
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
declare const TaskForm: React.FC<TaskFormProps>;
export default TaskForm;
//# sourceMappingURL=TaskForm.d.ts.map