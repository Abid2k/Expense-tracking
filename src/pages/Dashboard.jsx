import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useData } from '../context/DataContext';
import { CATEGORY_COLORS } from '../constants';
import { formatSAR, toMonthKey, monthLabel, currentMonthKey } from '../utils/format';

export default function Dashboard() {
  const { expenses, savings, settings, loading, configured, error } = useData();
  const [monthKey, setMonthKey] = useState(currentMonthKey());

  const months = useMemo(() => {
    const set = new Set(expenses.map((e) => toMonthKey(e.Date)));
    set.add(currentMonthKey());
    return Array.from(set).sort().reverse();
  }, [expenses]);

  const monthExpenses = useMemo(
    () => expenses.filter((e) => toMonthKey(e.Date) === monthKey),
    [expenses, monthKey]
  );

  const byCategory = useMemo(() => {
    const totals = {};
    monthExpenses.forEach((e) => {
      const cat = e.Category || 'Other';
      totals[cat] = (totals[cat] || 0) + Number(e.Amount);
    });
    return Object.entries(totals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [monthExpenses]);

  const total = byCategory.reduce((sum, c) => sum + c.value, 0);
  const topCategory = byCategory[0];

  const savingsTotal = savings.reduce((sum, s) => sum + Number(s.Amount), 0);
  const goalAmount = Number(settings.GoalAmount) || 0;
  const goalPct = goalAmount > 0 ? Math.min(100, (savingsTotal / goalAmount) * 100) : 0;

  if (!configured) {
    return (
      <div className="page">
        <h1>Dashboard</h1>
        <div className="card">
          <p>You haven't connected a Google Sheet yet.</p>
          <Link to="/settings"><button>Go to Settings</button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <select value={monthKey} onChange={(e) => setMonthKey(e.target.value)}>
          {months.map((m) => (
            <option key={m} value={m}>{monthLabel(m)}</option>
          ))}
        </select>
      </div>

      {error && <p className="error-text">{error}</p>}
      {loading && <p className="muted">Loading…</p>}

      <div className="summary-grid">
        <div className="card summary-card">
          <span className="summary-label">Total Spent — {monthLabel(monthKey)}</span>
          <span className="summary-value">{formatSAR(total)}</span>
        </div>
        <div className="card summary-card">
          <span className="summary-label">Top Category</span>
          <span className="summary-value">{topCategory ? topCategory.name : '—'}</span>
          <span className="muted">{topCategory ? formatSAR(topCategory.value) : ''}</span>
        </div>
        <div className="card summary-card">
          <span className="summary-label">Savings Progress</span>
          <span className="summary-value">{goalPct.toFixed(0)}%</span>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${goalPct}%` }} />
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Expense Breakdown by Category</h2>
        {byCategory.length === 0 ? (
          <p className="muted">No expenses recorded for {monthLabel(monthKey)}.</p>
        ) : (
          <ResponsiveContainer width="100%" height={360}>
            <PieChart>
              <Pie
                data={byCategory}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={130}
                label={(entry) => `${entry.name} (${((entry.value / total) * 100).toFixed(0)}%)`}
              >
                {byCategory.map((entry) => (
                  <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || '#999'} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatSAR(value)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
