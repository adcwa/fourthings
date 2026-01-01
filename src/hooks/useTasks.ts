import { useLiveQuery } from 'dexie-react-hooks';
import { db, Task } from '../services/db';

export function useTasks(
  userId: string,
  date: string,
  options?: {
    statusFilter?: 'all' | 'completed' | 'incomplete';
    searchQuery?: string;
  }
) {
  const { statusFilter = 'incomplete', searchQuery = '' } = options || {};

  const tasks = useLiveQuery(
    async () => {
      try {
        let collection = db.tasks.where('userId').equals(userId);

        // Date filter is ignored if searching (global search)
        // Or should we search within the day? User requirement "Fuzzy Search" implies finding tasks.
        // Usually search is global. But let's ask or assume. 
        // Given the UI is day-based, let's keep it day-based for now unless query is present?
        // Let's keep it date-scoped for now to avoid breaking the quadrant view logic which depends on date.
        // Actually, if I search "Buy Milk", I want to find it even if it was yesterday.
        // But the Quadrant View is inherently designed for a single date.
        // PROPOSAL: If searchQuery is present, ignore date. If not, filter by date.
        // BUT, the Dashboard expects tasks for the quadrant chart which might be confused if tasks have different dates.
        // Let's stick to Date-scoped search for V1 to be safe, OR return date-filtered list.
        // Wait, the user just said "Task Name Fuzzy Search".
        // Let's stick to current date for safety in Quadrant Chart. 

        // Actually, let's just filter the result of the date query.

        const result = await collection
          .filter(t => {
            // 1. Sync Logic (Standard)
            if (t.syncStatus === 'deleted') return false;

            // 2. Date Logic
            if (t.date !== date) return false;

            // 3. Status Filter
            if (statusFilter === 'completed' && !t.completed) return false;
            if (statusFilter === 'incomplete' && t.completed) return false;

            // 4. Search Query
            if (searchQuery) {
              const q = searchQuery.toLowerCase();
              return t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q);
            }

            return true;
          })
          .sortBy('order');

        return result;
      } catch (error) {
        console.error('Error fetching tasks:', error);
        return [];
      }
    },
    [userId, date, statusFilter, searchQuery]
  );

  const addTask = async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order' | 'version'>) => {
    try {
      const maxOrder = await db.tasks
        .where({ userId, date, quadrant: task.quadrant })
        .reverse()
        .first()
        .then(task => (task?.order || 0) + 1000);

      const newTask = {
        ...task,
        id: crypto.randomUUID(),
        userId: userId, // Force use current userId
        order: maxOrder,
        createdAt: new Date(),
        updatedAt: new Date(),
        syncStatus: 'created' as const,
        version: 1
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
    const task = await db.tasks.get(id);
    const newStatus = task?.syncStatus === 'created' ? 'created' : 'updated';
    const newVersion = (task?.version || 0) + 1;
    return await db.tasks.update(id, {
      ...updates,
      updatedAt: new Date(),
      syncStatus: newStatus,
      version: newVersion
    });
  };

  const deleteTask = async (id: string) => {
    const task = await db.tasks.get(id);
    const newVersion = (task?.version || 0) + 1;
    return await db.tasks.update(id, {
      syncStatus: 'deleted',
      updatedAt: new Date(),
      version: newVersion
    });
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
        updatedAt: new Date(),
        syncStatus: 'updated', // Moving counts as update
        version: (task.version || 0) + 1
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
      order: (index + 1) * 1000,
      syncStatus: task.syncStatus === 'created' ? 'created' : 'updated',
      version: (task.version || 0) + 1
    }));

    console.log('Updated order values:', updates);

    // 批量更新
    await Promise.all(
      updates.map(task =>
        db.tasks.update(task.id!, {
          order: task.order,
          syncStatus: task.syncStatus,
          version: task.version,
          updatedAt: new Date()
        })
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