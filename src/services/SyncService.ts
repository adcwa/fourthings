import { db, Task, JournalEntry } from './db';
import { api } from './api';

export class SyncService {
    private static instance: SyncService;
    private isSyncing = false;
    private pendingUpload = false;
    private syncTimeout: any = null;
    private listeners: ((status: string) => void)[] = [];

    private mode: 'offline' | 'cloud' = 'offline';

    private constructor() {
        // Load mode
        const savedMode = localStorage.getItem('syncMode');
        if (savedMode === 'cloud') {
            this.mode = 'cloud';
        }

        // Setup Dexie hooks for auto-upload
        db.tasks.hook('creating', () => { this.scheduleUpload(); });
        db.tasks.hook('updating', () => { this.scheduleUpload(); });
        // deleting hook might not fire for soft deletes, but updating will.
        // We keep deleting hook just in case hard delete happens elsewhere.
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

    setMode(mode: 'offline' | 'cloud') {
        this.mode = mode;
        localStorage.setItem('syncMode', mode);
        this.notify(`Mode changed to ${mode}`);
        if (mode === 'cloud') {
            this.initialSync();
        }
    }

    getMode() {
        return this.mode;
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
        if (!localStorage.getItem('token') || this.mode === 'offline') return;

        this.notify('Changes pending...');

        // Debounce upload 2 seconds
        if (this.syncTimeout) clearTimeout(this.syncTimeout);
        this.syncTimeout = setTimeout(() => {
            this.upload();
        }, 2000);
    }

    async upload() {
        if (!localStorage.getItem('token')) return;
        if (this.mode === 'offline') {
            console.log('Offline mode: skipping upload');
            return;
        }

        if (this.isSyncing) {
            console.log('Sync in progress, queuing upload...');
            this.pendingUpload = true;
            return;
        }

        this.isSyncing = true;
        this.pendingUpload = false;
        this.notify('Syncing...');

        try {
            // 1. Get ALL local data for CURRENT user
            const userData = localStorage.getItem('user');
            if (!userData) return;
            const { id: userId } = JSON.parse(userData);

            const allTasks = await db.tasks.where('userId').equals(userId).toArray();
            const allJournals = await db.journals.where('userId').equals(userId).toArray();

            // 2. Full Snapshot Model: 
            // Send ALL active tasks and journals to the server.
            // Items marked as 'deleted' are NOT sent; the server will delete everything 
            // and replace with this snapshot.
            const tasksPayload = allTasks.filter(t => t.syncStatus !== 'deleted');
            const journalsPayload = allJournals.filter(j => j.syncStatus !== 'deleted');

            const deletedTaskIds = allTasks.filter(t => t.syncStatus === 'deleted').map(t => t.id!);
            const deletedJournalIds = allJournals.filter(j => j.syncStatus === 'deleted').map(j => j.id!);

            console.log(`[Sync Upload] Snapshot: ${tasksPayload.length} tasks, ${journalsPayload.length} journals. Deleting: ${deletedTaskIds.length} tasks locally.`);

            await api.post('/sync', {
                tasks: tasksPayload,
                journals: journalsPayload
            });

            // 3. On success:
            await db.transaction('rw', db.tasks, db.journals, async () => {
                // A. Hard Delete items that were marked 'deleted' locally
                if (deletedTaskIds.length > 0) await db.tasks.bulkDelete(deletedTaskIds);
                if (deletedJournalIds.length > 0) await db.journals.bulkDelete(deletedJournalIds);

                // B. Mark all other local items as 'synced'
                await db.tasks.where('syncStatus').notEqual('deleted').modify({ syncStatus: 'synced' });
                await db.journals.where('syncStatus').notEqual('deleted').modify({ syncStatus: 'synced' });
            });

            this.notify('Synced');
            setTimeout(() => this.notify(''), 2000);
        } catch (error) {
            console.error('Upload failed:', error);
            this.notify('Sync Failed ⚠️');
        } finally {
            this.isSyncing = false;
            if (this.pendingUpload) {
                this.pendingUpload = false;
                setTimeout(() => this.upload(), 100);
            }
        }
    }

    async download() {
        if (this.isSyncing || !localStorage.getItem('token')) return;
        if (this.mode === 'offline') return;

        this.isSyncing = true;
        this.notify('Downloading...');

        try {
            const data = await api.get<{ tasks: any[]; journals: any[] }>('/sync');

            // Fix Data Types (Helper function to keep code clean)
            const parseDate = (d: any) => new Date(d);
            const serverTasks = data.tasks.map(t => ({
                ...t,
                date: typeof t.date === 'string' ? t.date.split('T')[0] : t.date,
                createdAt: parseDate(t.createdAt),
                updatedAt: parseDate(t.updatedAt),
                quadrant: t.quadrant || 1,
                syncStatus: 'synced' as const
            }));

            const serverJournals = data.journals.map(j => ({
                ...j,
                date: typeof j.date === 'string' ? j.date.split('T')[0] : j.date,
                createdAt: parseDate(j.createdAt),
                updatedAt: parseDate(j.updatedAt),
                syncStatus: 'synced' as const
            }));

            await db.transaction('rw', db.tasks, db.journals, async () => {
                // 1. Processing Tasks
                const localTasks = await db.tasks.toArray();
                const serverTaskIds = new Set(serverTasks.map(t => t.id));
                const localTaskMap = new Map(localTasks.map(t => [t.id, t]));

                // A. Delete local items that are NOT in server AND are 'synced' (clean)
                // If syncStatus is 'created'/'updated', we KEEP it (User added offline)
                const tasksToDelete = localTasks
                    .filter(t => !serverTaskIds.has(t.id) && t.syncStatus === 'synced')
                    .map(t => t.id!);

                if (tasksToDelete.length > 0) {
                    await db.tasks.bulkDelete(tasksToDelete);
                }

                // B. Upsert Server Items
                // NEW: Version-based Win strategy (LWW)
                // We overwrite if:
                // 1. Local item doesn't exist
                // 2. Server version > Local version
                // 3. Server version == Local version AND Server updatedAt > Local updatedAt
                const tasksToPut: Task[] = [];
                for (const st of serverTasks) {
                    const lt = localTaskMap.get(st.id);
                    if (!lt) {
                        tasksToPut.push(st as Task);
                    } else {
                        const sTime = st.updatedAt.getTime();
                        const lTime = lt.updatedAt.getTime();
                        if (st.version > lt.version || (st.version === lt.version && sTime > lTime)) {
                            tasksToPut.push(st as Task);
                        }
                    }
                }
                if (tasksToPut.length > 0) {
                    await db.tasks.bulkPut(tasksToPut);
                }

                // 2. Processing Journals (Identical Logic)
                const localJournals = await db.journals.toArray();
                const serverJournalIds = new Set(serverJournals.map(j => j.id));
                const localJournalMap = new Map(localJournals.map(j => [j.id, j]));

                const journalsToDelete = localJournals
                    .filter(j => !serverJournalIds.has(j.id) && j.syncStatus === 'synced')
                    .map(j => j.id!);

                if (journalsToDelete.length > 0) {
                    await db.journals.bulkDelete(journalsToDelete);
                }

                const journalsToPut: JournalEntry[] = [];
                for (const sj of serverJournals) {
                    const lj = localJournalMap.get(sj.id);
                    if (!lj) {
                        journalsToPut.push(sj as JournalEntry);
                    } else {
                        const sTime = sj.updatedAt.getTime();
                        const lTime = lj.updatedAt.getTime();
                        if (sj.version > lj.version || (sj.version === lj.version && sTime > lTime)) {
                            journalsToPut.push(sj as JournalEntry);
                        }
                    }
                }
                if (journalsToPut.length > 0) {
                    await db.journals.bulkPut(journalsToPut);
                }
            });

            this.notify('Synced');
            setTimeout(() => this.notify(''), 2000);

            console.log('Data synced to local DB.');
        } catch (error) {
            console.error('Download failed:', error);
            this.notify('Download Failed ⚠️');
        } finally {
            this.isSyncing = false;
            // Check pendingUpload after download too (maybe user edited while downloading)
            if (this.pendingUpload) {
                this.pendingUpload = false;
                setTimeout(() => this.upload(), 100);
            }
        }
    }

    async initialSync() {
        if (!localStorage.getItem('token')) return;
        if (this.mode === 'offline') return;

        // 1. Push changes first (so we don't overwrite them with download if logic was weak, 
        // implies we trust local more recently).
        // Actually, Upload handles its own safety.
        console.log('Initial Sync: Pushing local changes...');
        await this.upload();

        // 2. Then Pull latest
        console.log('Initial Sync: Pulling remote changes...');
        await this.download();

        this.startPolling();
    }
    startPolling() {
        if (this.syncTimeout) clearInterval(this.syncTimeout);

        // Poll every 5 seconds
        setInterval(async () => {
            if (this.isSyncing || !localStorage.getItem('token') || this.mode === 'offline') return;

            try {
                // Check server max time
                const res = await api.get<{ timestamp: number }>('/sync?check=true');

                // Compare with local latest 'synced' time? 
                // Simple heuristic: always pull if server says so.
                // Our download logic is safe now, so we can just call it.
                // Optimization: store lastSyncTime and compare. 
                // For now, relies on api check.

                // If API returns timestamp, we can compare.
                // But simplified: the server check API usage in original code was:
                // if (res.timestamp > localTime + 1000)

                const latestTask = await db.tasks.orderBy('updatedAt').last();
                const latestJournal = await db.journals.orderBy('updatedAt').last();
                const localTime = Math.max(
                    latestTask?.updatedAt?.getTime() || 0,
                    latestJournal?.updatedAt?.getTime() || 0
                );

                if (res.timestamp > localTime + 1000) {
                    console.log('New data detected on server. Auto-downloading...');
                    await this.download();
                }
            } catch (e) {
                // Silent fail
            }
        }, 5000);
    }
}

export const syncService = SyncService.getInstance();
