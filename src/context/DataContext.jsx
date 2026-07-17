import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, getScriptUrl } from '../api';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [expenses, setExpenses] = useState([]);
  const [savings, setSavings] = useState([]);
  const [settings, setSettings] = useState({ GoalName: 'My Savings Goal', GoalAmount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [configured, setConfigured] = useState(Boolean(getScriptUrl()));

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
      setExpenses(data.expenses || []);
      setSavings(data.savings || []);
      setSettings(data.settings || {});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addExpense = useCallback(async (expense) => {
    await api.addExpense(expense);
    await refresh();
  }, [refresh]);

  const deleteExpense = useCallback(async (id) => {
    await api.deleteExpense(id);
    await refresh();
  }, [refresh]);

  const addSaving = useCallback(async (saving) => {
    await api.addSaving(saving);
    await refresh();
  }, [refresh]);

  const deleteSaving = useCallback(async (id) => {
    await api.deleteSaving(id);
    await refresh();
  }, [refresh]);

  const setGoal = useCallback(async (goal) => {
    await api.setGoal(goal);
    await refresh();
  }, [refresh]);

  const value = {
    expenses,
    savings,
    settings,
    loading,
    error,
    configured,
    refresh,
    addExpense,
    deleteExpense,
    addSaving,
    deleteSaving,
    setGoal,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
