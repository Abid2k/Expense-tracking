import { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { CATEGORIES } from '../constants';
import { formatSAR, toMonthKey, toDateStr, monthLabel, currentMonthKey, todayStr } from '../utils/format';

export default function Expenses() {
  const { expenses, addExpense, deleteExpense, loading, configured } = useData();
  const [monthKey, setMonthKey] = useState(currentMonthKey());
  const [form, setForm] = useState({ date: todayStr(), category: CATEGORIES[0], amount: '', note: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const months = useMemo(() => {
    const set = new Set(expenses.map((e) => toMonthKey(e.Date)));
    set.add(currentMonthKey());
    return Array.from(set).sort().reverse();
  }, [expenses]);

  const monthExpenses = useMemo(
    () =>
      expenses
        .filter((e) => toMonthKey(e.Date) === monthKey)
        .sort((a, b) => (a.Date < b.Date ? 1 : -1)),
    [expenses, monthKey]
  );

  const monthTotal = monthExpenses.reduce((sum, e) => sum + Number(e.Amount), 0);

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    const amount = Number(form.amount);
    if (!form.date || !form.category || !amount || amount <= 0) {
      setFormError('Please fill in date, category, and a positive amount.');
      return;
    }
    setSaving(true);
    try {
      await addExpense({ date: form.date, category: form.category, amount, note: form.note });
      setForm({ date: form.date, category: CATEGORIES[0], amount: '', note: '' });
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    await deleteExpense(id);
  }

  if (!configured) {
    return (
      <div className="page">
        <h1>Expenses</h1>
        <p className="muted">Connect your Google Sheet in Settings first.</p>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Expenses</h1>

      <form className="card" onSubmit={handleSubmit}>
        <h2>Add Expense</h2>
        <div className="form-grid">
          <div>
            <label htmlFor="exp-date">Date</label>
            <input
              id="exp-date"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="exp-category">Category</label>
            <select
              id="exp-category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="exp-amount">Amount (SAR)</label>
            <input
              id="exp-amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="exp-note">Note (optional)</label>
            <input
              id="exp-note"
              type="text"
              placeholder="e.g. groceries"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </div>
        </div>
        {formError && <p className="error-text">{formError}</p>}
        <button type="submit" disabled={saving}>{saving ? 'Adding…' : 'Add Expense'}</button>
      </form>

      <div className="card">
        <div className="page-header">
          <h2>History</h2>
          <select value={monthKey} onChange={(e) => setMonthKey(e.target.value)}>
            {months.map((m) => (
              <option key={m} value={m}>{monthLabel(m)}</option>
            ))}
          </select>
        </div>
        <p className="muted">Total for {monthLabel(monthKey)}: <strong>{formatSAR(monthTotal)}</strong></p>

        {loading ? (
          <p className="muted loading-pulse">Loading…</p>
        ) : monthExpenses.length === 0 ? (
          <p className="muted">No expenses for this month.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Note</th>
                <th>Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {monthExpenses.map((e) => (
                <tr key={e.ID}>
                  <td data-label="Date">{toDateStr(e.Date)}</td>
                  <td data-label="Category">{e.Category}</td>
                  <td data-label="Note">{e.Note}</td>
                  <td data-label="Amount">{formatSAR(e.Amount)}</td>
                  <td data-label="">
                    <button className="danger small" onClick={() => handleDelete(e.ID)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
