import { useState } from 'react';
import { getScriptUrl, setScriptUrl, api } from '../api';
import { useData } from '../context/DataContext';

export default function Settings() {
  const [url, setUrl] = useState(getScriptUrl());
  const [status, setStatus] = useState(null);
  const [testing, setTesting] = useState(false);
  const { refresh, isOwner, setPins } = useData();

  const [pinForm, setPinForm] = useState({ ownerPin: '', viewerPin: '' });
  const [pinSaving, setPinSaving] = useState(false);
  const [pinStatus, setPinStatus] = useState(null);

  async function handleSave(e) {
    e.preventDefault();
    setScriptUrl(url);
    setStatus(null);
    await refresh();
  }

  async function handleTest() {
    setTesting(true);
    setStatus(null);
    try {
      setScriptUrl(url);
      await api.getAll();
      setStatus({ ok: true, message: 'Connected successfully! Your sheet is reachable.' });
      await refresh();
    } catch (err) {
      setStatus({ ok: false, message: err.message });
    } finally {
      setTesting(false);
    }
  }

  async function handlePinSubmit(e) {
    e.preventDefault();
    setPinStatus(null);
    if (!pinForm.ownerPin && !pinForm.viewerPin) {
      setPinStatus({ ok: false, message: 'Enter at least one PIN to update.' });
      return;
    }
    setPinSaving(true);
    try {
      const payload = {};
      if (pinForm.ownerPin) payload.ownerPin = pinForm.ownerPin;
      if (pinForm.viewerPin) payload.viewerPin = pinForm.viewerPin;
      await setPins(payload);
      setPinStatus({ ok: true, message: "Saved. You'll be asked to re-enter your PIN to confirm it." });
      setPinForm({ ownerPin: '', viewerPin: '' });
    } catch (err) {
      setPinStatus({ ok: false, message: err.message });
    } finally {
      setPinSaving(false);
    }
  }

  return (
    <div className="page">
      <h1>Settings</h1>
      <p className="muted">
        Connect this website to your Google Sheet by pasting your Apps Script Web App URL below.
        See the README for step-by-step setup instructions.
      </p>

      <form className="card" onSubmit={handleSave}>
        <label htmlFor="script-url">Apps Script Web App URL</label>
        <input
          id="script-url"
          type="url"
          placeholder="https://script.google.com/macros/s/XXXXXXXX/exec"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <div className="button-row">
          <button type="submit">Save</button>
          <button type="button" className="secondary" onClick={handleTest} disabled={testing || !url}>
            {testing ? 'Testing…' : 'Test Connection'}
          </button>
        </div>
        {status && (
          <p className={status.ok ? 'success-text' : 'error-text'}>{status.message}</p>
        )}
      </form>

      {isOwner && (
        <form className="card" onSubmit={handlePinSubmit}>
          <h2>Privacy — Access PINs</h2>
          <p className="muted">
            Set an Owner PIN to lock this site down (nobody sees your data without it). Optionally
            set a separate Viewer PIN to share with someone for read-only access — they'll be able to
            see everything but can't add, edit, or delete anything.
          </p>
          <div className="form-grid">
            <div>
              <label htmlFor="owner-pin">New Owner PIN</label>
              <input
                id="owner-pin"
                type="password"
                inputMode="numeric"
                placeholder="Leave blank to keep current"
                value={pinForm.ownerPin}
                onChange={(e) => setPinForm({ ...pinForm, ownerPin: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="viewer-pin">New Viewer PIN (optional)</label>
              <input
                id="viewer-pin"
                type="password"
                inputMode="numeric"
                placeholder="Leave blank to keep current"
                value={pinForm.viewerPin}
                onChange={(e) => setPinForm({ ...pinForm, viewerPin: e.target.value })}
              />
            </div>
          </div>
          <button type="submit" disabled={pinSaving}>{pinSaving ? 'Saving…' : 'Save PINs'}</button>
          {pinStatus && (
            <p className={pinStatus.ok ? 'success-text' : 'error-text'}>{pinStatus.message}</p>
          )}
        </form>
      )}

      <div className="card">
        <h2>Setup checklist</h2>
        <ol>
          <li>Create a new Google Sheet.</li>
          <li>Open Extensions → Apps Script, and paste the contents of <code>apps-script/Code.gs</code> from this repo.</li>
          <li>Click Deploy → New deployment → type: Web app.</li>
          <li>Set "Execute as" to yourself, and "Who has access" to Anyone.</li>
          <li>Deploy, authorize the permissions, and copy the resulting Web App URL.</li>
          <li>Paste the URL above and click Test Connection.</li>
          <li>Set an Owner PIN above to make your data private.</li>
        </ol>
      </div>
    </div>
  );
}
