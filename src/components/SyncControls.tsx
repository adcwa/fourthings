import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { syncService } from '../services/SyncService';

export function SyncControls() {
    const { user, login, logout, isAuthenticated } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');

    useEffect(() => {
        // Subscribe to sync status
        const unsubscribe = syncService.subscribe((s) => setStatus(s));
        return unsubscribe;
    }, []);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
            const res = await api.post<{ token: string; user: { id: string; username: string } }>(endpoint, {
                username,
                password
            });
            login(res.token, res.user);
            setIsModalOpen(false);
            setUsername('');
            setPassword('');
            // Auto-sync is handled in AuthContext
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const [syncMode, setSyncMode] = useState<'offline' | 'cloud'>(syncService.getMode());

    useEffect(() => {
        // Watch mode changes from other tabs/places
        const interval = setInterval(() => {
            const current = syncService.getMode();
            if (current !== syncMode) setSyncMode(current);
        }, 1000);
        return () => clearInterval(interval);
    }, [syncMode]);

    const toggleMode = () => {
        const newMode = syncMode === 'offline' ? 'cloud' : 'offline';
        setSyncMode(newMode);
        syncService.setMode(newMode);
    };

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            const shouldClear = window.confirm('Do you want to clear local data?\n\nClick OK to Clear Data.\nClick Cancel to Keep Data (Offline Mode).');
            logout(shouldClear);
        }
    };

    if (isAuthenticated) {
        return (
            <div className="flex items-center gap-2">
                <div
                    onClick={toggleMode}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer transition-colors ${syncMode === 'cloud' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                    title={`Click to switch to ${syncMode === 'cloud' ? 'Offline' : 'Cloud'} Mode`}
                >
                    <div className={`w-2 h-2 rounded-full ${syncMode === 'cloud' ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <span className="text-xs font-medium uppercase tracking-wider">{syncMode}</span>
                </div>

                <div className="h-6 w-px bg-gray-200 mx-1"></div>

                <div className="flex flex-col items-end mr-2">
                    <span className="text-xs font-medium text-gray-400">
                        {user?.username}
                    </span>
                    {status && (
                        <span className={`text-[10px] ${status.includes('Failed') ? 'text-red-500' : 'text-blue-500'} animate-pulse`}>
                            {status}
                        </span>
                    )}
                </div>

                {syncMode === 'cloud' && (
                    <>
                        <button
                            onClick={() => syncService.upload()}
                            title="Force Upload"
                            className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-md transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        </button>

                        <button
                            onClick={() => {
                                if (confirm('Overwite local data?')) {
                                    syncService.download();
                                }
                            }}
                            title="Force Download"
                            className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-md transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                            </svg>
                        </button>
                    </>
                )}

                <button
                    onClick={handleLogout}
                    title="Logout"
                    className="p-2 bg-white border border-gray-200 hover:bg-red-50 text-gray-600 hover:text-red-500 rounded-lg transition-colors shadow-sm"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                </button>
            </div>
        );
    }

    return (
        <>
            <div className="">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 shadow-sm transition-all flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>

                </button>
            </div>

            {isModalOpen && ReactDOM.createPortal(
                <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center z-[100]">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl w-80 transform transition-all scale-100">
                        <h2 className="text-lg font-bold mb-4 dark:text-white flex justify-between items-center">
                            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                        </h2>
                        <form onSubmit={handleAuth} className="space-y-3">
                            <div>
                                <input
                                    type="text"
                                    placeholder="Username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    required
                                />
                            </div>
                            <div>
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    required
                                />
                            </div>
                            {error && <div className="text-red-500 text-xs bg-red-50 p-2 rounded">{error}</div>}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors shadow-sm shadow-blue-200"
                            >
                                {loading ? 'Processing...' : mode === 'login' ? 'Login' : 'Sign Up'}
                            </button>
                        </form>
                        <div className="mt-4 text-center">
                            <button
                                type="button"
                                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                                className="text-xs text-gray-500 hover:text-blue-600 transition-colors"
                            >
                                {mode === 'login' ? 'New here? Create an account' : 'Already have an account? Login'}
                            </button>
                        </div>
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
