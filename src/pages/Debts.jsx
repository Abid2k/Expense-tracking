import { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { useCurrency } from '../hooks/useCurrency';
import { useCurrencyFormat } from '../hooks/useCurrencyFormat';
import { DEBT_TYPES } from '../constants';
import { toDateStr, todayStr } from '../utils/format';

function isDebtPaid(debt) {
  return debt.Paid === true || debt.Paid === 'TRUE';
}

function debtRemaining(debt, payments) {
  if (isDebtPaid(debt)) return 0;
  const paid = payments.reduce((sum, p) => sum + Number(p.Amount), 0);
  return Math.max(0, Number(debt.Amount) - paid);
}

function DebtCard({ debt, payments, isOwner, currency, formatCurrency, onAddPayment, onDelete, onTogglePaid, onUpdate }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: todayStr(), amount: '', note: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const paidFlag = isDebtPaid(debt);
  const amount = Number(debt.Amount);
  const paidAmount = paidFlag ? amount : payments.reduce((sum, p) => sum + Number(p.Amount), 0);
  const remaining = Math.max(0, amount - paidAmount);
  const pct = paidFlag ? 100 : amount > 0 ? Math.min(100, (paidAmount / amount) * 100) : 0;
  const isOwed = debt.Type === 'Owed to Me';

  function startEdit() {
    setEditForm({ name: debt.Name, type: debt.Type, amount: debt.Amount, note: debt.Note || '', date: toDateStr(debt.Date) });
    setEditError('');
    setEditing(true);
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    setEditError('');
    const amt = Number(editForm.amount);
    if (!editForm.name || !amt || amt <= 0 || !editForm.date) {
      setEditError('Please provide a name, date, and a positive amount.');
      return;
    }
    setEditSaving(true);
    try {
      await onUpdate(debt.ID, editForm);
      setEditing(false);
    } catch (err) {
      setEditError(err.message);
    } finally {
      setEditSaving(false);
    }
  }

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

  if (editing) {
    return (
      <form className="card" onSubmit={handleEditSubmit}>
        <h2>Edit Debt</h2>
        <div className="form-grid">
          <div>
            <label>Name</label>
            <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
          </div>
          <div>
            <label>Type</label>
            <select value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}>
              {DEBT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label>Amount ({currency})</label>
            <input type="number" step="0.01" min="0" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} />
          </div>
          <div>
            <label>Date</label>
            <input type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} />
          </div>
          <div>
            <label>Note (optional)</label>
            <input type="text" value={editForm.note} onChange={(e) => setEditForm({ ...editForm, note: e.target.value })} />
          </div>
        </div>
        {editError && <p className="error-text">{editError}</p>}
        <div className="button-row">
          <button type="submit" disabled={editSaving}>{editSaving ? 'Saving…' : 'Save Changes'}</button>
          <button type="button" className="secondary" onClick={() => setEditing(false)}>Cancel</button>
        </div>
      </form>
    );
  }

  return (
    <div className={paidFlag ? 'card debt-paid' : 'card'}>
      <div className="page-header">
        <h2 style={{ margin: 0 }}>
          {debt.Name} <span className={isOwed ? 'success-text' : 'error-text'} style={{ fontSize: 13, fontWeight: 600 }}>({debt.Type})</span>
          {paidFlag && <span className="role-badge" style={{ marginLeft: 8 }}>Paid</span>}
        </h2>
        {isOwner && (
          <div className="button-row">
            <button className="secondary small" onClick={startEdit}>Edit</button>
            <button className="danger small" onClick={() => onDelete(debt.ID)}>Delete</button>
          </div>
        )}
      </div>
      <div className="progress-bar large">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="muted">
        {formatCurrency(paidAmount)} of {formatCurrency(amount)} {isOwed ? 'received' : 'paid'} ({pct.toFixed(0)}%)
        {' — '}{formatCurrency(remaining)} remaining
      </p>
      {debt.Note && <p className="muted">{debt.Note}</p>}

      {isOwner && (
        <label className="checklist-item" style={{ borderBottom: 'none', padding: 0 }}>
          <input
            type="checkbox"
            checked={paidFlag}
            onChange={(e) => onTogglePaid(debt.ID, e.target.checked)}
          />
          <span className="item-text">Mark as Paid</span>
        </label>
      )}

      {isOwner && !paidFlag && (
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
                <label>Amount ({currency})</label>
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
                <td data-label="Date">{toDateStr(p.Date)}</td>
                <td data-label="Note">{p.Note}</td>
                <td data-label="Amount">{formatCurrency(p.Amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function Debts() {
  const { debts, debtPayments, addDebt, updateDebt, deleteDebt, addDebtPayment, toggleDebtPaid, isOwner, loading, configured } = useData();
  const currency = useCurrency();
  const formatCurrency = useCurrencyFormat();
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
    .reduce((sum, d) => sum + debtRemaining(d, paymentsByDebt[d.ID] || []), 0);

  const totalOwedToMe = debts
    .filter((d) => d.Type === 'Owed to Me')
    .reduce((sum, d) => sum + debtRemaining(d, paymentsByDebt[d.ID] || []), 0);

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
          <span className="summary-value error-text">{formatCurrency(totalOwed)}</span>
        </div>
        <div className="card summary-card">
          <span className="summary-label">Total Owed to Me</span>
          <span className="summary-value success-text">{formatCurrency(totalOwedToMe)}</span>
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
              <label>Amount ({currency})</label>
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
        <p className="muted loading-pulse">Loading…</p>
      ) : debts.length === 0 ? (
        <div className="card"><p className="muted">No debts recorded.</p></div>
      ) : (
        debts.map((debt) => (
          <DebtCard
            key={debt.ID}
            debt={debt}
            payments={paymentsByDebt[debt.ID] || []}
            isOwner={isOwner}
            currency={currency}
            formatCurrency={formatCurrency}
            onAddPayment={(debtId, payment) => addDebtPayment({ debtId, debtType: debt.Type, ...payment })}
            onDelete={deleteDebt}
            onTogglePaid={toggleDebtPaid}
            onUpdate={updateDebt}
          />
        ))
      )}
    </div>
  );
}
