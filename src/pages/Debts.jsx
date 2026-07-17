import { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { DEBT_TYPES } from '../constants';
import { formatSAR, toDateStr, todayStr } from '../utils/format';

function DebtCard({ debt, payments, isOwner, onAddPayment, onDelete }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: todayStr(), amount: '', note: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const paid = payments.reduce((sum, p) => sum + Number(p.Amount), 0);
  const amount = Number(debt.Amount);
  const remaining = Math.max(0, amount - paid);
  const pct = amount > 0 ? Math.min(100, (paid / amount) * 100) : 0;
  const isOwed = debt.Type === 'Owed to Me';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const amt = Number(form.amount);
    if (!form.date || !amt || amt <= 0) {
      setError('Please provide a date and a positive amount.');
      return;
    }
    setSaving(true);
    try {
      await onAddPayment(debt.ID, { date: form.date, amount: amt, note: form.note });
      setForm({ date: form.date, amount: '', note: '' });
      setShowForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card">
      <div className="page-header">
        <h2 style={{ margin: 0 }}>
          {debt.Name} <span className={isOwed ? 'success-text' : 'error-text'} style={{ fontSize: 13, fontWeight: 600 }}>({debt.Type})</span>
        </h2>
        {isOwner && (
          <button className="danger small" onClick={() => onDelete(debt.ID)}>Delete</button>
        )}
      </div>
      <div className="progress-bar large">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="muted">
        {formatSAR(paid)} of {formatSAR(amount)} {isOwed ? 'received' : 'paid'} ({pct.toFixed(0)}%)
        {' — '}{formatSAR(remaining)} remaining
      </p>
      {debt.Note && <p className="muted">{debt.Note}</p>}

      {isOwner && (
        <div>
          {!showForm ? (
            <button onClick={() => setShowForm(true)}>+ Add Payment</button>
          ) : (
            <form className="form-grid" onSubmit={handleSubmit} style={{ marginTop: 8 }}>
              <div>
                <label>Date</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <label>Amount (SAR)</label>
                <input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div>
                <label>Note (optional)</label>
                <input type="text" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
                <button type="button" className="secondary" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          )}
          {error && <p className="error-text">{error}</p>}
        </div>
      )}

      {payments.length > 0 && (
        <table className="table">
          <thead>
            <tr><th>Date</th><th>Note</th><th>Amount</th></tr>
          </thead>
          <tbody>
            {[...payments].sort((a, b) => (a.Date < b.Date ? 1 : -1)).map((p) => (
              <tr key={p.ID}>
                <td>{toDateStr(p.Date)}</td>
                <td>{p.Note}</td>
                <td>{formatSAR(p.Amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function Debts() {
  const { debts, debtPayments, addDebt, deleteDebt, addDebtPayment, isOwner, loading, configured } = useData();
  const [form, setForm] = useState({ name: '', type: DEBT_TYPES[0], amount: '', note: '', date: todayStr() });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const paymentsByDebt = useMemo(() => {
    const map = {};
    debtPayments.forEach((p) => {
      if (!map[p.DebtID]) map[p.DebtID] = [];
      map[p.DebtID].push(p);
    });
    return map;
  }, [debtPayments]);

  const totalOwed = debts
    .filter((d) => d.Type === 'I Owe')
    .reduce((sum, d) => {
      const paid = (paymentsByDebt[d.ID] || []).reduce((s, p) => s + Number(p.Amount), 0);
      return sum + Math.max(0, Number(d.Amount) - paid);
    }, 0);

  const totalOwedToMe = debts
    .filter((d) => d.Type === 'Owed to Me')
    .reduce((sum, d) => {
      const paid = (paymentsByDebt[d.ID] || []).reduce((s, p) => s + Number(p.Amount), 0);
      return sum + Math.max(0, Number(d.Amount) - paid);
    }, 0);

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    const amount = Number(form.amount);
    if (!form.name || !amount || amount <= 0 || !form.date) {
      setFormError('Please provide a name, date, and a positive amount.');
      return;
    }
    setSaving(true);
    try {
      await addDebt(form);
      setForm({ name: '', type: DEBT_TYPES[0], amount: '', note: '', date: todayStr() });
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!configured) {
    return (
      <div className="page">
        <h1>Debts</h1>
        <p className="muted">Connect your Google Sheet in Settings first.</p>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Debts</h1>

      <div className="summary-grid">
        <div className="card summary-card">
          <span className="summary-label">Total I Owe</span>
          <span className="summary-value error-text">{formatSAR(totalOwed)}</span>
        </div>
        <div className="card summary-card">
          <span className="summary-label">Total Owed to Me</span>
          <span className="summary-value success-text">{formatSAR(totalOwedToMe)}</span>
        </div>
      </div>

      {isOwner && (
        <form className="card" onSubmit={handleSubmit}>
          <h2>Add New Debt</h2>
          <div className="form-grid">
            <div>
              <label>Name</label>
              <input type="text" placeholder="e.g. Car Loan" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label>Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {DEBT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label>Amount (SAR)</label>
              <input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div>
              <label>Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <label>Note (optional)</label>
              <input type="text" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </div>
          </div>
          {formError && <p className="error-text">{formError}</p>}
          <button type="submit" disabled={saving}>{saving ? 'Adding…' : 'Add Debt'}</button>
        </form>
      )}

      {loading ? (
        <p className="muted">Loading…</p>
      ) : debts.length === 0 ? (
        <div className="card"><p className="muted">No debts recorded.</p></div>
      ) : (
        debts.map((debt) => (
          <DebtCard
            key={debt.ID}
            debt={debt}
            payments={paymentsByDebt[debt.ID] || []}
            isOwner={isOwner}
            onAddPayment={(debtId, payment) => addDebtPayment({ debtId, ...payment })}
            onDelete={deleteDebt}
          />
        ))
      )}
    </div>
  );
}
