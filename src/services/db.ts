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
  order: number;
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
    
    this.version(1).stores({}).upgrade(() => {});
    this.version(2).stores({}).upgrade(() => {});
    
    this.version(4).stores({
      tasks: 'id, userId, date, quadrant, completed, order',
      journals: 'id, userId, date',
      users: 'id, username'
    });
  }
}

const db = new QuadrantDB();

const initializeTestData = async () => {
  try {
    const count = await db.tasks.count();
    if (count === 0) {
      console.log('Adding test task');
      const taskId = crypto.randomUUID();
      const task = {
        id: taskId,
        title: '测试任务',
        description: '这是一个测试任务',
        quadrant: 1 as const,
        date: new Date().toISOString().split('T')[0],
        completed: false,
        userId: 'test-user',
        createdAt: new Date(),
        updatedAt: new Date(),
        order: 0
      };
      
      console.log('Initializing with task:', task);
      await db.tasks.add(task);
      console.log('Added test task with ID:', taskId);
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
    if (error.name === 'VersionError' || error.name === 'UpgradeError') {
      console.log('Database version error, deleting and recreating...');
      await Dexie.delete('QuadrantDB');
      await db.open();
      await initializeTestData();
    }
  }
};

initDatabase().catch(error => {
  console.error('Failed to initialize database:', error);
});

export { db }; 