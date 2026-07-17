import { useState } from 'react';
import { useData } from '../context/DataContext';

export default function LockScreen() {
  const { unlock } = useData();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await unlock(pin);
    } catch (err) {
      setError(err.message || 'Incorrect PIN');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="lock-screen">
      <form className="card lock-card" onSubmit={handleSubmit}>
        <h1>🔒 Locked</h1>
        <p className="muted">Enter your access PIN to continue.</p>
        <input
          type="password"
          inputMode="numeric"
          placeholder="PIN"
          autoFocus
          value={pin}
          onChange={(e) => setPin(e.target.value)}
        />
        {error && <p className="error-text">{error}</p>}
        <button type="submit" disabled={busy}>{busy ? 'Checking…' : 'Unlock'}</button>
      </form>
    </div>
  );
}
