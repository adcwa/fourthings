import React, { useState } from 'react';
import { Task } from '../../services/db';

interface TaskFormProps {
  onSubmit: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  initialValues?: Partial<Task>;
  onCancel?: () => void;
}

export const TaskForm: React.FC<TaskFormProps> = ({ onSubmit, initialValues, onCancel }) => {
  const [title, setTitle] = useState(initialValues?.title || '');
  const [description, setDescription] = useState(initialValues?.description || '');
  const [quadrant, setQuadrant] = useState<1 | 2 | 3 | 4>(initialValues?.quadrant || 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      title,
      description,
      quadrant,
      date: new Date().toISOString().split('T')[0],
      completed: false,
      userId: 'test-user' // 临时使用固定用户ID
    });
    setTitle('');
    setDescription('');
    setQuadrant(1);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white rounded-lg shadow">
      <div>
        <label className="block text-sm font-medium text-gray-700">标题</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">描述</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">象限</label>
        <select
          value={quadrant}
          onChange={(e) => setQuadrant(Number(e.target.value) as 1 | 2 | 3 | 4)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
        >
          <option value={1}>重要且紧急</option>
          <option value={2}>重要不紧急</option>
          <option value={3}>不重要但紧急</option>
          <option value={4}>不重要不紧急</option>
        </select>
      </div>

      <div className="flex justify-end space-x-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            取消
          </button>
        )}
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
        >
          保存
        </button>
      </div>
    </form>
  );
}; 