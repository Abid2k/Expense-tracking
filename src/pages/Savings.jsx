import { useState } from 'react';
import { useData } from '../context/DataContext';
import { formatSAR, toDateStr, todayStr } from '../utils/format';

export default function Savings() {
  const { savings, settings, addSaving, deleteSaving, setGoal, loading, configured } = useData();

  const [goalForm, setGoalForm] = useState({
    goalName: settings.GoalName || '',
    goalAmount: settings.GoalAmount || '',
  });
  const [goalSaving, setGoalSaving] = useState(false);

  const [contribForm, setContribForm] = useState({ date: todayStr(), amount: '', note: '' });
  const [contribSaving, setContribSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const total = savings.reduce((sum, s) => sum + Number(s.Amount), 0);
  const goalAmount = Number(settings.GoalAmount) || 0;
  const goalPct = goalAmount > 0 ? Math.min(100, (total / goalAmount) * 100) : 0;
  const remaining = Math.max(0, goalAmount - total);

  const sortedSavings = [...savings].sort((a, b) => (a.Date < b.Date ? 1 : -1));

  async function handleGoalSubmit(e) {
    e.preventDefault();
    setGoalSaving(true);
    try {
      await setGoal({
        goalName: goalForm.goalName,
        goalAmount: Number(goalForm.goalAmount) || 0,
      });
    } finally {
      setGoalSaving(false);
    }
  }

  async function handleContribSubmit(e) {
    e.preventDefault();
    setFormError('');
    const amount = Number(contribForm.amount);
    if (!contribForm.date || !amount || amount <= 0) {
      setFormError('Please provide a date and a positive amount.');
      return;
    }
    setContribSaving(true);
    try {
      await addSaving({ date: contribForm.date, amount, note: contribForm.note });
      setContribForm({ date: contribForm.date, amount: '', note: '' });
    } catch (err) {
      setFormError(err.message);
    } finally {
      setContribSaving(false);
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

      <div className="card">
        <h2>{settings.GoalName || 'Savings Goal'}</h2>
        <div className="progress-bar large">
          <div className="progress-fill" style={{ width: `${goalPct}%` }} />
        </div>
        <p className="muted">
          {formatSAR(total)} saved of {formatSAR(goalAmount)} ({goalPct.toFixed(1)}%)
          {goalAmount > 0 && ` — ${formatSAR(remaining)} to go`}
        </p>
      </div>

      <form className="card" onSubmit={handleGoalSubmit}>
        <h2>Set Goal</h2>
        <div className="form-grid">
          <div>
            <label htmlFor="goal-name">Goal Name</label>
            <input
              id="goal-name"
              type="text"
              placeholder="e.g. Emergency Fund"
              value={goalForm.goalName}
              onChange={(e) => setGoalForm({ ...goalForm, goalName: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="goal-amount">Target Amount (SAR)</label>
            <input
              id="goal-amount"
              type="number"
              step="0.01"
              min="0"
              value={goalForm.goalAmount}
              onChange={(e) => setGoalForm({ ...goalForm, goalAmount: e.target.value })}
            />
          </div>
        </div>
        <button type="submit" disabled={goalSaving}>{goalSaving ? 'Saving…' : 'Save Goal'}</button>
      </form>

      <form className="card" onSubmit={handleContribSubmit}>
        <h2>Add Contribution</h2>
        <p className="muted">Add money to your savings whenever you want — monthly or any time.</p>
        <div className="form-grid">
          <div>
            <label htmlFor="contrib-date">Date</label>
            <input
              id="contrib-date"
              type="date"
              value={contribForm.date}
              onChange={(e) => setContribForm({ ...contribForm, date: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="contrib-amount">Amount (SAR)</label>
            <input
              id="contrib-amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={contribForm.amount}
              onChange={(e) => setContribForm({ ...contribForm, amount: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="contrib-note">Note (optional)</label>
            <input
              id="contrib-note"
              type="text"
              placeholder="e.g. monthly deposit"
              value={contribForm.note}
              onChange={(e) => setContribForm({ ...contribForm, note: e.target.value })}
            />
          </div>
        </div>
        {formError && <p className="error-text">{formError}</p>}
        <button type="submit" disabled={contribSaving}>{contribSaving ? 'Adding…' : 'Add Contribution'}</button>
      </form>

      <div className="card">
        <h2>Contribution History</h2>
        {loading ? (
          <p className="muted">Loading…</p>
        ) : sortedSavings.length === 0 ? (
          <p className="muted">No contributions yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Note</th>
                <th>Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sortedSavings.map((s) => (
                <tr key={s.ID}>
                  <td>{toDateStr(s.Date)}</td>
                  <td>{s.Note}</td>
                  <td>{formatSAR(s.Amount)}</td>
                  <td>
                    <button className="danger small" onClick={() => deleteSaving(s.ID)}>Delete</button>
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
