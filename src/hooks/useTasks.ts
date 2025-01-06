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
      
      const task = await db.tasks.get(taskId);
      if (!task) {
        throw new Error(`Task not found: ${taskId}`);
      }

      // 获取目标象限的所有任务
      const targetQuadrantTasks = await db.tasks
        .where({ userId, date, quadrant: targetQuadrant })
        .sortBy('order');

      // 计算新的 order 值
      let newOrder: number;
      if (targetQuadrantTasks.length === 0) {
        // 如果象限为空，使用基础值
        newOrder = 1000;
      } else if (targetIndex === 0) {
        // 如果是移动到第一个位置
        newOrder = targetQuadrantTasks[0].order - 1000;
      } else if (targetIndex === undefined || targetIndex >= targetQuadrantTasks.length) {
        // 如果是移动到最后
        newOrder = targetQuadrantTasks[targetQuadrantTasks.length - 1].order + 1000;
      } else {
        // 移动到两个任务之间
        newOrder = (targetQuadrantTasks[targetIndex - 1].order + targetQuadrantTasks[targetIndex].order) / 2;
      }

      // 更新任务
      await db.tasks.update(taskId, {
        quadrant: targetQuadrant,
        order: newOrder,
        updatedAt: new Date()
      });

      // 如果 order 值过于接近，重新排序整个象限
      if (Math.abs(newOrder) > 1000000) {
        await reorderTasks(targetQuadrant);
      }

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