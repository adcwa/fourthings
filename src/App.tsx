import { useState } from 'react';
import { Dashboard } from './pages/Dashboard';
import { AuthProvider } from './contexts/AuthContext';
import { SyncControls } from './components/SyncControls';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'incomplete'>('all');

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Global Header */}
        <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-gray-200 z-50 h-16 px-4">
          <div className="container mx-auto h-full flex items-center justify-between gap-4">

            {/* Left: Search Bar + Filter Toggle */}
            <div className="flex items-center gap-4 flex-1">
              {/* Search Bar */}
              <div className="relative w-full max-w-xs md:max-w-sm">
                <input
                  type="text"
                  placeholder="搜索任务..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 bg-gray-50 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Filter Toggle */}
              <div className="flex bg-gray-100 p-1 rounded-lg h-10 items-center hidden md:flex shrink-0">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`h-8 px-4 text-sm font-medium rounded-md transition-all flex items-center ${statusFilter === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  全部
                </button>
                <button
                  onClick={() => setStatusFilter('incomplete')}
                  className={`h-8 px-4 text-sm font-medium rounded-md transition-all flex items-center ${statusFilter === 'incomplete' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  未完成
                </button>
                <button
                  onClick={() => setStatusFilter('completed')}
                  className={`h-8 px-4 text-sm font-medium rounded-md transition-all flex items-center ${statusFilter === 'completed' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  已完成
                </button>
              </div>
            </div>

            {/* Right: Sync Controls */}
            <div className="flex items-center justify-end shrink-0">
              <SyncControls />
            </div>
          </div>
        </header>

        <main className="pt-12">
          <Dashboard statusFilter={statusFilter} searchQuery={searchQuery} />
        </main>
      </div>
    </AuthProvider>
  );
}

export default App;