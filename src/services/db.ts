import Dexie from 'dexie';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id?: string;
  title: string;
  description?: string;
  quadrant: 1 | 2 | 3 | 4;
  date: string;
  completed: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  order: number;
  syncStatus?: 'synced' | 'created' | 'updated' | 'deleted';

  // New fields
  status?: 'todo' | 'in_progress' | 'blocked' | 'cancelled';
  priority?: 'high' | 'medium' | 'low';
  dueDate?: string;
  tags?: string[];
  subtasks?: SubTask[];
  progress?: number;
  version: number;
}

export interface JournalEntry {
  id?: string;
  content: string;
  date: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  syncStatus?: 'synced' | 'created' | 'updated' | 'deleted';
  tags?: string[];
  version: number;
}

export interface User {
  id?: string;
  username: string;
  preferences: {
    theme: 'light' | 'dark';
    language: string;
  };
  createdAt: Date;
}

class QuadrantDB extends Dexie {
  tasks!: Dexie.Table<Task, string>;
  journals!: Dexie.Table<JournalEntry, string>;
  users!: Dexie.Table<User, string>;

  constructor() {
    super('QuadrantDB');

    this.version(1).stores({}).upgrade(() => { });
    this.version(2).stores({}).upgrade(() => { });

    this.version(4).stores({
      tasks: 'id, userId, date, quadrant, completed, order',
      journals: 'id, userId, date',
      users: 'id, username'
    });

    this.version(5).stores({
      tasks: 'id, userId, date, quadrant, completed, order, status, priority',
      journals: 'id, userId, date'
    });

    this.version(6).stores({
      tasks: 'id, userId, date, quadrant, completed, order, status, priority, updatedAt',
      journals: 'id, userId, date, updatedAt'
    });

    this.version(7).stores({
      tasks: 'id, userId, date, quadrant, completed, order, status, priority, updatedAt, syncStatus',
      journals: 'id, userId, date, updatedAt, syncStatus'
    });

    this.version(8).stores({
      tasks: 'id, userId, date, quadrant, completed, order, status, priority, updatedAt, syncStatus, version',
      journals: 'id, userId, date, updatedAt, syncStatus, version'
    });
  }
}

const db = new QuadrantDB();

const initializeTestData = async () => {
  try {
    const count = await db.tasks.count();
    if (count === 0) {
      console.log('Initializing with sample tasks');
      const today = new Date().toISOString().split('T')[0];

      const sampleTasks: Task[] = [
        {
          id: crypto.randomUUID(),
          title: '解决紧急生产 Bug',
          description: '线上支付系统出现间歇性延迟，需要立即排查',
          quadrant: 1,
          date: today,
          completed: false,
          userId: 'test-user',
          createdAt: new Date(),
          updatedAt: new Date(),
          order: 1000,
          status: 'in_progress',
          priority: 'high',
          tags: ['生产', '紧急'],
          subtasks: [
            { id: crypto.randomUUID(), title: '定位日志异常', completed: true },
            { id: crypto.randomUUID(), title: '复现延迟现象', completed: false }
          ],
          progress: 50,
          version: 1
        },
        {
          id: crypto.randomUUID(),
          title: '准备项目周报',
          description: '整理本周进度、阻碍点及下周计划',
          quadrant: 1,
          date: today,
          completed: false,
          userId: 'test-user',
          createdAt: new Date(),
          updatedAt: new Date(),
          order: 2000,
          status: 'todo',
          priority: 'medium',
          tags: ['汇报'],
          version: 1
        },
        {
          id: crypto.randomUUID(),
          title: '下周工作规划',
          description: '思考核心目标，分解关键任务',
          quadrant: 2,
          date: today,
          completed: false,
          userId: 'test-user',
          createdAt: new Date(),
          updatedAt: new Date(),
          order: 1000,
          status: 'todo',
          priority: 'high',
          tags: ['规划', '核心'],
          version: 1
        },
        {
          id: crypto.randomUUID(),
          title: '阅读行业优秀文章',
          description: '保持对前沿技术的关注和思考',
          quadrant: 2,
          date: today,
          completed: false,
          userId: 'test-user',
          createdAt: new Date(),
          updatedAt: new Date(),
          order: 2000,
          status: 'in_progress',
          priority: 'low',
          tags: ['学习'],
          progress: 30,
          version: 1
        },
        {
          id: crypto.randomUUID(),
          title: '回复非紧要邮件',
          description: '批量处理收件箱，释放注意力',
          quadrant: 3,
          date: today,
          completed: false,
          userId: 'test-user',
          createdAt: new Date(),
          updatedAt: new Date(),
          order: 1000,
          status: 'todo',
          priority: 'low',
          tags: ['琐事'],
          version: 1
        },
        {
          id: crypto.randomUUID(),
          title: '社群消息处理',
          description: '查看并回复微信群/Slack 消息',
          quadrant: 3,
          date: today,
          completed: false,
          userId: 'test-user',
          createdAt: new Date(),
          updatedAt: new Date(),
          order: 2000,
          status: 'blocked',
          priority: 'medium',
          tags: ['沟通'],
          version: 1
        },
        {
          id: crypto.randomUUID(),
          title: '整理办公桌面',
          description: '清理杂物，营造清爽的办公环境',
          quadrant: 4,
          date: today,
          completed: false,
          userId: 'test-user',
          createdAt: new Date(),
          updatedAt: new Date(),
          order: 1000,
          status: 'todo',
          priority: 'low',
          tags: ['生活'],
          version: 1
        },
        {
          id: crypto.randomUUID(),
          title: '随意浏览网页',
          description: '休息并获取一些随机灵感',
          quadrant: 4,
          date: today,
          completed: false,
          userId: 'test-user',
          createdAt: new Date(),
          updatedAt: new Date(),
          order: 2000,
          status: 'cancelled',
          priority: 'low',
          version: 1
        }
      ];

      await db.tasks.bulkAdd(sampleTasks);
      console.log('Successfully initialized with sample tasks');
    } else {
      console.log('Database already has tasks, skipping initialization');
    }
  } catch (error) {
    console.error('Error initializing test data:', error);
  }
};

const initDatabase = async () => {
  try {
    const isNewVersion = !await Dexie.exists('QuadrantDB');

    await db.open();
    console.log('Database opened successfully');

    if (isNewVersion) {
      await initializeTestData();
    }
  } catch (error) {
    console.error('Error initializing database:', error);
    if (error instanceof Error) {
      if (error.name === 'VersionError' || error.name === 'UpgradeError') {
        console.log('Database version error, deleting and recreating...');
        await Dexie.delete('QuadrantDB');
        await db.open();
        await initializeTestData();
      }
    }
    throw error;
  }
};

initDatabase().catch(error => {
  console.error('Failed to initialize database:', error);
});

export { db }; 