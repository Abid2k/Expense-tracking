import { useState } from 'react';
import { useData } from '../context/DataContext';
import { toDateStr, todayStr } from '../utils/format';
import Stamp from '../components/Stamp';

export default function Notes() {
  const { notes, addNote, deleteNote, isOwner, loading, configured } = useData();
  const [form, setForm] = useState({ title: '', content: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const sortedNotes = [...notes].sort((a, b) => (a.Date < b.Date ? 1 : -1));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.title.trim() && !form.content.trim()) {
      setError('Please write a title or some content.');
      return;
    }
    setSaving(true);
    try {
      await addNote({ date: todayStr(), title: form.title.trim(), content: form.content.trim() });
      setForm({ title: '', content: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!configured) {
    return (
      <div className="page">
        <h1>Notes</h1>
        <p className="muted">Connect your Google Sheet in Settings first.</p>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Notes</h1>

      {isOwner && (
        <form className="card" onSubmit={handleSubmit}>
          <h2>Add Note</h2>
          <div>
            <label>Title</label>
            <input
              type="text"
              placeholder="e.g. Ideas for next month"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div>
            <label>Content</label>
            <textarea
              rows={4}
              placeholder="Write anything…"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
            />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Add Note'}</button>
        </form>
      )}

      {loading ? (
        <p className="muted loading-pulse">Loading…</p>
      ) : sortedNotes.length === 0 ? (
        <div className="card"><p className="muted">No notes yet.</p></div>
      ) : (
        sortedNotes.map((n) => (
          <div className="card" key={n.ID}>
            <div className="page-header">
              <h2 style={{ margin: 0 }}>{n.Title || 'Untitled'}</h2>
              {isOwner && (
                <button className="danger small" onClick={() => deleteNote(n.ID)}>Delete</button>
              )}
            </div>
            <Stamp tone="ink">{toDateStr(n.Date)}</Stamp>
            <p style={{ whiteSpace: 'pre-wrap' }}>{n.Content}</p>
          </div>
        ))
      )}
    </div>
  );
}
