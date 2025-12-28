import { VercelRequest, VercelResponse } from '@vercel/node';
import pool from '../_lib/db.js';
import { comparePassword, signToken } from '../_lib/auth-utils.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        const client = await pool.connect();
        try {
            const result = await client.query(
                'SELECT id, username, password_hash FROM users WHERE username = $1',
                [username]
            );

            const user = result.rows[0];

            if (!user || !(await comparePassword(password, user.password_hash))) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const token = signToken(user.id);

            res.status(200).json({ token, user: { id: user.id, username: user.username } });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
