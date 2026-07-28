import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from './AuthContext';

const DataContext = createContext(null);

// Supabase rows are snake_case; every page component reads the PascalCase
// shape the old Google Sheets API used to return, so map here once instead
// of touching every page.
const mapIncome = (r) => ({ ID: r.id, Date: r.date, Amount: r.amount, Note: r.note, DebtPaymentID: r.debt_payment_id });
const mapExpense = (r) => ({ ID: r.id, Date: r.date, Category: r.category, Amount: r.amount, Note: r.note, DebtPaymentID: r.debt_payment_id, SavingID: r.saving_id });
const mapGoal = (r) => ({ ID: r.id, Name: r.name, Type: r.type, TargetAmount: r.target_amount, TargetDate: r.target_date, Note: r.note });
const mapSaving = (r) => ({ ID: r.id, GoalID: r.goal_id, Date: r.date, Amount: r.amount, Note: r.note });
const mapDebt = (r) => ({ ID: r.id, Name: r.name, Type: r.type, Amount: r.amount, Note: r.note, Date: r.date, Paid: r.paid });
const mapDebtPayment = (r) => ({ ID: r.id, DebtID: r.debt_id, Date: r.date, Amount: r.amount, Note: r.note });
const mapTodo = (r) => ({ ID: r.id, Month: r.month, Text: r.text, Done: r.done });
const mapNote = (r) => ({ ID: r.id, Date: r.date, Title: r.title, Content: r.content });
const mapHabit = (r) => ({ ID: r.id, Name: r.name });
const mapHabitLog = (r) => ({ ID: r.id, HabitID: r.habit_id, Date: r.date });

export function DataProvider({ children }) {
  const { user } = useAuth();
  const [income, setIncome] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [savings, setSavings] = useState([]);
  const [goals, setGoals] = useState([]);
  const [debts, setDebts] = useState([]);
  const [debtPayments, setDebtPayments] = useState([]);
  const [todos, setTodos] = useState([]);
  const [notes, setNotes] = useState([]);
  const [habits, setHabits] = useState([]);
  const [habitLogs, setHabitLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getAll();
      setIncome(data.income.map(mapIncome));
      setExpenses(data.expenses.map(mapExpense));
      setGoals(data.goals.map(mapGoal));
      setSavings(data.savings.map(mapSaving));
      setDebts(data.debts.map(mapDebt));
      setDebtPayments(data.debtPayments.map(mapDebtPayment));
      setTodos(data.todos.map(mapTodo));
      setNotes(data.notes.map(mapNote));
      setHabits(data.habits.map(mapHabit));
      setHabitLogs(data.habitLogs.map(mapHabitLog));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) refresh();
  }, [user, refresh]);

  function wrap(fn) {
    return async (...args) => {
      await fn(...args);
      await refresh();
    };
  }

  const value = {
    income,
    expenses,
    savings,
    goals,
    debts,
    debtPayments,
    todos,
    notes,
    habits,
    habitLogs,
    isOwner: true, // no viewer role in the multi-user model — every account owns its own data
    configured: true, // no "connect your sheet" step anymore — sign-in is the gate
    loading,
    error,
    refresh,

    addIncome: wrap(api.addIncome),
    deleteIncome: wrap(api.deleteIncome),

    addExpense: wrap(api.addExpense),
    deleteExpense: wrap(api.deleteExpense),

    addGoal: wrap(api.addGoal),
    updateGoal: wrap(api.updateGoal),
    deleteGoal: wrap(api.deleteGoal),
    addSaving: wrap(api.addSaving),
    deleteSaving: wrap(api.deleteSaving),

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
