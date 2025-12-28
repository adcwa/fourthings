import React, { createContext, useContext, useState, useEffect } from 'react';
interface User {
    id: string;
    username: string;
}

interface AuthContextType {
    user: User | null;
    login: (token: string, user: User) => void;
    logout: (clearData?: boolean) => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        // Restore user from localStorage if basic details were stored (optional refinement)
        // For now, we rely on token presence. Real app would /me to fetch user.
        // For MVP, we will store user info in localStorage too to keep it simple across refreshes
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const login = (token: string, userData: User) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);

        // Auto download on login
        // But first, migrate any "Guest" (test-user) data to the new user so it doesn't get lost/hidden
        import('../services/SyncService').then(async ({ syncService }) => {
            try {
                const { db } = await import('../services/db');
                await db.transaction('rw', db.tasks, db.journals, async () => {
                    // Migrate 'test-user' tasks to real user
                    // Mark as 'created' so they get uploaded to cloud
                    await db.tasks.where({ userId: 'test-user' }).modify({
                        userId: userData.id,
                        syncStatus: 'created'
                    });

                    await db.journals.where({ userId: 'test-user' }).modify({
                        userId: userData.id,
                        syncStatus: 'created'
                    });
                });
                console.log('Migrated guest data to user:', userData.id);
            } catch (e) {
                console.error('Failed to migrate guest data', e);
            }

            syncService.initialSync();
        });
    };

    const logout = async (clearData: boolean = false) => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Also clear 'syncMode' to reset to default behavior or keep it? 
        // If we keep data, we probably want to stay in 'offline' mode initially until re-login?
        // But for security, maybe clear everything related to auth. 
        // User requested "If not clear, retain...". 

        setUser(null);

        if (clearData) {
            // Clear local DB to prevent data leakage between users
            try {
                const { db } = await import('../services/db');
                await db.tasks.clear();
                await db.journals.clear();
            } catch (e) {
                console.error('Failed to clear local DB', e);
            }
        } else {
            // Keep data: Transfer ownership to 'test-user' (Guest) so they are visible
            // This effectively "converts" cloud tasks to local offline tasks
            try {
                const { db } = await import('../services/db');
                await db.transaction('rw', db.tasks, db.journals, async () => {
                    await db.tasks.toCollection().modify({ userId: 'test-user', syncStatus: 'created' });
                    // Mark as 'created' so they sync up if we log in again as a DIFFERENT user? 
                    // Or if we log in as SAME user, we might get duplicates if we don't watch out.
                    // But for "Offline Mode", they should be treated as local drafts.
                    // Let's set syncStatus to 'created' to be safe, so they are pushed if we sync later.

                    await db.journals.toCollection().modify({ userId: 'test-user', syncStatus: 'created' });
                });
            } catch (e) {
                console.error('Failed to transfer local DB ownership', e);
            }
        }

        window.location.reload();
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
