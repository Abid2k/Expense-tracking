import { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { GOAL_TYPES } from '../constants';
import { formatSAR, toDateStr, todayStr, monthsUntil } from '../utils/format';

function GoalCard({ goal, contributions, isOwner, onAddContribution, onDelete }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: todayStr(), amount: '', note: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const target = Number(goal.TargetAmount) || 0;
  const saved = contributions.reduce((sum, c) => sum + Number(c.Amount), 0);
  const remaining = Math.max(0, target - saved);
  const pct = target > 0 ? Math.min(100, (saved / target) * 100) : 0;

  const months = goal.TargetDate ? monthsUntil(goal.TargetDate) : null;
  const requiredMonthly = months && remaining > 0 ? remaining / months : 0;

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

  return (
    <div className="card">
      <div className="page-header">
        <h2 style={{ margin: 0 }}>
          {goal.Name} <span className="role-badge">{goal.Type}</span>
        </h2>
        {isOwner && (
          <button className="danger small" onClick={() => onDelete(goal.ID)}>Delete</button>
        )}
      </div>
      <div className="progress-bar large">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="muted">
        {formatSAR(saved)} of {formatSAR(target)} saved ({pct.toFixed(0)}%)
        {target > 0 && ` — ${formatSAR(remaining)} to go`}
      </p>
      {goal.TargetDate && (
        <p className="muted">
          Target date: {goal.TargetDate}
          {requiredMonthly > 0 && ` — need ~${formatSAR(requiredMonthly)}/month to reach this on time`}
        </p>
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

      {contributions.length > 0 && (
        <table className="table">
          <thead>
            <tr><th>Date</th><th>Note</th><th>Amount</th></tr>
          </thead>
          <tbody>
            {[...contributions].sort((a, b) => (a.Date < b.Date ? 1 : -1)).map((c) => (
              <tr key={c.ID}>
                <td>{toDateStr(c.Date)}</td>
                <td>{c.Note}</td>
                <td>{formatSAR(c.Amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function Savings() {
  const { goals, savings, addGoal, deleteGoal, addSaving, isOwner, loading, configured } = useData();
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
    const targetAmount = Number(form.targetAmount);
    if (!form.name || !targetAmount || targetAmount <= 0) {
      setFormError('Please provide a name and a positive target amount.');
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
          <span className="summary-value success-text">{formatSAR(totalSaved)}</span>
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
          <div className="form-grid">
            <div>
              <label>Name</label>
              <input type="text" placeholder="e.g. Vacation 2027" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label>Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {GOAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label>Target Amount (SAR)</label>
              <input type="number" step="0.01" min="0" value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} />
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
        <p className="muted">Loading…</p>
      ) : goals.length === 0 ? (
        <div className="card"><p className="muted">No savings goals yet.</p></div>
      ) : (
        goals.map((goal) => (
          <GoalCard
            key={goal.ID}
            goal={goal}
            contributions={contributionsByGoal[goal.ID] || []}
            isOwner={isOwner}
            onAddContribution={(goalId, contribution) => addSaving({ goalId, ...contribution })}
            onDelete={deleteGoal}
          />
        ))
      )}
    </div>
  );
}
