import { HashRouter, Routes, Route } from 'react-router-dom';
import { DataProvider, useData } from './context/DataContext';
import NavBar from './components/NavBar';
import LockScreen from './components/LockScreen';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Savings from './pages/Savings';
import Debts from './pages/Debts';
import Todos from './pages/Todos';
import Notes from './pages/Notes';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import './App.css';

function AppShell() {
  const { locked } = useData();

  if (locked) {
    return <LockScreen />;
  }

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
          <Route path="/notes" element={<Notes />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </>
  );
}

export default function App() {
  return (
    <HashRouter>
      <DataProvider>
        <AppShell />
      </DataProvider>
    </HashRouter>
  );
}
