import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { COUNTRIES, CURRENCIES } from '../constants';

export default function ProfileSetup() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [currency, setCurrency] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function handleCountryChange(value) {
    setCountry(value);
    const match = COUNTRIES.find((c) => c.name === value);
    if (match) setCurrency(match.currency);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !country || !currency) return;
    setSaving(true);
    setError('');
    try {
      await updateProfile({ display_name: name.trim(), country, currency });
    } catch (err) {
      setError(err.message || 'Could not save your profile');
      setSaving(false);
    }
  }

  return (
    <div className="lock-screen">
      <form className="card lock-card" onSubmit={handleSubmit} style={{ maxWidth: 380, textAlign: 'left' }}>
        <h1 style={{ textAlign: 'center' }}>👋 Welcome!</h1>
        <p className="muted" style={{ textAlign: 'center' }}>Let's set up your account.</p>

        <label>Email</label>
        <input type="email" value={user.email} disabled />

        <label htmlFor="profile-name">Name</label>
        <input
          id="profile-name"
          type="text"
          placeholder="Your name"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <label htmlFor="profile-country">Country</label>
        <select id="profile-country" value={country} onChange={(e) => handleCountryChange(e.target.value)}>
          <option value="" disabled>Select your country…</option>
          {COUNTRIES.map((c) => (
            <option key={c.name} value={c.name}>{c.name}</option>
          ))}
        </select>

        <label htmlFor="profile-currency">Currency</label>
        <select id="profile-currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
          <option value="" disabled>Select your currency…</option>
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {error && <p className="error-text">{error}</p>}
        <button type="submit" disabled={saving || !name.trim() || !country || !currency}>
          {saving ? 'Saving…' : 'Continue'}
        </button>
      </form>
    </div>
  );
}
