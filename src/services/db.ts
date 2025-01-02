import Dexie from 'dexie';

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
}

export interface JournalEntry {
  id?: string;
  content: string;
  date: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
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
    
    this.version(1).stores({
      tasks: '++id, userId, date, quadrant, completed',
      journals: '++id, userId, date',
      users: '++id, username'
    });
  }
}

const db = new QuadrantDB();

// 初始化测试数据
const initializeTestData = async () => {
  try {
    const count = await db.tasks.count();
    if (count === 0) {
      console.log('Adding test task');
      await db.tasks.add({
        title: '测试任务',
        description: '这是一个测试任务',
        quadrant: 1,
        date: new Date().toISOString().split('T')[0],
        completed: false,
        userId: 'test-user',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  } catch (error) {
    console.error('Error initializing test data:', error);
  }
};

// 等待数据库准备就绪后初始化测试数据
db.open().then(() => {
  console.log('Database opened successfully');
  return initializeTestData();
}).catch(error => {
  console.error('Error opening database:', error);
});

export { db }; 