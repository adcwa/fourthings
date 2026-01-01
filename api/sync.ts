import { VercelRequest, VercelResponse } from '@vercel/node';
import pool from './_lib/db.js';
import { verifyToken } from './_lib/auth-utils.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Disable caching for dynamic user data
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = decoded.userId;

    if (req.method === 'GET') {
        const checkMode = req.query.check === 'true';

        if (checkMode) {
            const client = await pool.connect();
            try {
                // Check latest update time for user
                const taskRes = await client.query('SELECT MAX(updated_at) as t FROM tasks WHERE user_id = $1', [userId]);
                const journalRes = await client.query('SELECT MAX(updated_at) as t FROM journals WHERE user_id = $1', [userId]);

                const t1 = taskRes.rows[0]?.t ? new Date(taskRes.rows[0].t).getTime() : 0;
                const t2 = journalRes.rows[0]?.t ? new Date(journalRes.rows[0].t).getTime() : 0;

                res.status(200).json({ timestamp: Math.max(t1, t2) });
                return;
            } catch (e) {
                res.status(200).json({ timestamp: 0 });
                return;
            } finally {
                client.release();
            }
        }

        // Download data
        try {
            const client = await pool.connect();
            try {
                const tasksRes = await client.query('SELECT *, date::text as date FROM tasks WHERE user_id = $1', [userId]);
                const journalsRes = await client.query('SELECT *, date::text as date FROM journals WHERE user_id = $1', [userId]);

                const tasks = tasksRes.rows.map(row => ({
                    id: row.id,
                    userId: row.user_id,
                    title: row.title,
                    description: row.description,
                    quadrant: row.quadrant,
                    date: row.date,
                    completed: row.completed,
                    createdAt: row.created_at,
                    updatedAt: row.updated_at,
                    order: row.order,
                    status: row.status,
                    priority: row.priority,
                    dueDate: row.due_date,
                    tags: row.tags,
                    subtasks: row.subtasks,
                    progress: row.progress,
                    version: row.version || 1
                }));

                const journals = journalsRes.rows.map(row => ({
                    id: row.id,
                    userId: row.user_id,
                    content: row.content,
                    date: row.date,
                    createdAt: row.created_at,
                    updatedAt: row.updated_at,
                    tags: row.tags,
                    version: row.version || 1
                }));

                res.status(200).json({ tasks, journals });
            } finally {
                client.release();
            }
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    } else if (req.method === 'POST') {
        const { tasks, journals } = req.body;

        if (!Array.isArray(tasks) || !Array.isArray(journals)) {
            return res.status(400).json({ error: 'Invalid data format' });
        }

        try {
            const client = await pool.connect();
            try {
                await client.query('BEGIN');

                // 1. Process Tasks using UPSERT with versioning
                for (const task of tasks) {
                    await client.query(
                        `INSERT INTO tasks (
                            id, user_id, title, description, quadrant, date, completed, created_at, updated_at, "order",
                            status, priority, due_date, tags, subtasks, progress, version
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
                        ON CONFLICT (id) DO UPDATE SET
                            title = EXCLUDED.title,
                            description = EXCLUDED.description,
                            quadrant = EXCLUDED.quadrant,
                            date = EXCLUDED.date,
                            completed = EXCLUDED.completed,
                            updated_at = EXCLUDED.updated_at,
                            "order" = EXCLUDED."order",
                            status = EXCLUDED.status,
                            priority = EXCLUDED.priority,
                            due_date = EXCLUDED.due_date,
                            tags = EXCLUDED.tags,
                            subtasks = EXCLUDED.subtasks,
                            progress = EXCLUDED.progress,
                            version = EXCLUDED.version
                        WHERE 
                            EXCLUDED.version > tasks.version OR 
                            (EXCLUDED.version = tasks.version AND EXCLUDED.updated_at > tasks.updated_at)`,
                        [
                            task.id, userId, task.title, task.description, task.quadrant, task.date, task.completed, task.createdAt, task.updatedAt, task.order,
                            task.status || 'todo', task.priority || 'medium', task.dueDate || null,
                            JSON.stringify(task.tags || []), JSON.stringify(task.subtasks || []), task.progress || 0,
                            task.version || 1
                        ]
                    );
                }

                // 2. Process Journals using UPSERT with versioning
                for (const journal of journals) {
                    await client.query(
                        `INSERT INTO journals (id, user_id, content, date, created_at, updated_at, tags, version)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                         ON CONFLICT (id) DO UPDATE SET
                            content = EXCLUDED.content,
                            date = EXCLUDED.date,
                            updated_at = EXCLUDED.updated_at,
                            tags = EXCLUDED.tags,
                            version = EXCLUDED.version
                         WHERE 
                            EXCLUDED.version > journals.version OR 
                            (EXCLUDED.version = journals.version AND EXCLUDED.updated_at > journals.updated_at)`,
                        [
                            journal.id, userId, journal.content, journal.date, journal.createdAt, journal.updatedAt,
                            JSON.stringify(journal.tags || []), journal.version || 1
                        ]
                    );
                }

                await client.query('COMMIT');
                res.status(200).json({ success: true });
            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }
        } catch (error: any) {
            console.error('Sync POST error:', error);
            res.status(500).json({ error: error.message });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}
