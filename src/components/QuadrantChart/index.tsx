import React from 'react';
import { Task } from '../../services/db';

interface QuadrantChartProps {
  tasks: Task[];
  onTaskMove: (taskId: string, quadrant: 1 | 2 | 3 | 4) => void;
  onTaskClick?: (task: Task) => void;
  onAddTask?: (quadrant: 1 | 2 | 3 | 4) => void;
  onDeleteTask?: (taskId: string) => void;
  onToggleComplete?: (taskId: string) => void;
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
  onToggleComplete
}) => {
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, quadrant: 1 | 2 | 3 | 4) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    onTaskMove(taskId, quadrant);
  };

  const renderQuadrant = (quadrant: 1 | 2 | 3 | 4) => {
    const quadrantTasks = tasks.filter(task => task.quadrant === quadrant);
    const { text, color, textColor } = QuadrantTitle[quadrant];

    return (
      <div 
        className={`h-full ${color} p-4 flex flex-col border-b border-r border-l border-t`}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, quadrant)}
      >
        <div className="flex justify-between items-center mb-4">
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
        
        <div className="flex-1 overflow-y-auto">
          {quadrantTasks.map(task => (
            <div
              key={task.id}
              draggable
              onDragStart={(e) => handleDragStart(e, task.id!)}
              className={`mb-2 p-3 bg-white rounded-lg shadow-sm border 
                ${task.completed ? 'border-green-200' : 'border-gray-200'}
                hover:shadow-md transition-shadow cursor-pointer`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div 
                    className="flex items-center gap-2"
                    onClick={() => onTaskClick?.(task)}
                  >
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
                    <span className={`font-medium ${task.completed ? 'line-through text-gray-400' : ''}`}>
                      {task.title}
                    </span>
                  </div>
                  {task.description && (
                    <p className="mt-1 text-sm text-gray-500 truncate">
                      {task.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteTask?.(task.id!);
                  }}
                  className="ml-2 text-gray-400 hover:text-gray-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-[600px] grid grid-cols-2 grid-rows-2 bg-white rounded-lg shadow overflow-hidden">
      {renderQuadrant(1)}
      {renderQuadrant(2)}
      {renderQuadrant(3)}
      {renderQuadrant(4)}
    </div>
  );
}; 