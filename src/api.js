const URL_KEY = 'expense-tracker-script-url';
const PIN_KEY = 'expense-tracker-pin';
const ROLE_KEY = 'expense-tracker-role';

export function getScriptUrl() {
  return localStorage.getItem(URL_KEY) || '';
}

export function setScriptUrl(url) {
  localStorage.setItem(URL_KEY, url.trim());
}

export function getPin() {
  return localStorage.getItem(PIN_KEY) || '';
}

export function getRole() {
  return localStorage.getItem(ROLE_KEY) || '';
}

export function setSession(pin, role) {
  localStorage.setItem(PIN_KEY, pin);
  localStorage.setItem(ROLE_KEY, role);
}

export function clearSession() {
  localStorage.removeItem(PIN_KEY);
  localStorage.removeItem(ROLE_KEY);
}

class AuthError extends Error {}

async function get(action, { pin } = {}) {
  const url = getScriptUrl();
  if (!url) throw new Error('No Apps Script URL configured yet. Go to Settings to add it.');
  const usedPin = pin !== undefined ? pin : getPin();
  const res = await fetch(`${url}?action=${action}&pin=${encodeURIComponent(usedPin)}`);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  const data = await res.json();
  if (!data.ok) {
    if (data.needsPin) throw new AuthError(data.error || 'PIN required');
    throw new Error(data.error || 'Unknown error');
  }
  return data;
}

async function post(action, payload) {
  const url = getScriptUrl();
  if (!url) throw new Error('No Apps Script URL configured yet. Go to Settings to add it.');
  const res = await fetch(url, {
    method: 'POST',
    // text/plain avoids a CORS preflight request, which Apps Script web apps don't handle.
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, pin: getPin(), ...payload }),
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  const data = await res.json();
  if (!data.ok) {
    if (data.needsPin) throw new AuthError(data.error || 'PIN required');
    throw new Error(data.error || 'Unknown error');
  }
  return data;
}

export const api = {
  AuthError,
  getAll: () => get('getAll'),
  verifyPin: (pin) => get('getAll', { pin }),

  addExpense: (expense) => post('addExpense', expense),
  deleteExpense: (id) => post('deleteExpense', { id }),

  addGoal: (goal) => post('addGoal', goal),
  updateGoal: (id, goal) => post('updateGoal', { id, ...goal }),
  deleteGoal: (id) => post('deleteGoal', { id }),
  addSaving: (saving) => post('addSaving', saving),
  deleteSaving: (id) => post('deleteSaving', { id }),

  setPins: (pins) => post('setPins', pins),

  addDebt: (debt) => post('addDebt', debt),
  updateDebt: (id, debt) => post('updateDebt', { id, ...debt }),
  deleteDebt: (id) => post('deleteDebt', { id }),
  toggleDebtPaid: (id, paid) => post('toggleDebtPaid', { id, paid }),
  addDebtPayment: (payment) => post('addDebtPayment', payment),
  deleteDebtPayment: (id) => post('deleteDebtPayment', { id }),

  addTodo: (todo) => post('addTodo', todo),
  updateTodo: (id, done) => post('updateTodo', { id, done }),
  deleteTodo: (id) => post('deleteTodo', { id }),

  addNote: (note) => post('addNote', note),
  deleteNote: (id) => post('deleteNote', { id }),
};
