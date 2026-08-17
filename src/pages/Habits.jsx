import { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useData } from '../context/DataContext';
import { useIsMobile } from '../hooks/useIsMobile';
import { toDateStr, todayStr, currentMonthKey, monthLabel, daysInMonth } from '../utils/format';

export default function Habits() {
  const { habits, habitLogs, addHabit, deleteHabit, toggleHabitLog, isOwner, loading, configured } = useData();
  const isMobile = useIsMobile();
  const [monthKey, setMonthKey] = useState(currentMonthKey());
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const days = useMemo(
    () => Array.from({ length: daysInMonth(monthKey) }, (_, i) => i + 1),
    [monthKey]
  );

  function dateForDay(day) {
    return `${monthKey}-${String(day).padStart(2, '0')}`;
  }

  const doneSet = useMemo(() => {
    const set = new Set();
    habitLogs.forEach((l) => {
      const d = toDateStr(l.Date);
      if (d.startsWith(monthKey)) set.add(`${l.HabitID}|${d}`);
    });
    return set;
  }, [habitLogs, monthKey]);

  const today = todayStr();

  const progressData = habits.map((h) => {
    const doneDays = days.filter((d) => doneSet.has(`${h.ID}|${dateForDay(d)}`)).length;
    return { name: h.Name, pct: Math.round((doneDays / days.length) * 100) };
  });

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await addHabit({ name: name.trim() });
      setName('');
    } finally {
      setSaving(false);
    }
  }

  if (!configured) {
    return (
      <div className="page">
        <h1>Daily Habits</h1>
        <p className="muted">Connect your Google Sheet in Settings first.</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Daily Habits</h1>
        <input
          type="month"
          value={monthKey}
          onChange={(e) => setMonthKey(e.target.value)}
          style={{ width: 'auto' }}
        />
      </div>

      <div className="card">
        <div className="page-header">
          <h2 style={{ margin: 0 }}>{monthLabel(monthKey)}</h2>
        </div>

        {isOwner && (
          <form onSubmit={handleSubmit} className="button-row" style={{ marginTop: 8 }}>
            <input
              type="text"
              placeholder="Add a habit, e.g. Read 5 pages…"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button type="submit" disabled={saving || !name.trim()}>Add</button>
          </form>
        )}

        {loading ? (
          <p className="muted loading-pulse">Loading…</p>
        ) : habits.length === 0 ? (
          <p className="muted">No habits yet. Add one above to start tracking.</p>
        ) : (
          <div className="habit-grid-wrap">
            <table className="habit-grid">
              <thead>
                <tr>
                  <th className="habit-grid-name">Habit</th>
                  {days.map((d) => (
                    <th key={d}>{d}</th>
                  ))}
                  {isOwner && <th />}
                </tr>
              </thead>
              <tbody>
                {habits.map((h) => (
                  <tr key={h.ID}>
                    <td className="habit-grid-name">{h.Name}</td>
                    {days.map((d) => {
                      const dateStr = dateForDay(d);
                      const isDone = doneSet.has(`${h.ID}|${dateStr}`);
                      const isFuture = dateStr > today;
                      return (
                        <td key={d}>
                          <button
                            type="button"
                            className={isDone ? 'habit-dot done' : 'habit-dot'}
                            disabled={!isOwner || isFuture}
                            aria-label={`${h.Name} on ${dateStr}`}
                            onClick={() => toggleHabitLog(h.ID, dateStr, !isDone)}
                          />
                        </td>
                      );
                    })}
                    {isOwner && (
                      <td>
                        <button className="danger small" onClick={() => deleteHabit(h.ID)}>Delete</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {habits.length > 0 && (
        <div className="card">
          <h2>{monthLabel(monthKey)} Progress</h2>
          <ResponsiveContainer width="100%" height={isMobile ? 220 : 280}>
            <LineChart data={progressData} margin={{ right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} width={40} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(value) => `${value}%`} />
              <Line type="monotone" dataKey="pct" stroke="#457b9d" strokeWidth={2} name="Days completed" dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
