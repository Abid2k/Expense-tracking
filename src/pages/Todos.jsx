import { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { currentMonthKey, monthLabel } from '../utils/format';

export default function Todos() {
  const { todos, addTodo, updateTodo, deleteTodo, isOwner, loading, configured } = useData();
  const [monthKey, setMonthKey] = useState(currentMonthKey());
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  const monthTodos = useMemo(
    () => todos.filter((t) => t.Month === monthKey),
    [todos, monthKey]
  );

  const doneCount = monthTodos.filter((t) => t.Done === true || t.Done === 'TRUE').length;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    try {
      await addTodo({ month: monthKey, text: text.trim() });
      setText('');
    } finally {
      setSaving(false);
    }
  }

  if (!configured) {
    return (
      <div className="page">
        <h1>To-Do List</h1>
        <p className="muted">Connect your Google Sheet in Settings first.</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>To-Do List</h1>
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
          <span className="muted">{doneCount} / {monthTodos.length} done</span>
        </div>

        {isOwner && (
          <form onSubmit={handleSubmit} className="button-row" style={{ marginTop: 8 }}>
            <input
              type="text"
              placeholder="Add a task for this month…"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button type="submit" disabled={saving || !text.trim()}>Add</button>
          </form>
        )}

        {loading ? (
          <p className="muted">Loading…</p>
        ) : monthTodos.length === 0 ? (
          <p className="muted">No tasks for {monthLabel(monthKey)} yet.</p>
        ) : (
          <ul className="checklist">
            {monthTodos.map((t) => {
              const isDone = t.Done === true || t.Done === 'TRUE';
              return (
                <li key={t.ID} className={isDone ? 'checklist-item done' : 'checklist-item'}>
                  <input
                    type="checkbox"
                    checked={isDone}
                    disabled={!isOwner}
                    onChange={(e) => updateTodo(t.ID, e.target.checked)}
                  />
                  <span className="item-text">{t.Text}</span>
                  {isOwner && (
                    <button className="danger small" onClick={() => deleteTodo(t.ID)}>Delete</button>
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
