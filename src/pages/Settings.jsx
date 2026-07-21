import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { COUNTRIES, CURRENCIES } from '../constants';

export default function Settings() {
  const { user, signOut, updateProfile } = useAuth();
  const [form, setForm] = useState({
    name: user.user_metadata?.display_name || '',
    country: user.user_metadata?.country || '',
    currency: user.user_metadata?.currency || '',
  });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  function handleCountryChange(value) {
    const match = COUNTRIES.find((c) => c.name === value);
    setForm({ ...form, country: value, currency: match ? match.currency : form.currency });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setStatus(null);
    try {
      await updateProfile({ display_name: form.name.trim(), country: form.country, currency: form.currency });
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

        <div className="form-grid">
          <div>
            <label htmlFor="display-name">Name</label>
            <input
              id="display-name"
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="country">Country</label>
            <select
              id="country"
              value={form.country}
              onChange={(e) => handleCountryChange(e.target.value)}
            >
              <option value="" disabled>Select your country…</option>
              {COUNTRIES.map((c) => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="currency">Currency</label>
            <select
              id="currency"
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
            >
              <option value="" disabled>Select your currency…</option>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {status && (
          <p className={status.ok ? 'success-text' : 'error-text'}>{status.message}</p>
        )}
        <div className="button-row">
          <button type="submit" disabled={saving || !form.name.trim()}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button type="button" className="secondary" onClick={signOut}>Sign Out</button>
        </div>
      </form>
    </div>
  );
}
