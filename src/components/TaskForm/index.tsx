import React from 'react';
import { Task } from '../../services/db';

interface TaskFormProps {
  initialValues?: Partial<Task>;
  onSubmit: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => void;
  onCancel: () => void;
}

const QuadrantOptions = [
  { value: 1, label: '重要且紧急', color: 'bg-red-50 text-red-700 border-red-200' },
  { value: 2, label: '重要不紧急', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 3, label: '不重要但紧急', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 4, label: '不重要不紧急', color: 'bg-gray-50 text-gray-700 border-gray-200' }
];

export const TaskForm: React.FC<TaskFormProps> = ({
  initialValues,
  onSubmit,
  onCancel
}) => {
  const [title, setTitle] = React.useState(initialValues?.title || '');
  const [description, setDescription] = React.useState(initialValues?.description || '');
  const [quadrant, setQuadrant] = React.useState<1 | 2 | 3 | 4>(initialValues?.quadrant || 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      description,
      quadrant,
      date: new Date().toISOString().split('T')[0],
      completed: false,
      userId: 'test-user'
    });
  };

  return (
    <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-auto p-6">
      {/* 关闭按钮 */}
      <button
        onClick={onCancel}
        className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* 标题 */}
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {initialValues ? '编辑任务' : '新增任务'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 任务标题输入 */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            任务标题
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
            placeholder="输入任务标题..."
          />
        </div>

        {/* 任务描述输入 */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            任务描述
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none"
            rows={3}
            placeholder="输入任务描述..."
          />
        </div>

        {/* 象限选择 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            选择象限
          </label>
          <div className="grid grid-cols-2 gap-3">
            {QuadrantOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setQuadrant(option.value as 1 | 2 | 3 | 4)}
                className={`
                  p-3 rounded-lg border transition-all text-sm
                  ${option.color}
                  ${quadrant === option.value 
                    ? 'ring-2 ring-offset-2 ring-blue-500 border-transparent' 
                    : 'hover:bg-opacity-70'
                  }
                `}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            {initialValues ? '保存' : '创建'}
          </button>
        </div>
      </form>
    </div>
  );
}; 