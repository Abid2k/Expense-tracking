import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ProfileSetup() {
  const { updateDisplayName } = useAuth();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError('');
    try {
      await updateDisplayName(name.trim());
    } catch (err) {
      setError(err.message || 'Could not save your name');
      setSaving(false);
    }
  }

  return (
    <div className="lock-screen">
      <form className="card lock-card" onSubmit={handleSubmit}>
        <h1>👋 Welcome!</h1>
        <p className="muted">What should we call you?</p>
        <input
          type="text"
          placeholder="Your name"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {error && <p className="error-text">{error}</p>}
        <button type="submit" disabled={saving || !name.trim()}>{saving ? 'Saving…' : 'Continue'}</button>
      </form>
    </div>
  );
}
