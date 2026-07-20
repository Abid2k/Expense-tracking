import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import NavBar from './components/NavBar';
import LockScreen from './components/LockScreen';
import ProfileSetup from './components/ProfileSetup';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Savings from './pages/Savings';
import Debts from './pages/Debts';
import Todos from './pages/Todos';
import Habits from './pages/Habits';
import Notes from './pages/Notes';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import './App.css';

function AppShell() {
  return (
    <>
      <NavBar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/savings" element={<Savings />} />
          <Route path="/debts" element={<Debts />} />
          <Route path="/todos" element={<Todos />} />
          <Route path="/habits" element={<Habits />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </>
  );
}

function Gate() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="page">
        <p className="muted loading-pulse">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return <LockScreen />;
  }

  if (!user.user_metadata?.display_name) {
    return <ProfileSetup />;
  }

  return (
    <DataProvider>
      <AppShell />
    </DataProvider>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </HashRouter>
  );
}
