import { Dashboard } from './pages/Dashboard';
import { AuthProvider } from './contexts/AuthContext';
import { SyncControls } from './components/SyncControls';

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <SyncControls />
        <Dashboard />
      </div>
    </AuthProvider>
  );
}

export default App;