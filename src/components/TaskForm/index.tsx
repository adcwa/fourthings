import React from 'react';
import { Task, SubTask } from '../../services/db';

interface TaskFormProps {
  initialValues?: Partial<Task>;
  onSubmit: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order' | 'version'>) => void;
  onCancel: () => void;
}

const QuadrantOptions = [
  { value: 1, label: '重要且紧急', color: 'bg-red-50 text-red-700 border-red-200' },
  { value: 2, label: '重要不紧急', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 3, label: '不重要但紧急', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 4, label: '不重要不紧急', color: 'bg-gray-50 text-gray-700 border-gray-200' }
];

const StatusOptions = [
  { value: 'todo', label: '待办', icon: '📝' },
  { value: 'in_progress', label: '进行中', icon: '⚡' },
  { value: 'blocked', label: '已阻塞', icon: '🚫' },
  { value: 'cancelled', label: '已取消', icon: '✖️' }
];

const PriorityOptions = [
  { value: 'high', label: '高优先级', color: 'text-red-600' },
  { value: 'medium', label: '中优先级', color: 'text-blue-600' },
  { value: 'low', label: '低优先级', color: 'text-gray-500' }
];

export const TaskForm: React.FC<TaskFormProps> = ({
  initialValues,
  onSubmit,
  onCancel
}) => {
  const [title, setTitle] = React.useState(initialValues?.title || '');
  const [description, setDescription] = React.useState(initialValues?.description || '');
  const [quadrant, setQuadrant] = React.useState<1 | 2 | 3 | 4>(initialValues?.quadrant || 1);
  const [status, setStatus] = React.useState(initialValues?.status || 'todo');
  const [priority, setPriority] = React.useState(initialValues?.priority || 'medium');
  const [dueDate, setDueDate] = React.useState(initialValues?.dueDate || '');
  const [tags, setTags] = React.useState(initialValues?.tags?.join(', ') || '');
  const [subtasks, setSubtasks] = React.useState<SubTask[]>(initialValues?.subtasks || []);
  const [newSubtask, setNewSubtask] = React.useState('');
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Calculate progress based on subtasks
    const progress = subtasks.length > 0
      ? Math.round((subtasks.filter(s => s.completed).length / subtasks.length) * 100)
      : (status === 'todo' ? 0 : status === 'in_progress' ? 50 : 0);

    onSubmit({
      title,
      description,
      quadrant,
      date: initialValues?.date || new Date().toISOString().split('T')[0],
      completed: initialValues?.completed || false,
      userId: initialValues?.userId || 'test-user',
      status: status as any,
      priority: priority as any,
      dueDate,
      tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
      subtasks,
      progress
    });
  };

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    setSubtasks([...subtasks, { id: crypto.randomUUID(), title: newSubtask.trim(), completed: false }]);
    setNewSubtask('');
  };

  const toggleSubtask = (id: string) => {
    setSubtasks(subtasks.map(s => s.id === id ? { ...s, completed: !s.completed } : s));
  };

  const removeSubtask = (id: string) => {
    setSubtasks(subtasks.filter(s => s.id !== id));
  };

  return (
    <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full mx-auto p-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
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
        {/* 主要信息 */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">任务名称</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="做什么？"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">补充描述 (可选)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              rows={2}
              placeholder="详细描述一下..."
            />
          </div>
        </div>

        {/* 核心设置：象限与状态 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">所属象限</label>
            <div className="space-y-2">
              {QuadrantOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setQuadrant(opt.value as 1 | 2 | 3 | 4)}
                  className={`w-full text-left px-3 py-2 rounded-lg border text-xs transition-all ${quadrant === opt.value ? 'ring-2 ring-blue-500 border-transparent shadow-sm' : 'border-gray-100 hover:bg-gray-50'
                    } ${opt.color}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">执行状态</label>
            <div className="grid grid-cols-2 gap-2">
              {StatusOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(opt.value as any)}
                  className={`px-3 py-2 rounded-lg border text-xs flex items-center justify-center gap-1 transition-all ${status === opt.value ? 'bg-blue-500 text-white border-transparent' : 'bg-white text-gray-600 border-gray-100 hover:bg-gray-50'
                    }`}
                >
                  <span>{opt.icon}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 子任务板块 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">子任务清单</label>
          <div className="space-y-2 mb-3">
            {subtasks.map((st) => (
              <div key={st.id} className="flex items-center gap-2 group">
                <input
                  type="checkbox"
                  checked={st.completed}
                  onChange={() => toggleSubtask(st.id)}
                  className="w-4 h-4 text-blue-500 rounded focus:ring-blue-400"
                />
                <span className={`flex-1 text-sm ${st.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                  {st.title}
                </span>
                <button
                  type="button"
                  onClick={() => removeSubtask(st.id)}
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
              className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 outline-none"
              placeholder="添加步骤..."
            />
            <button
              type="button"
              onClick={addSubtask}
              className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition-colors"
            >
              添加
            </button>
          </div>
        </div>

        {/* 高级选项切换 */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-blue-500 hover:underline flex items-center gap-1"
        >
          {showAdvanced ? '隐藏高级选项' : '显示更多选项 (时间、标签、优先级...)'}
        </button>

        {showAdvanced && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1 text-xs">截止时间</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-sm outline-none bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1 text-xs">紧急程度</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-sm outline-none bg-white"
                >
                  {PriorityOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1 text-xs">标签 (逗号分隔)</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-sm outline-none bg-white"
                placeholder="工作, 个人, 创意..."
              />
            </div>
          </div>
        )}

        {/* 底部按钮 */}
        <div className="flex gap-3 pt-4 border-t border-gray-50">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100 font-medium"
          >
            {initialValues ? '确认更新' : '立即创建'}
          </button>
        </div>
      </form>
    </div>
  );
}; 