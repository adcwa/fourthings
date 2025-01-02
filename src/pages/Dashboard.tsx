import React, { useState } from 'react';
import { QuadrantChart } from '../components/QuadrantChart';
import { TaskForm } from '../components/TaskForm';
import { useTasks } from '../hooks/useTasks';
import { format } from 'date-fns';
import { Task } from '../services/db';

export const Dashboard: React.FC = () => {
  const [selectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [currentUserId] = useState('test-user');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [initialQuadrant, setInitialQuadrant] = useState<1 | 2 | 3 | 4 | null>(null);
  const [error, setError] = useState<Error | null>(null);
  
  const { tasks, addTask, updateTask, moveTask, deleteTask } = useTasks(currentUserId, selectedDate);

  const handleTaskMove = async (taskId: string, quadrant: 1 | 2 | 3 | 4) => {
    await moveTask(taskId, quadrant);
  };

  const handleTaskClick = (task: Task) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleAddTask = (quadrant: 1 | 2 | 3 | 4) => {
    setEditingTask(null);
    setInitialQuadrant(quadrant);
    setShowTaskForm(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('确定要删除这个任务吗？')) {
      await deleteTask(taskId);
    }
  };

  const handleToggleComplete = async (taskId: string) => {
    const task = tasks?.find(t => t.id === taskId);
    if (task) {
      await updateTask(taskId, { completed: !task.completed });
    }
  };

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        <p>出错了：{error.message}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
        >
          刷新页面
        </button>
      </div>
    );
  }

  if (!tasks) {
    return <div className="text-center py-8">加载中...</div>;
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">还没有任务</p>
        <button
          onClick={() => {
            setEditingTask(null);
            setShowTaskForm(true);
          }}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
        >
          添加第一个任务
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">今日任务象限</h1>
      </div>

      {showTaskForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <TaskForm
              initialValues={{
                ...editingTask,
                quadrant: initialQuadrant || editingTask?.quadrant || 1
              }}
              onSubmit={async (task) => {
                if (editingTask) {
                  await updateTask(editingTask.id!, task);
                } else {
                  await addTask(task);
                }
                setShowTaskForm(false);
                setEditingTask(null);
                setInitialQuadrant(null);
              }}
              onCancel={() => {
                setShowTaskForm(false);
                setEditingTask(null);
                setInitialQuadrant(null);
              }}
            />
          </div>
        </div>
      )}

      {tasks && (
        <QuadrantChart
          tasks={tasks}
          onTaskMove={handleTaskMove}
          onTaskClick={handleTaskClick}
          onAddTask={handleAddTask}
          onDeleteTask={handleDeleteTask}
          onToggleComplete={handleToggleComplete}
        />
      )}
    </div>
  );
}; 