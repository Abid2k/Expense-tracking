import { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { useCurrency } from '../hooks/useCurrency';
import { useCurrencyFormat } from '../hooks/useCurrencyFormat';
import { GOAL_TYPES } from '../constants';
import { toDateStr, todayStr, monthsUntil } from '../utils/format';
import Stamp from '../components/Stamp';

function GoalCard({ goal, contributions, isOwner, currency, formatCurrency, onAddContribution, onDeleteContribution, onDelete, onUpdate }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: todayStr(), amount: '', note: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const target = Number(goal.TargetAmount) || 0;
  const hasTarget = target > 0;
  const saved = contributions.reduce((sum, c) => sum + Number(c.Amount), 0);
  const remaining = Math.max(0, target - saved);
  const pct = hasTarget ? Math.min(100, (saved / target) * 100) : 0;

  const months = hasTarget && goal.TargetDate ? monthsUntil(goal.TargetDate) : null;
  const requiredMonthly = months && remaining > 0 ? remaining / months : 0;

  function startEdit() {
    setEditForm({
      name: goal.Name,
      type: goal.Type,
      targetAmount: goal.TargetAmount || '',
      targetDate: goal.TargetDate || '',
      note: goal.Note || '',
    });
    setEditError('');
    setEditing(true);
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    setEditError('');
    if (!editForm.name) {
      setEditError('Please provide a name.');
      return;
    }
    setEditSaving(true);
    try {
      await onUpdate(goal.ID, editForm);
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
      await onAddContribution(goal.ID, { date: form.date, amount: amt, note: form.note });
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
        <h2>Edit Goal</h2>
        <div className="form-grid">
          <div>
            <label>Name</label>
            <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
          </div>
          <div>
            <label>Type</label>
            <select value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}>
              {GOAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label>Target Amount ({currency}, optional)</label>
            <input type="number" step="0.01" min="0" value={editForm.targetAmount} onChange={(e) => setEditForm({ ...editForm, targetAmount: e.target.value })} />
          </div>
          <div>
            <label>Target Date (optional)</label>
            <input type="date" value={editForm.targetDate} onChange={(e) => setEditForm({ ...editForm, targetDate: e.target.value })} />
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
    <div className="card">
      <div className="page-header">
        <h2 style={{ margin: 0 }}>
          {goal.Name} <Stamp className="stamp-inline">{goal.Type}</Stamp>
        </h2>
        {isOwner && (
          <div className="button-row">
            <button className="secondary small" onClick={startEdit}>Edit</button>
            <button className="danger small" onClick={() => onDelete(goal.ID)}>Delete</button>
          </div>
        )}
      </div>

      {hasTarget ? (
        <>
          <div className="progress-bar large">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <p className="muted">
            {formatCurrency(saved)} of {formatCurrency(target)} saved ({pct.toFixed(0)}%)
            {` — ${formatCurrency(remaining)} to go`}
          </p>
          {goal.TargetDate && (
            <p className="muted">
              Target date: {goal.TargetDate}
              {requiredMonthly > 0 && ` — need ~${formatCurrency(requiredMonthly)}/month to reach this on time`}
            </p>
          )}
        </>
      ) : (
        <p className="summary-value success-text" style={{ fontSize: 22 }}>{formatCurrency(saved)} saved</p>
      )}
      {goal.Note && <p className="muted">{goal.Note}</p>}

      {isOwner && (
        <div>
          {!showForm ? (
            <button onClick={() => setShowForm(true)}>+ Add Contribution</button>
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

      {contributions.length > 0 && (
        <table className="table">
          <thead>
            <tr><th>Date</th><th>Note</th><th>Amount</th><th></th></tr>
          </thead>
          <tbody>
            {[...contributions].sort((a, b) => (a.Date < b.Date ? 1 : -1)).map((c) => (
              <tr key={c.ID}>
                <td data-label="Date">{toDateStr(c.Date)}</td>
                <td data-label="Note">{c.Note}</td>
                <td data-label="Amount">{formatCurrency(c.Amount)}</td>
                <td data-label="">
                  {isOwner && (
                    <button className="danger small" onClick={() => onDeleteContribution(c.ID)}>Delete</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function Savings() {
  const { goals, savings, addGoal, updateGoal, deleteGoal, addSaving, deleteSaving, isOwner, loading, configured } = useData();
  const currency = useCurrency();
  const formatCurrency = useCurrencyFormat();
  const [form, setForm] = useState({ name: '', type: GOAL_TYPES[0], targetAmount: '', targetDate: '', note: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const contributionsByGoal = useMemo(() => {
    const map = {};
    savings.forEach((s) => {
      if (!map[s.GoalID]) map[s.GoalID] = [];
      map[s.GoalID].push(s);
    });
    return map;
  }, [savings]);

  const totalSaved = savings.reduce((sum, s) => sum + Number(s.Amount), 0);
  const totalTarget = goals.reduce((sum, g) => sum + (Number(g.TargetAmount) || 0), 0);
  const overallPct = totalTarget > 0 ? Math.min(100, (totalSaved / totalTarget) * 100) : 0;

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    if (!form.name) {
      setFormError('Please provide a name for this goal.');
      return;
    }
    setSaving(true);
    try {
      await addGoal(form);
      setForm({ name: '', type: GOAL_TYPES[0], targetAmount: '', targetDate: '', note: '' });
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!configured) {
    return (
      <div className="page">
        <h1>Savings</h1>
        <p className="muted">Connect your Google Sheet in Settings first.</p>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Savings</h1>

      <div className="summary-grid">
        <div className="card summary-card">
          <span className="summary-label">Total Saved</span>
          <span className="summary-value success-text">{formatCurrency(totalSaved)}</span>
        </div>
        <div className="card summary-card">
          <span className="summary-label">Overall Progress</span>
          <span className="summary-value">{overallPct.toFixed(0)}%</span>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${overallPct}%` }} />
          </div>
        </div>
      </div>

      {isOwner && (
        <form className="card" onSubmit={handleSubmit}>
          <h2>Add New Goal</h2>
          <p className="muted">
            Leave the target amount blank for open-ended savings with no specific goal — just a
            running total you top up whenever you want.
          </p>
          <div className="form-grid">
            <div>
              <label>Name</label>
              <input type="text" placeholder="e.g. Monthly Savings, Vacation 2027" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label>Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {GOAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label>Target Amount ({currency}, optional)</label>
              <input type="number" step="0.01" min="0" placeholder="Leave blank for no target" value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} />
            </div>
            <div>
              <label>Target Date (optional)</label>
              <input type="date" value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} />
            </div>
            <div>
              <label>Note (optional)</label>
              <input type="text" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </div>
          </div>
          {formError && <p className="error-text">{formError}</p>}
          <button type="submit" disabled={saving}>{saving ? 'Adding…' : 'Add Goal'}</button>
        </form>
      )}

      {loading ? (
        <p className="muted loading-pulse">Loading…</p>
      ) : goals.length === 0 ? (
        <div className="card"><p className="muted">No savings goals yet.</p></div>
      ) : (
        goals.map((goal) => (
          <GoalCard
            key={goal.ID}
            goal={goal}
            contributions={contributionsByGoal[goal.ID] || []}
            isOwner={isOwner}
            currency={currency}
            formatCurrency={formatCurrency}
            onAddContribution={(goalId, contribution) => addSaving({ goalId, ...contribution })}
            onDeleteContribution={deleteSaving}
            onDelete={deleteGoal}
            onUpdate={updateGoal}
          />
        ))
      )}
    </div>
  );
}
