import React, { useState } from 'react';
import { Task } from '../../services/db';
import { ConfirmDialog } from '../ConfirmDialog';

interface QuadrantChartProps {
  tasks: Task[];
  onTaskMove: (taskId: string, quadrant: 1 | 2 | 3 | 4, newIndex:number) => void;
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
    console.log('Drag start with task:', task);
    setDraggedTask(task);
    e.dataTransfer.setData('taskId', task.id!);
    // 设置拖动时的视觉效果
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-50');
    setDraggedTask(null);
    // 移除所有放置指示器
    document.querySelectorAll('.drop-indicator').forEach(el => el.remove());
  };

  const handleDragOver = (e: React.DragEvent, quadrant: number, index: number) => {
    e.preventDefault();
    if (!draggedTask) return;

    // 更新放置指示器
    const taskList = e.currentTarget.closest('.task-list');
    if (!taskList) return;

    // 移除现有的指示器
    document.querySelectorAll('.drop-indicator').forEach(el => el.remove());

    // 创建新的指示器
    const indicator = document.createElement('div');
    indicator.className = `drop-indicator h-1 my-1 rounded transition-all duration-200 ${getQuadrantColor(quadrant)}`;
    
    const taskElements = Array.from(taskList.querySelectorAll('.group'));
    
    if (taskElements.length === 0) {
      // 如果象限为空，添加指示器到顶部
      taskList.insertBefore(indicator, taskList.firstChild);
    } else if (index === 0) {
      // 如果是拖到第一个位置，在第一个任务之前添加指示器
      taskList.insertBefore(indicator, taskElements[0]);
    } else if (index >= taskElements.length) {
      // 如果是拖到最后，在最后添加指示器
      taskList.appendChild(indicator);
    } else {
      // 在指定位置添加指示器
      taskList.insertBefore(indicator, taskElements[index]);
    }
  };

  const handleDrop = async (e: React.DragEvent, quadrant: number, index: number) => {
    e.preventDefault();
    e.stopPropagation(); // 防止事件冒泡
    
    if (!draggedTask) return;

    const taskId = e.dataTransfer.getData('taskId');
    console.log('Drop with taskId:', taskId, 'draggedTask:', draggedTask, 'to quadrant:', quadrant, 'at index:', index);
    
    try {
      if (draggedTask.quadrant === quadrant) {
        // 同象限内排序
        onReorder?.(taskId, quadrant as 1 | 2 | 3 | 4, index);
      } else {
        // 跨象限移动
        onTaskMove(taskId, quadrant as 1 | 2 | 3 | 4, index);
      }
    } catch (error) {
      console.error('Error handling drop:', error);
    }

    // 清理状态
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

  // 添加一个工具函数来截取文本
  const truncateText = (text: string, maxLength: number) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
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
            handleDragOver(e, quadrant, 0); // 允许拖拽到空象限
          }}
          onDrop={(e) => handleDrop(e, quadrant, 0)} // 允许放置到空象限
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
              className={`group mb-1 p-2 bg-white rounded-lg shadow-sm border 
                ${task.completed ? 'border-green-200' : 'border-gray-200'}
                hover:shadow-md transition-all duration-200
                ${draggedTask?.id === task.id ? 'opacity-50' : 'opacity-100'}
                ${isDeleting && taskToDelete?.id === task.id ? 'animate-slide-out' : ''}`}
              onAnimationEnd={() => {
                if (isDeleting && taskToDelete?.id === task.id) {
                  onDeleteTask?.(task.id!);
                  setTaskToDelete(null);
                  setIsDeleting(false);
                }
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleComplete?.(task.id!);
                      }}
                      className={`flex-shrink-0 w-5 h-5 rounded-full border-2 
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
                    <div 
                      className="flex-1 cursor-pointer min-w-0"
                      onClick={() => onTaskClick?.(task)}
                    >
                      <div 
                        className={`font-medium truncate ${task.completed ? 'line-through text-gray-400' : ''}`}
                        title={task.title}
                      >
                        {truncateText(task.title, 100)}
                      </div>
                      {task.description && (
                        <div 
                          className="mt-1 text-sm text-gray-500"
                          title={task.description}
                        >
                          <p className="line-clamp-2 break-words">
                            {task.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0">
                  <button
                    className="text-gray-400 hover:text-gray-500 cursor-move"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTaskToDelete(task);
                    }}
                    className="ml-2 text-gray-400 hover:text-red-500"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
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

  // 处理确认删除
  const handleConfirmDelete = () => {
    if (taskToDelete && taskToDelete.id) {
      setIsDeleting(true);
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