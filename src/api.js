const STORAGE_KEY = 'expense-tracker-script-url';

export function getScriptUrl() {
  return localStorage.getItem(STORAGE_KEY) || '';
}

export function setScriptUrl(url) {
  localStorage.setItem(STORAGE_KEY, url.trim());
}

async function get(action) {
  const url = getScriptUrl();
  if (!url) throw new Error('No Apps Script URL configured yet. Go to Settings to add it.');
  const res = await fetch(`${url}?action=${action}`);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'Unknown error');
  return data;
}

async function post(action, payload) {
  const url = getScriptUrl();
  if (!url) throw new Error('No Apps Script URL configured yet. Go to Settings to add it.');
  const res = await fetch(url, {
    method: 'POST',
    // text/plain avoids a CORS preflight request, which Apps Script web apps don't handle.
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, ...payload }),
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'Unknown error');
  return data;
}

export const api = {
  getAll: () => get('getAll'),
  addExpense: (expense) => post('addExpense', expense),
  deleteExpense: (id) => post('deleteExpense', { id }),
  addSaving: (saving) => post('addSaving', saving),
  deleteSaving: (id) => post('deleteSaving', { id }),
  setGoal: (goal) => post('setGoal', goal),
};
