import { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { toDateStr, todayStr } from '../utils/format';

export default function Habits() {
  const { habits, habitLogs, addHabit, deleteHabit, toggleHabitLog, isOwner, loading, configured } = useData();
  const [date, setDate] = useState(todayStr());
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const doneHabitIds = useMemo(
    () => new Set(habitLogs.filter((l) => toDateStr(l.Date) === date).map((l) => l.HabitID)),
    [habitLogs, date]
  );

  const doneCount = habits.filter((h) => doneHabitIds.has(h.ID)).length;

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
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{ width: 'auto' }}
        />
      </div>

      <div className="card">
        <div className="page-header">
          <h2 style={{ margin: 0 }}>{date === todayStr() ? 'Today' : date}</h2>
          <span className="muted">{doneCount} / {habits.length} done</span>
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
          <ul className="checklist">
            {habits.map((h) => {
              const isDone = doneHabitIds.has(h.ID);
              return (
                <li key={h.ID} className={isDone ? 'checklist-item done' : 'checklist-item'}>
                  <input
                    type="checkbox"
                    checked={isDone}
                    disabled={!isOwner}
                    onChange={(e) => toggleHabitLog(h.ID, date, e.target.checked)}
                  />
                  <span className="item-text">{h.Name}</span>
                  {isOwner && (
                    <button className="danger small" onClick={() => deleteHabit(h.ID)}>Delete</button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
