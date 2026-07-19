import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, getScriptUrl, getRole, setSession, clearSession } from '../api';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [expenses, setExpenses] = useState([]);
  const [savings, setSavings] = useState([]);
  const [goals, setGoals] = useState([]);
  const [debts, setDebts] = useState([]);
  const [debtPayments, setDebtPayments] = useState([]);
  const [todos, setTodos] = useState([]);
  const [notes, setNotes] = useState([]);
  const [habits, setHabits] = useState([]);
  const [habitLogs, setHabitLogs] = useState([]);
  const [settings, setSettings] = useState({});
  const [role, setRole] = useState(getRole());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [configured, setConfigured] = useState(Boolean(getScriptUrl()));
  const [locked, setLocked] = useState(false);

  const applyData = (data) => {
    setExpenses(data.expenses || []);
    setSavings(data.savings || []);
    setGoals(data.goals || []);
    setDebts(data.debts || []);
    setDebtPayments(data.debtPayments || []);
    setTodos(data.todos || []);
    setNotes(data.notes || []);
    setHabits(data.habits || []);
    setHabitLogs(data.habitLogs || []);
    setSettings(data.settings || {});
    setRole(data.role || '');
  };

  const refresh = useCallback(async () => {
    if (!getScriptUrl()) {
      setConfigured(false);
      setLoading(false);
      return;
    }
    setConfigured(true);
    setLoading(true);
    setError('');
    try {
      const data = await api.getAll();
      applyData(data);
      setLocked(false);
    } catch (err) {
      if (err instanceof api.AuthError) {
        clearSession();
        setLocked(true);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const unlock = useCallback(async (pin) => {
    const data = await api.verifyPin(pin);
    setSession(pin, data.role);
    applyData(data);
    setLocked(false);
    setConfigured(true);
    return data.role;
  }, []);

  const lock = useCallback(() => {
    clearSession();
    setLocked(true);
  }, []);

  function wrap(fn) {
    return async (...args) => {
      await fn(...args);
      await refresh();
    };
  }

  const value = {
    expenses,
    savings,
    goals,
    debts,
    debtPayments,
    todos,
    notes,
    habits,
    habitLogs,
    settings,
    role,
    isOwner: role === 'owner',
    loading,
    error,
    configured,
    locked,
    refresh,
    unlock,
    lock,

    addExpense: wrap(api.addExpense),
    deleteExpense: wrap(api.deleteExpense),

    addGoal: wrap(api.addGoal),
    updateGoal: wrap(api.updateGoal),
    deleteGoal: wrap(api.deleteGoal),
    addSaving: wrap(api.addSaving),
    deleteSaving: wrap(api.deleteSaving),

    setPins: wrap(api.setPins),

    addDebt: wrap(api.addDebt),
    updateDebt: wrap(api.updateDebt),
    deleteDebt: wrap(api.deleteDebt),
    toggleDebtPaid: wrap(api.toggleDebtPaid),
    addDebtPayment: wrap(api.addDebtPayment),
    deleteDebtPayment: wrap(api.deleteDebtPayment),

    addTodo: wrap(api.addTodo),
    updateTodo: wrap(api.updateTodo),
    deleteTodo: wrap(api.deleteTodo),

    addNote: wrap(api.addNote),
    deleteNote: wrap(api.deleteNote),

    addHabit: wrap(api.addHabit),
    deleteHabit: wrap(api.deleteHabit),
    toggleHabitLog: wrap(api.toggleHabitLog),
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
