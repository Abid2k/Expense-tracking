import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { useData } from '../context/DataContext';
import { CATEGORY_COLORS } from '../constants';
import { formatSAR, toMonthKey, toDateStr, monthLabel, currentMonthKey, daysInMonth } from '../utils/format';

function isDebtPaid(debt) {
  return debt.Paid === true || debt.Paid === 'TRUE';
}

export default function Dashboard() {
  const { expenses, savings, goals, debts, debtPayments, todos, loading, configured, error } = useData();
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

  const isCurrentMonth = monthKey === currentMonthKey();
  const totalDays = daysInMonth(monthKey);
  const daysElapsed = isCurrentMonth ? new Date().getDate() : totalDays;
  const avgDaily = total / Math.max(1, daysElapsed);
  const projected = isCurrentMonth ? avgDaily * totalDays : total;
  const daysRemaining = isCurrentMonth ? Math.max(0, totalDays - daysElapsed) : 0;

  const dailyTrend = useMemo(() => {
    const totals = Array.from({ length: totalDays }, (_, i) => ({ day: i + 1, total: 0 }));
    monthExpenses.forEach((e) => {
      const day = Number(toDateStr(e.Date).slice(8, 10));
      if (day >= 1 && day <= totalDays) totals[day - 1].total += Number(e.Amount);
    });
    return totals;
  }, [monthExpenses, totalDays]);

  const contributionsByGoal = useMemo(() => {
    const map = {};
    savings.forEach((s) => {
      if (!map[s.GoalID]) map[s.GoalID] = 0;
      map[s.GoalID] += Number(s.Amount);
    });
    return map;
  }, [savings]);

  const totalSaved = savings.reduce((sum, s) => sum + Number(s.Amount), 0);
  const totalGoalTarget = goals.reduce((sum, g) => sum + (Number(g.TargetAmount) || 0), 0);
  const savingsPct = totalGoalTarget > 0 ? Math.min(100, (totalSaved / totalGoalTarget) * 100) : 0;

  const paymentsByDebt = useMemo(() => {
    const map = {};
    debtPayments.forEach((p) => {
      if (!map[p.DebtID]) map[p.DebtID] = 0;
      map[p.DebtID] += Number(p.Amount);
    });
    return map;
  }, [debtPayments]);

  const debtsWithRemaining = useMemo(() => {
    return debts
      .filter((d) => d.Type === 'I Owe' && !isDebtPaid(d))
      .map((d) => ({
        ...d,
        remaining: Math.max(0, Number(d.Amount) - (paymentsByDebt[d.ID] || 0)),
      }))
      .sort((a, b) => b.remaining - a.remaining);
  }, [debts, paymentsByDebt]);

  const debtOutstanding = debtsWithRemaining.reduce((sum, d) => sum + d.remaining, 0);

  const monthTodos = useMemo(
    () => todos.filter((t) => t.Month === currentMonthKey()),
    [todos]
  );
  const todosDone = monthTodos.filter((t) => t.Done === true || t.Done === 'TRUE').length;
  const pendingTodos = monthTodos.filter((t) => !(t.Done === true || t.Done === 'TRUE'));

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
          <span className="summary-value">{savingsPct.toFixed(0)}%</span>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${savingsPct}%` }} />
          </div>
        </div>
        <div className="card summary-card">
          <span className="summary-label">Debt Outstanding</span>
          <span className="summary-value error-text">{formatSAR(debtOutstanding)}</span>
        </div>
      </div>

      {isCurrentMonth && (
        <div className="summary-grid">
          <div className="card summary-card">
            <span className="summary-label">Average Daily Spend</span>
            <span className="summary-value">{formatSAR(avgDaily)}</span>
          </div>
          <div className="card summary-card">
            <span className="summary-label">Projected Month Total</span>
            <span className="summary-value">{formatSAR(projected)}</span>
          </div>
          <div className="card summary-card">
            <span className="summary-label">Days Left This Month</span>
            <span className="summary-value">{daysRemaining}</span>
          </div>
        </div>
      )}

      <div className="card">
        <h2>Spending Trend — {monthLabel(monthKey)}</h2>
        {total === 0 ? (
          <p className="muted">No expenses recorded for {monthLabel(monthKey)}.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip formatter={(value) => formatSAR(value)} labelFormatter={(day) => `Day ${day}`} />
              <Area type="monotone" dataKey="total" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} name="Spent" />
            </AreaChart>
          </ResponsiveContainer>
        )}
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

      <div className="overview-grid">
        <div className="card">
          <div className="page-header">
            <h2 style={{ margin: 0 }}>Savings Goals</h2>
            <Link to="/savings">View all</Link>
          </div>
          {goals.length === 0 ? (
            <p className="muted">No goals yet.</p>
          ) : (
            goals.slice(0, 4).map((g) => {
              const target = Number(g.TargetAmount) || 0;
              const saved = contributionsByGoal[g.ID] || 0;
              const pct = target > 0 ? Math.min(100, (saved / target) * 100) : 0;
              return (
                <div key={g.ID} style={{ marginBottom: 10 }}>
                  <div className="page-header">
                    <span>{g.Name}</span>
                    <span className="muted">{pct.toFixed(0)}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="card">
          <div className="page-header">
            <h2 style={{ margin: 0 }}>Debts</h2>
            <Link to="/debts">View all</Link>
          </div>
          {debtsWithRemaining.length === 0 ? (
            <p className="muted">No outstanding debts.</p>
          ) : (
            debtsWithRemaining.slice(0, 4).map((d) => (
              <div key={d.ID} className="page-header" style={{ marginBottom: 6 }}>
                <span>{d.Name}</span>
                <span className="error-text">{formatSAR(d.remaining)}</span>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <div className="page-header">
            <h2 style={{ margin: 0 }}>This Month's To-Dos</h2>
            <Link to="/todos">View all</Link>
          </div>
          <p className="muted">{todosDone} / {monthTodos.length} done</p>
          {pendingTodos.slice(0, 4).map((t) => (
            <div key={t.ID} className="checklist-item">
              <span className="item-text">{t.Text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
