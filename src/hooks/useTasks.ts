import { useLiveQuery } from 'dexie-react-hooks';
import { db, Task } from '../services/db';

export function useTasks(userId: string, date: string) {
  const tasks = useLiveQuery(
    async () => {
      try {
        const result = await db.tasks
          .where({ userId: userId, date: date })
          .sortBy('order');
        return result;
      } catch (error) {
        console.error('Error fetching tasks:', error);
        return [];
      }
    },
    [userId, date]
  );

  const addTask = async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => {
    try {
      const maxOrder = await db.tasks
        .where({ userId, date, quadrant: task.quadrant })
        .reverse()
        .first()
        .then(task => (task?.order || 0) + 1000);

      const newTask = {
        ...task,
        id: crypto.randomUUID(),
        order: maxOrder,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const id = await db.tasks.add(newTask);
      console.log('Added new task:', newTask);
      return id;
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

  const moveTask = async (taskId: string, targetQuadrant: 1 | 2 | 3 | 4, targetIndex?: number) => {
    try {
      console.log('Moving task in DB:', taskId, targetQuadrant, targetIndex);
      
      // 先检查任务是否存在
      const task = await db.tasks.get(taskId);
      console.log('Found task:', task);

      if (!task) {
        console.error('Task not found:', taskId);
        const allTasks = await db.tasks.toArray();
        console.log('All tasks in DB:', allTasks);
        throw new Error(`Task not found: ${taskId}`);
      }

      // 获取目标象限的所有任务
      const targetQuadrantTasks = await db.tasks
        .where({ userId, date, quadrant: targetQuadrant })
        .sortBy('order');

      console.log('Target quadrant tasks:', targetQuadrantTasks);

      // 计算新的 order 值
      let newOrder: number;
      if (targetIndex === undefined || targetIndex >= targetQuadrantTasks.length) {
        newOrder = targetQuadrantTasks.length > 0 
          ? (targetQuadrantTasks[targetQuadrantTasks.length - 1].order + 1000)
          : 1000;
      } else {
        newOrder = targetIndex === 0 
          ? 500
          : (targetQuadrantTasks[targetIndex - 1].order + targetQuadrantTasks[targetIndex].order) / 2;
      }

      console.log('New order value:', newOrder);

      // 更新任务
      const updateResult = await db.tasks.update(taskId, {
        quadrant: targetQuadrant,
        order: newOrder,
        updatedAt: new Date()
      });

      console.log('Update result:', updateResult);

      if (!updateResult) {
        throw new Error(`Failed to update task: ${taskId}`);
      }

      return updateResult;
    } catch (error) {
      console.error('Error moving task:', error);
      throw error;
    }
  };

  const reorderTasks = async (quadrant: 1 | 2 | 3 | 4) => {
    console.log('Reordering tasks in quadrant:', quadrant);
    
    const tasks = await db.tasks
      .where({ userId, date, quadrant })
      .sortBy('order');

    console.log('Tasks to reorder:', tasks);

    // 重新分配 order 值，使用较大的增量
    const updates = tasks.map((task, index) => ({
      ...task,
      order: (index + 1) * 1000
    }));

    console.log('Updated order values:', updates);

    // 批量更新
    await Promise.all(
      updates.map(task => 
        db.tasks.update(task.id!, { order: task.order })
      )
    );
  };

  return {
    tasks: tasks || [],
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    reorderTasks
  };
} 