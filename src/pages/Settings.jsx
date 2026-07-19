import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user, signOut } = useAuth();

  return (
    <div className="page">
      <h1>Settings</h1>

      <div className="card">
        <h2>Account</h2>
        <p className="muted">Signed in as <strong>{user.email}</strong>. Your data is private to this account.</p>
        <button type="button" className="secondary" onClick={signOut}>Sign Out</button>
      </div>
    </div>
  );
}
