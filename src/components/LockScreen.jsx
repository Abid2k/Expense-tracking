import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LockScreen() {
  const { signInWithGoogle } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSignIn() {
    setBusy(true);
    setError('');
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err.message || 'Sign-in failed');
      setBusy(false);
    }
  }

  return (
    <div className="lock-screen">
      <div className="card lock-card">
        <h1>💰 Expense Tracker</h1>
        <p className="muted">Sign in with Google to see your private data.</p>
        {error && <p className="error-text">{error}</p>}
        <button type="button" onClick={handleSignIn} disabled={busy}>
          {busy ? 'Redirecting…' : 'Sign in with Google'}
        </button>
      </div>
    </div>
  );
}
