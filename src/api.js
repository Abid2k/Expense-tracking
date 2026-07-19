import { supabase } from './lib/supabaseClient';

async function selectAll(table) {
  const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

async function insertRow(table, row) {
  const { error } = await supabase.from(table).insert(row);
  if (error) throw error;
}

async function updateRow(table, id, fields) {
  const { error } = await supabase.from(table).update(fields).eq('id', id);
  if (error) throw error;
}

async function deleteRow(table, id) {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
}

export const api = {
  getAll: async () => {
    const [expenses, goals, savings, debts, debtPayments, todos, notes, habits, habitLogs] = await Promise.all([
      selectAll('expenses'),
      selectAll('goals'),
      selectAll('savings'),
      selectAll('debts'),
      selectAll('debt_payments'),
      selectAll('todos'),
      selectAll('notes'),
      selectAll('habits'),
      selectAll('habit_logs'),
    ]);
    return { expenses, goals, savings, debts, debtPayments, todos, notes, habits, habitLogs };
  },

  addExpense: (expense) => insertRow('expenses', {
    date: expense.date,
    category: expense.category,
    amount: Number(expense.amount),
    note: expense.note || '',
  }),
  deleteExpense: (id) => deleteRow('expenses', id),

  addGoal: (goal) => insertRow('goals', {
    name: goal.name,
    type: goal.type,
    target_amount: goal.targetAmount ? Number(goal.targetAmount) : null,
    target_date: goal.targetDate || null,
    note: goal.note || '',
  }),
  updateGoal: (id, goal) => updateRow('goals', id, {
    name: goal.name,
    type: goal.type,
    target_amount: goal.targetAmount ? Number(goal.targetAmount) : null,
    target_date: goal.targetDate || null,
    note: goal.note || '',
  }),
  deleteGoal: (id) => deleteRow('goals', id), // savings cascade via FK

  addSaving: (saving) => insertRow('savings', {
    goal_id: saving.goalId,
    date: saving.date,
    amount: Number(saving.amount),
    note: saving.note || '',
  }),
  deleteSaving: (id) => deleteRow('savings', id),

  addDebt: (debt) => insertRow('debts', {
    name: debt.name,
    type: debt.type,
    amount: Number(debt.amount),
    note: debt.note || '',
    date: debt.date,
    paid: false,
  }),
  updateDebt: (id, debt) => updateRow('debts', id, {
    name: debt.name,
    type: debt.type,
    amount: Number(debt.amount),
    note: debt.note || '',
    date: debt.date,
  }),
  deleteDebt: (id) => deleteRow('debts', id), // debt_payments cascade via FK
  toggleDebtPaid: (id, paid) => updateRow('debts', id, { paid: Boolean(paid) }),
  addDebtPayment: (payment) => insertRow('debt_payments', {
    debt_id: payment.debtId,
    date: payment.date,
    amount: Number(payment.amount),
    note: payment.note || '',
  }),
  deleteDebtPayment: (id) => deleteRow('debt_payments', id),

  addTodo: (todo) => insertRow('todos', { month: todo.month, text: todo.text, done: false }),
  updateTodo: (id, done) => updateRow('todos', id, { done: Boolean(done) }),
  deleteTodo: (id) => deleteRow('todos', id),

  addNote: (note) => insertRow('notes', { date: note.date, title: note.title || '', content: note.content || '' }),
  deleteNote: (id) => deleteRow('notes', id),

  addHabit: (habit) => insertRow('habits', { name: habit.name }),
  deleteHabit: (id) => deleteRow('habits', id), // habit_logs cascade via FK
  toggleHabitLog: async (habitId, date, done) => {
    if (done) {
      const { error } = await supabase
        .from('habit_logs')
        .upsert({ habit_id: habitId, date }, { onConflict: 'habit_id,date' });
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('habit_logs')
        .delete()
        .eq('habit_id', habitId)
        .eq('date', date);
      if (error) throw error;
    }
  },
};
