import { db, Task, JournalEntry } from './db';
import { api } from './api';

export class SyncService {
    private static instance: SyncService;
    private isSyncing = false;
    private syncTimeout: any = null;
    private listeners: ((status: string) => void)[] = [];

    private constructor() {
        // Setup Dexie hooks for auto-upload
        db.tasks.hook('creating', () => { this.scheduleUpload(); });
        db.tasks.hook('updating', () => { this.scheduleUpload(); });
        db.tasks.hook('deleting', () => { this.scheduleUpload(); });
        db.journals.hook('creating', () => { this.scheduleUpload(); });
        db.journals.hook('updating', () => { this.scheduleUpload(); });
        db.journals.hook('deleting', () => { this.scheduleUpload(); });

        // Auto-upload when coming back online
        window.addEventListener('online', () => {
            console.log('Online detected, syncing...');
            this.upload();
        });
    }

    static getInstance() {
        if (!SyncService.instance) {
            SyncService.instance = new SyncService();
        }
        return SyncService.instance;
    }

    subscribe(listener: (status: string) => void) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notify(status: string) {
        this.listeners.forEach(l => l(status));
    }

    private scheduleUpload() {
        if (!localStorage.getItem('token')) return; // Not logged in

        this.notify('Changes pending...');

        // Debounce upload 2 seconds
        if (this.syncTimeout) clearTimeout(this.syncTimeout);
        this.syncTimeout = setTimeout(() => {
            this.upload();
        }, 2000);
    }

    async upload() {
        if (this.isSyncing || !localStorage.getItem('token')) return;

        this.isSyncing = true;
        this.notify('Syncing...');

        try {
            const tasks = await db.tasks.toArray();
            const journals = await db.journals.toArray();

            await api.post('/sync', { tasks, journals });

            this.notify('Synced');
            setTimeout(() => this.notify(''), 2000);
        } catch (error) {
            console.error('Upload failed:', error);
            this.notify('Sync Failed ⚠️');
        } finally {
            this.isSyncing = false;
        }
    }

    async download() {
        if (this.isSyncing || !localStorage.getItem('token')) return;

        this.isSyncing = true;
        this.notify('Downloading...');

        try {
            const data = await api.get<{ tasks: any[]; journals: any[] }>('/sync');

            // Fix Data Types
            const tasks = data.tasks.map(t => ({
                ...t,
                // Ensure date is YYYY-MM-DD string
                date: typeof t.date === 'string' ? t.date.split('T')[0] : t.date,
                createdAt: new Date(t.createdAt),
                updatedAt: new Date(t.updatedAt),
                // Ensure valid quadrant
                quadrant: t.quadrant || 1
            }));

            const journals = data.journals.map(j => ({
                ...j,
                // Ensure date is YYYY-MM-DD string
                date: typeof j.date === 'string' ? j.date.split('T')[0] : j.date,
                createdAt: new Date(j.createdAt),
                updatedAt: new Date(j.updatedAt)
            }));

            console.log('Saving to Dexie:', tasks.length, 'tasks');
            if (tasks.length > 0) console.log('Sample task date:', tasks[0].date);

            await db.transaction('rw', db.tasks, db.journals, async () => {
                await db.tasks.clear();
                await db.journals.clear();
                await db.tasks.bulkAdd(tasks as Task[]);
                await db.journals.bulkAdd(journals as JournalEntry[]);
            });

            this.notify('Synced');
            setTimeout(() => this.notify(''), 2000);

            // Force reload to ensure UI updates (User reported issues with reactive update)
            console.log('Reloading to refresh UI...');
            window.location.reload();
        } catch (error) {
            console.error('Download failed:', error);
            this.notify('Download Failed ⚠️');
        } finally {
            this.isSyncing = false;
        }
    }

    async initialSync() {
        if (!localStorage.getItem('token')) return;

        // Smart Sync Logic
        // 1. Check if we have local data
        const localTaskCount = await db.tasks.count();
        const localJournalCount = await db.journals.count();
        const hasLocalData = localTaskCount > 0 || localJournalCount > 0;

        if (hasLocalData) {
            this.notify('Checking cloud...');
            try {
                // Check if cloud has data without downloading everything (optimization)
                // For MVP, just get the data.
                const data = await api.get<{ tasks: any[]; journals: any[] }>('/sync');
                const hasCloudData = data.tasks.length > 0 || data.journals.length > 0;

                if (!hasCloudData) {
                    // Cloud is empty, Local has data -> PUSH (Backup)
                    console.log('Cloud empty, local has data. Pushing...');
                    await this.upload();
                } else {
                    // Cloud has data -> PULL (Overwrite local with Cloud Truth)
                    // TODO: In future, merge. For now, Cloud wins to sync across devices.
                    // But maybe warn user? 
                    // "Smart" decision: If verified cloud data exists, we assume user wants that.
                    console.log('Cloud has data. Pulling...');
                    await this.download();
                }
            } catch (e) {
                console.error('Check failed', e);
                // If check fails, do nothing to be safe.
                this.notify('Sync Check Failed');
            }
        } else {
            // No local data, just pull whatever is in cloud
            await this.download();
        }
    }
}

export const syncService = SyncService.getInstance();
