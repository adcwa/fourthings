import React, { useState } from 'react';
import { Task } from '../../services/db';
import { ConfirmDialog } from '../ConfirmDialog';

interface QuadrantChartProps {
  tasks: Task[];
  onTaskMove: (taskId: string, quadrant: 1 | 2 | 3 | 4, newIndex: number) => void;
  onTaskClick?: (task: Task) => void;
  onAddTask?: (quadrant: 1 | 2 | 3 | 4) => void;
  onDeleteTask?: (taskId: string) => void;
  onToggleComplete?: (taskId: string) => void;
  onReorder?: (taskId: string, quadrant: 1 | 2 | 3 | 4, newIndex: number) => void;
}

export interface DragItem {
  taskId: string;
  quadrant: 1 | 2 | 3 | 4;
  index: number;
}

const QuadrantTitle = {
  1: { text: '重要且紧急', color: 'bg-red-50 border-red-100', textColor: 'text-red-700' },
  2: { text: '重要不紧急', color: 'bg-blue-50 border-blue-100', textColor: 'text-blue-700' },
  3: { text: '不重要但紧急', color: 'bg-amber-50 border-amber-100', textColor: 'text-amber-700' },
  4: { text: '不重要不紧急', color: 'bg-gray-50 border-gray-100', textColor: 'text-gray-700' }
};

const PriorityBadge: React.FC<{ priority?: string }> = ({ priority }) => {
  if (priority === 'high') return <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold flex-shrink-0">高</span>;
  if (priority === 'low') return <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded flex-shrink-0">低</span>;
  return null;
};

