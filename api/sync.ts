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
                // If check fails, just return 0
                res.status(200).json({ timestamp: 0 });
                return;
            } finally {
                client.release();
            }
        }

        // Download data
        // Download data
        try {
            console.log(`[Sync GET] Fetching data for user: ${userId}`);
            const client = await pool.connect();
            try {
                // Use simple SELECT * to avoid SQL syntax issues
                const tasksRes = await client.query('SELECT * FROM tasks WHERE user_id = $1', [userId]);
                const journalsRes = await client.query('SELECT * FROM journals WHERE user_id = $1', [userId]);

                console.log(`[Sync GET] Found ${tasksRes.rows.length} tasks, ${journalsRes.rows.length} journals`);

                // Map to camelCase manually
                const tasks = tasksRes.rows.map(row => ({
                    id: row.id,
                    userId: row.user_id,
                    title: row.title,
                    description: row.description,
                    quadrant: row.quadrant,
                    date: row.date, // PG Date object
                    completed: row.completed,
                    createdAt: row.created_at,
                    updatedAt: row.updated_at,
                    order: row.order
                }));

                const journals = journalsRes.rows.map(row => ({
                    id: row.id,
                    userId: row.user_id,
                    content: row.content,
                    date: row.date,
                    createdAt: row.created_at,
                    updatedAt: row.updated_at
                }));

                res.status(200).json({
                    tasks,
                    journals,
                    debug_info: {
                        task_count: tasks.length,
                        journal_count: journals.length
                    }
                });
            } finally {
                client.release();
            }
        } catch (error: any) {
            console.error('[Sync GET] Error:', error);
            res.status(500).json({ error: error.message, stack: error.stack });
        }
    } else if (req.method === 'POST') {
        // Incremental Sync (Upsert + Delete)
        const { tasks, journals, deletedTaskIds, deletedJournalIds } = req.body;

        try {
            const client = await pool.connect();
            try {
                await client.query('BEGIN');

                // 1. Handle Deletions
                if (Array.isArray(deletedTaskIds) && deletedTaskIds.length > 0) {
                    await client.query(
                        'DELETE FROM tasks WHERE user_id = $1 AND id = ANY($2)',
                        [userId, deletedTaskIds]
                    );
                }
                if (Array.isArray(deletedJournalIds) && deletedJournalIds.length > 0) {
                    await client.query(
                        'DELETE FROM journals WHERE user_id = $1 AND id = ANY($2)',
                        [userId, deletedJournalIds]
                    );
                }

                // 2. Handle Upserts (Tasks)
                if (Array.isArray(tasks)) {
                    for (const task of tasks) {
                        await client.query(
                            `INSERT INTO tasks (id, user_id, title, description, quadrant, date, completed, created_at, updated_at, "order")
                             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                             ON CONFLICT (id) DO UPDATE SET
                                title = EXCLUDED.title,
                                description = EXCLUDED.description,
                                quadrant = EXCLUDED.quadrant,
                                date = EXCLUDED.date,
                                completed = EXCLUDED.completed,
                                updated_at = EXCLUDED.updated_at,
                                "order" = EXCLUDED."order"
                             WHERE tasks.user_id = $2`, // Security check: ensure we only update user's own tasks (though ID uniqness usually handles it)
                            [task.id, userId, task.title, task.description, task.quadrant, task.date, task.completed, task.createdAt, task.updatedAt, task.order]
                        );
                    }
                }

                // 3. Handle Upserts (Journals)
                if (Array.isArray(journals)) {
                    for (const journal of journals) {
                        await client.query(
                            `INSERT INTO journals (id, user_id, content, date, created_at, updated_at)
                             VALUES ($1, $2, $3, $4, $5, $6)
                             ON CONFLICT (id) DO UPDATE SET
                                content = EXCLUDED.content,
                                date = EXCLUDED.date,
                                updated_at = EXCLUDED.updated_at
                             WHERE journals.user_id = $2`,
                            [journal.id, userId, journal.content, journal.date, journal.createdAt, journal.updatedAt]
                        );
                    }
                }

                await client.query('COMMIT');
                res.status(200).json({ success: true, message: 'Sync successful' });
            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Sync POST error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}
