import { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { useCurrency } from '../hooks/useCurrency';
import { useCurrencyFormat } from '../hooks/useCurrencyFormat';
import { CATEGORIES } from '../constants';
import { toMonthKey, toDateStr, monthLabel, currentMonthKey, todayStr } from '../utils/format';

export default function Expenses() {
  const { income, expenses, addIncome, deleteIncome, addExpense, deleteExpense, loading, configured } = useData();
  const currency = useCurrency();
  const formatCurrency = useCurrencyFormat();
  const [monthKey, setMonthKey] = useState(currentMonthKey());
  const [form, setForm] = useState({ date: todayStr(), category: CATEGORIES[0], amount: '', note: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [salaryForm, setSalaryForm] = useState({ date: todayStr(), amount: '', note: 'Salary' });
  const [savingSalary, setSavingSalary] = useState(false);
  const [salaryError, setSalaryError] = useState('');

  const months = useMemo(() => {
    const set = new Set([...expenses, ...income].map((e) => toMonthKey(e.Date)));
    set.add(currentMonthKey());
    return Array.from(set).sort().reverse();
  }, [expenses, income]);

  // A single running balance across all history, like a bank statement —
  // each transaction's balance depends on every prior one, not just the
  // ones in the currently-viewed month.
  const ledger = useMemo(() => {
    const all = [
      ...income.map((i) => ({
        kind: 'income', ID: i.ID, Date: i.Date, Label: i.Note || 'Salary', Amount: Number(i.Amount),
        linkedPage: i.DebtPaymentID ? 'Debts' : null,
      })),
      ...expenses.map((e) => ({
        kind: 'expense', ID: e.ID, Date: e.Date, Label: e.Category, Note: e.Note, Amount: -Number(e.Amount),
        linkedPage: e.SavingID ? 'Savings' : e.DebtPaymentID ? 'Debts' : null,
      })),
    ].sort((a, b) => (a.Date < b.Date ? -1 : a.Date > b.Date ? 1 : 0));

    let balance = 0;
    return all.map((t) => {
      balance += t.Amount;
      return { ...t, balance };
    });
  }, [income, expenses]);

  const currentBalance = ledger.length ? ledger[ledger.length - 1].balance : 0;

  const monthLedger = useMemo(
    () => ledger.filter((t) => toMonthKey(t.Date) === monthKey).slice().reverse(),
    [ledger, monthKey]
  );

  const monthExpenses = useMemo(
    () =>
      expenses
        .filter((e) => toMonthKey(e.Date) === monthKey)
        .sort((a, b) => (a.Date < b.Date ? 1 : -1)),
    [expenses, monthKey]
  );

  const monthTotal = monthExpenses.reduce((sum, e) => sum + Number(e.Amount), 0);
  const monthIncomeTotal = income
    .filter((i) => toMonthKey(i.Date) === monthKey)
    .reduce((sum, i) => sum + Number(i.Amount), 0);

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

  async function handleSalarySubmit(e) {
    e.preventDefault();
    setSalaryError('');
    const amount = Number(salaryForm.amount);
    if (!salaryForm.date || !amount || amount <= 0) {
      setSalaryError('Please fill in date and a positive amount.');
      return;
    }
    setSavingSalary(true);
    try {
      await addIncome({ date: salaryForm.date, amount, note: salaryForm.note });
      setSalaryForm({ date: salaryForm.date, amount: '', note: 'Salary' });
    } catch (err) {
      setSalaryError(err.message);
    } finally {
      setSavingSalary(false);
    }
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

      <div className="card summary-card">
        <span className="summary-label">Balance</span>
        <span className="summary-value">{formatCurrency(currentBalance)}</span>
      </div>

      <form className="card" onSubmit={handleSalarySubmit}>
        <h2>Add Salary / Income</h2>
        <div className="form-grid">
          <div>
            <label htmlFor="inc-date">Date</label>
            <input
              id="inc-date"
              type="date"
              value={salaryForm.date}
              onChange={(e) => setSalaryForm({ ...salaryForm, date: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="inc-amount">Amount ({currency})</label>
            <input
              id="inc-amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={salaryForm.amount}
              onChange={(e) => setSalaryForm({ ...salaryForm, amount: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="inc-note">Note (optional)</label>
            <input
              id="inc-note"
              type="text"
              placeholder="e.g. Salary"
              value={salaryForm.note}
              onChange={(e) => setSalaryForm({ ...salaryForm, note: e.target.value })}
            />
          </div>
        </div>
        {salaryError && <p className="error-text">{salaryError}</p>}
        <button type="submit" disabled={savingSalary}>{savingSalary ? 'Adding…' : 'Add Income'}</button>
      </form>

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
            <label htmlFor="exp-amount">Amount ({currency})</label>
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
        <p className="muted">
          Income: <strong>{formatCurrency(monthIncomeTotal)}</strong>
          {' · '}Spent: <strong>{formatCurrency(monthTotal)}</strong>
        </p>

        {loading ? (
          <p className="muted loading-pulse">Loading…</p>
        ) : monthLedger.length === 0 ? (
          <p className="muted">No transactions for this month.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category / Note</th>
                <th>Amount</th>
                <th>Balance</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {monthLedger.map((t) => (
                <tr key={`${t.kind}-${t.ID}`}>
                  <td data-label="Date">{toDateStr(t.Date)}</td>
                  <td data-label="Category / Note">{t.kind === 'income' ? t.Label : `${t.Label}${t.Note ? ` — ${t.Note}` : ''}`}</td>
                  <td data-label="Amount" className={t.kind === 'income' ? 'success-text' : 'error-text'}>
                    {t.kind === 'income' ? '+' : '-'}{formatCurrency(Math.abs(t.Amount))}
                  </td>
                  <td data-label="Balance">{formatCurrency(t.balance)}</td>
                  <td data-label="">
                    {t.linkedPage ? (
                      <span className="muted" style={{ fontSize: 12 }}>Manage on {t.linkedPage}</span>
                    ) : (
                      <button
                        className="danger small"
                        onClick={() => (t.kind === 'income' ? deleteIncome(t.ID) : handleDelete(t.ID))}
                      >
                        Delete
                      </button>
                    )}
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
