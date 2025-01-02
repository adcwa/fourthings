import React, { useState } from 'react';
import { QuadrantChart } from '../components/QuadrantChart';
import { TaskForm } from '../components/TaskForm';
import { useTasks } from '../hooks/useTasks';
import { format } from 'date-fns';
import { Task } from '../services/db';
import Dexie from 'dexie';

export const Dashboard: React.FC = () => {
  const [selectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [currentUserId] = useState('test-user');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [initialQuadrant, setInitialQuadrant] = useState<1 | 2 | 3 | 4 | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);
  
  const { tasks, addTask, updateTask, moveTask, deleteTask } = useTasks(currentUserId, selectedDate);

  const handleTaskMove = async (taskId: string, quadrant: 1 | 2 | 3 | 4) => {
    try {
      console.log('Dashboard: Moving task:', taskId, 'to quadrant:', quadrant);
      if (!taskId) {
        throw new Error('Invalid taskId');
      }
      await moveTask(taskId, quadrant);
    } catch (error) {
      console.error('Error moving task:', error);
      setError(error as Error);
    }
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

  const handleReorder = async (taskId: string, quadrant: 1 | 2 | 3 | 4, newIndex: number) => {
    try {
      console.log('Dashboard: Reordering task:', taskId, 'in quadrant:', quadrant, 'to index:', newIndex);
      if (!taskId) {
        throw new Error('Invalid taskId');
      }
      await moveTask(taskId, quadrant, newIndex);
    } catch (error) {
      console.error('Error reordering task:', error);
      setError(error as Error);
    }
  };

  const handleRecovery = async () => {
    if (!window.confirm('这将删除所有数据并重置应用，确定要继续吗？')) {
      return;
    }
    
    try {
      setIsRecovering(true);
      await Dexie.delete('QuadrantDB');
      window.location.reload();
    } catch (error) {
      console.error('Error during recovery:', error);
      setError(new Error('重置数据库失败，请刷新页面重试'));
    } finally {
      setIsRecovering(false);
    }
  };

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        <p>出错了：{error.message}</p>
        <button 
          onClick={handleRecovery}
          disabled={isRecovering}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
        >
          {isRecovering ? '正在恢复...' : '重置数据库并刷新'}
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
       
      </div>

      {showTaskForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md transform transition-all">
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
          onReorder={handleReorder}
        />
      )}
    </div>
  );
}; 