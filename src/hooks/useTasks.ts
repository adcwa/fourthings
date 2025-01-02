import { useLiveQuery } from 'dexie-react-hooks';
import { db, Task } from '../services/db';

export function useTasks(userId: string, date: string) {
  const tasks = useLiveQuery(
    async () => {
      try {
        console.log('Fetching tasks for:', userId, date);
        const result = await db.tasks
          .where({userId: userId, date: date})
          .toArray();
        console.log('Fetched tasks:', result);
        return result;
      } catch (error) {
        console.error('Error fetching tasks:', error);
        return [];
      }
    },
    [userId, date]
  );

  const addTask = async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      console.log('Adding task:', task);
      return await db.tasks.add({
        ...task,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    return await db.tasks.update(id, {
      ...updates,
      updatedAt: new Date()
    });
  };

  const deleteTask = async (id: string) => {
    return await db.tasks.delete(id);
  };

  const moveTask = async (id: string, quadrant: 1 | 2 | 3 | 4) => {
    return await updateTask(id, { quadrant });
  };

  return {
    tasks: tasks || [],
    addTask,
    updateTask,
    deleteTask,
    moveTask
  };
} 