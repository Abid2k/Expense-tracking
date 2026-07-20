import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user, signOut, updateDisplayName } = useAuth();
  const [name, setName] = useState(user.user_metadata?.display_name || '');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setStatus(null);
    try {
      await updateDisplayName(name.trim());
      setStatus({ ok: true, message: 'Saved.' });
    } catch (err) {
      setStatus({ ok: false, message: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <h1>Settings</h1>

      <form className="card" onSubmit={handleSubmit}>
        <h2>Account</h2>
        <p className="muted">Signed in as <strong>{user.email}</strong>. Your data is private to this account.</p>
        <label htmlFor="display-name">Display Name</label>
        <input
          id="display-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {status && (
          <p className={status.ok ? 'success-text' : 'error-text'}>{status.message}</p>
        )}
        <div className="button-row">
          <button type="submit" disabled={saving || !name.trim()}>{saving ? 'Saving…' : 'Save'}</button>
          <button type="button" className="secondary" onClick={signOut}>Sign Out</button>
        </div>
      </form>
    </div>
  );
}