const StatusTag: React.FC<{ status?: string }> = ({ status }) => {
  const options = {
    in_progress: { label: '进行中', color: 'text-blue-500', icon: '⚡' },
    blocked: { label: '已阻塞', color: 'text-amber-600', icon: '🚫' },
    cancelled: { label: '已取消', color: 'text-gray-400', icon: '✖️' },
    todo: null
  };
  const config = options[status as keyof typeof options];
  if (!config) return null;
  return (
    <span className={`text-[10px] flex items-center gap-0.5 ${config.color}`}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
};

export const QuadrantChart: React.FC<QuadrantChartProps> = ({
  tasks,
  onTaskMove,
  onTaskClick,
  onAddTask,
  onDeleteTask,
  onToggleComplete,
  onReorder
}) => {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.setData('taskId', task.id!);
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-50');
    setDraggedTask(null);
    document.querySelectorAll('.drop-indicator').forEach(el => el.remove());
  };

  const handleDragOver = (e: React.DragEvent, quadrant: number, index: number) => {
    e.preventDefault();
    if (!draggedTask) return;
    const taskList = e.currentTarget.closest('.task-list');
    if (!taskList) return;
    document.querySelectorAll('.drop-indicator').forEach(el => el.remove());
    const indicator = document.createElement('div');
    indicator.className = `drop-indicator h-1 my-1 rounded transition-all duration-200 ${getQuadrantColor(quadrant)}`;
    const taskElements = Array.from(taskList.querySelectorAll('.group'));
    if (taskElements.length === 0) {
      taskList.insertBefore(indicator, taskList.firstChild);
    } else if (index === 0) {
      taskList.insertBefore(indicator, taskElements[0]);
    } else if (index >= taskElements.length) {
      taskList.appendChild(indicator);
    } else {
      taskList.insertBefore(indicator, taskElements[index]);
    }
  };

  const handleDrop = async (e: React.DragEvent, quadrant: number, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedTask) return;
    const taskId = e.dataTransfer.getData('taskId');
    try {
      if (draggedTask.quadrant === quadrant) {
        onReorder?.(taskId, quadrant as 1 | 2 | 3 | 4, index);
      } else {
        onTaskMove(taskId, quadrant as 1 | 2 | 3 | 4, index);
      }
    } catch (error) {
      console.error('Error handling drop:', error);
    }
    setDraggedTask(null);
    document.querySelectorAll('.drop-indicator').forEach(el => el.remove());
  };

  const getQuadrantColor = (quadrant: number) => {
    switch (quadrant) {
      case 1: return 'bg-red-500';
      case 2: return 'bg-blue-500';
      case 3: return 'bg-amber-500';
      case 4: return 'bg-gray-500';
      default: return 'bg-gray-300';
    }
  };

  const renderQuadrant = (quadrant: 1 | 2 | 3 | 4) => {
    const quadrantTasks = tasks
      .filter(task => task.quadrant === quadrant)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    const { text, color, textColor } = QuadrantTitle[quadrant];

    return (
      <div className={`h-full ${color} flex flex-col border-r border-b`}>
        <div className={`p-3 border-b ${color} flex justify-between items-center sticky top-0 z-10`}>
          <h3 className={`font-bold ${textColor}`}>{text}</h3>
          <button
            onClick={() => onAddTask?.(quadrant)}
            className={`p-1 rounded-full hover:bg-white/50 ${textColor}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div
          className="flex-1 overflow-y-auto p-3 task-list custom-scrollbar"
          onDragOver={(e) => {
            e.preventDefault();
            handleDragOver(e, quadrant, 0);
          }}
          onDrop={(e) => handleDrop(e, quadrant, 0)}
        >
          {quadrantTasks.map((task, index) => (
            <div
              key={task.id}
              draggable
              onDragStart={(e) => handleDragStart(e, task)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDragOver(e, quadrant, index);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDrop(e, quadrant, index);
              }}
              className={`group mb-2 p-3 bg-white rounded-lg shadow-sm border 
                ${task.completed ? 'border-green-200' : 'border-gray-200'}
                hover:shadow-md transition-all duration-200
                ${draggedTask?.id === task.id ? 'opacity-50' : 'opacity-100'}
                ${isDeleting && taskToDelete?.id === task.id ? 'animate-slide-out' : ''}`}
            >
              <div className="flex items-start gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleComplete?.(task.id!);
                  }}
                  className={`flex-shrink-0 w-5 h-5 mt-0.5 rounded-full border-2 transition-colors 
                    ${task.completed
                      ? 'bg-green-500 border-green-500'
                      : 'border-gray-300 hover:border-gray-400'}`}
                >
                  {task.completed && (
                    <svg className="w-full h-full text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>

                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onTaskClick?.(task)}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <PriorityBadge priority={task.priority} />
                    <span className={`font-medium text-sm truncate ${task.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                      {task.title}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                    <StatusTag status={task.status} />

                    {task.dueDate && (
                      <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                        📅 {task.dueDate}
                      </span>
                    )}

                    {task.tags && task.tags.length > 0 && (
                      <div className="flex gap-1 overflow-hidden">
                        {task.tags.slice(0, 2).map((tag, i) => (
                          <span key={i} className="text-[9px] bg-gray-50 text-gray-500 px-1 rounded border border-gray-100 whitespace-nowrap">
                            #{tag}
                          </span>
                        ))}
                        {task.tags.length > 2 && <span className="text-[9px] text-gray-300">...</span>}
                      </div>
                    )}
                  </div>

                  {(task.progress !== undefined && task.progress > 0) && (
                    <div className="mt-2 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-400 transition-all duration-500"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-center opacity-0 group-hover:opacity-100 transition-opacity ml-1 flex-shrink-0 gap-1.5">
                  <button
                    onClick={(e) => { e.stopPropagation(); setTaskToDelete(task); }}
                    className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
          <div
            className="h-full min-h-[50px]"
            onDragOver={(e) => {
              e.preventDefault();
              handleDragOver(e, quadrant, quadrantTasks.length);
            }}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(e, quadrant, quadrantTasks.length);
            }}
          />
        </div>
      </div>
    );
  };

  const handleConfirmDelete = () => {
    if (taskToDelete && taskToDelete.id) {
      onDeleteTask?.(taskToDelete.id);
      setTaskToDelete(null);
    }
  };

  return (
    <>
      <div className="w-full h-[800px] grid grid-cols-2 grid-rows-2 bg-white rounded-lg shadow overflow-hidden">
        {renderQuadrant(1)}
        {renderQuadrant(2)}
        {renderQuadrant(3)}
        {renderQuadrant(4)}
      </div>

      <ConfirmDialog
        isOpen={taskToDelete !== null && !isDeleting}
        title="删除任务"
        message={`确定要删除任务"${taskToDelete?.title}"吗？`}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setTaskToDelete(null);
          setIsDeleting(false);
        }}
      />
    </>
  );
};