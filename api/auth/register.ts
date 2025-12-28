import { VercelRequest, VercelResponse } from '@vercel/node';
import pool from '../_lib/db.js';
import { hashPassword, signToken } from '../_lib/auth-utils.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        const hashedPassword = await hashPassword(password);

        const client = await pool.connect();
        try {
            const result = await client.query(
                'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id',
                [username, hashedPassword]
            );

            const user = result.rows[0];
            const token = signToken(user.id);

            res.status(201).json({ token, user: { id: user.id, username } });
        } finally {
            client.release();
        }
    } catch (error: any) {
        console.error('Registration error:', error);
        if (error.code === '23505') { // Unique violation
            return res.status(409).json({ error: 'Username already exists' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
}
