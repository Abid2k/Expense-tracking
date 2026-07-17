import { useState } from 'react';
import { getScriptUrl, setScriptUrl, api } from '../api';
import { useData } from '../context/DataContext';

export default function Settings() {
  const [url, setUrl] = useState(getScriptUrl());
  const [status, setStatus] = useState(null);
  const [testing, setTesting] = useState(false);
  const { refresh } = useData();

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

      <div className="card">
        <h2>Setup checklist</h2>
        <ol>
          <li>Create a new Google Sheet.</li>
          <li>Open Extensions → Apps Script, and paste the contents of <code>apps-script/Code.gs</code> from this repo.</li>
          <li>Click Deploy → New deployment → type: Web app.</li>
          <li>Set "Execute as" to yourself, and "Who has access" to Anyone.</li>
          <li>Deploy, authorize the permissions, and copy the resulting Web App URL.</li>
          <li>Paste the URL above and click Test Connection.</li>
        </ol>
      </div>
    </div>
  );
}
