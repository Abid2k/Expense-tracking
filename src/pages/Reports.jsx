import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useData } from '../context/DataContext';
import { CATEGORIES, CATEGORY_COLORS } from '../constants';
import { formatSAR, toMonthKey, monthLabel, currentMonthKey, previousMonthKey } from '../utils/format';

export default function Reports() {
  const { expenses, configured } = useData();

  const months = useMemo(() => {
    const set = new Set(expenses.map((e) => toMonthKey(e.Date)));
    set.add(currentMonthKey());
    return Array.from(set).sort();
  }, [expenses]);

  const monthlyTotals = useMemo(() => {
    return months.map((m) => {
      const monthExpenses = expenses.filter((e) => toMonthKey(e.Date) === m);
      const total = monthExpenses.reduce((sum, e) => sum + Number(e.Amount), 0);
      return { month: m, label: monthLabel(m), total };
    });
  }, [months, expenses]);

  const defaultA = months.length > 1 ? months[months.length - 2] : previousMonthKey(currentMonthKey());
  const defaultB = months[months.length - 1] || currentMonthKey();

  const [monthA, setMonthA] = useState(defaultA);
  const [monthB, setMonthB] = useState(defaultB);

  function categoryTotals(monthKey) {
    const totals = {};
    expenses
      .filter((e) => toMonthKey(e.Date) === monthKey)
      .forEach((e) => {
        const cat = e.Category || 'Other';
        totals[cat] = (totals[cat] || 0) + Number(e.Amount);
      });
    return totals;
  }

  const totalsA = categoryTotals(monthA);
  const totalsB = categoryTotals(monthB);
  const sumA = Object.values(totalsA).reduce((s, v) => s + v, 0);
  const sumB = Object.values(totalsB).reduce((s, v) => s + v, 0);
  const diff = sumB - sumA;
  const diffPct = sumA > 0 ? (diff / sumA) * 100 : sumB > 0 ? 100 : 0;

  const categoryComparison = CATEGORIES.map((cat) => ({
    name: cat,
    [monthLabel(monthA)]: totalsA[cat] || 0,
    [monthLabel(monthB)]: totalsB[cat] || 0,
  })).filter((row) => row[monthLabel(monthA)] > 0 || row[monthLabel(monthB)] > 0);

  if (!configured) {
    return (
      <div className="page">
        <h1>Reports</h1>
        <p className="muted">Connect your Google Sheet in Settings first.</p>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Reports</h1>

      <div className="card">
        <h2>Monthly Spending Trend</h2>
        {monthlyTotals.every((m) => m.total === 0) ? (
          <p className="muted">No expense data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={monthlyTotals}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip formatter={(value) => formatSAR(value)} />
              <Bar dataKey="total" fill="#3b82f6" name="Total Spent" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="card">
        <h2>Compare Two Months</h2>
        <div className="form-grid">
          <div>
            <label htmlFor="month-a">Month A</label>
            <select id="month-a" value={monthA} onChange={(e) => setMonthA(e.target.value)}>
              {months.map((m) => (
                <option key={m} value={m}>{monthLabel(m)}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="month-b">Month B</label>
            <select id="month-b" value={monthB} onChange={(e) => setMonthB(e.target.value)}>
              {months.map((m) => (
                <option key={m} value={m}>{monthLabel(m)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="summary-grid">
          <div className="card summary-card">
            <span className="summary-label">{monthLabel(monthA)}</span>
            <span className="summary-value">{formatSAR(sumA)}</span>
          </div>
          <div className="card summary-card">
            <span className="summary-label">{monthLabel(monthB)}</span>
            <span className="summary-value">{formatSAR(sumB)}</span>
          </div>
          <div className="card summary-card">
            <span className="summary-label">Difference</span>
            <span className={diff > 0 ? 'summary-value error-text' : diff < 0 ? 'summary-value success-text' : 'summary-value'}>
              {diff > 0 ? '+' : ''}{formatSAR(diff)}
            </span>
            <span className="muted">{diffPct > 0 ? '+' : ''}{diffPct.toFixed(1)}%</span>
          </div>
        </div>

        {categoryComparison.length === 0 ? (
          <p className="muted">No category data to compare for these months.</p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={categoryComparison}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => formatSAR(value)} />
                <Legend />
                <Bar dataKey={monthLabel(monthA)} fill="#94a3b8" />
                <Bar dataKey={monthLabel(monthB)} fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>

            <table className="table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>{monthLabel(monthA)}</th>
                  <th>{monthLabel(monthB)}</th>
                  <th>Difference</th>
                </tr>
              </thead>
              <tbody>
                {categoryComparison.map((row) => {
                  const a = row[monthLabel(monthA)];
                  const b = row[monthLabel(monthB)];
                  const d = b - a;
                  return (
                    <tr key={row.name}>
                      <td>
                        <span className="dot" style={{ background: CATEGORY_COLORS[row.name] }} />
                        {row.name}
                      </td>
                      <td>{formatSAR(a)}</td>
                      <td>{formatSAR(b)}</td>
                      <td className={d > 0 ? 'error-text' : d < 0 ? 'success-text' : ''}>
                        {d > 0 ? '+' : ''}{formatSAR(d)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}
