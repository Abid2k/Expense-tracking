// One-time migration: pulls data from the old Apps Script Google Sheet
// backend and inserts it into a Supabase account, tagged with one user's
// user_id. Run once, after that user's first Google sign-in.
//
// Required env vars (e.g. `node --env-file=.env.migrate scripts/migrate-to-supabase.mjs`):
//   APPS_SCRIPT_URL              old Web App URL (https://script.google.com/macros/s/.../exec)
//   APPS_SCRIPT_PIN              the Owner PIN for that sheet (blank if none was set)
//   SUPABASE_URL                 same as VITE_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY    service role key — Project Settings -> API. NEVER use VITE_-prefixed vars for this, never commit it.
//   TARGET_USER_EMAIL            the Google account email that should own the migrated data

import { createClient } from '@supabase/supabase-js';

const {
  APPS_SCRIPT_URL,
  APPS_SCRIPT_PIN = '',
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  TARGET_USER_EMAIL,
} = process.env;

for (const [name, value] of Object.entries({ APPS_SCRIPT_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TARGET_USER_EMAIL })) {
  if (!value) throw new Error(`Missing required env var: ${name}`);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function findUserId(email) {
  let page = 1;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = data.users.find((u) => u.email === email);
    if (match) return match.id;
    if (data.users.length < 200) break;
    page += 1;
  }
  throw new Error(`No signed-up user found with email ${email}. They need to sign in with Google at least once first.`);
}

async function fetchOldData() {
  const res = await fetch(`${APPS_SCRIPT_URL}?action=getAll&pin=${encodeURIComponent(APPS_SCRIPT_PIN)}`);
  const data = await res.json();
  if (!data.ok) throw new Error(`Apps Script fetch failed: ${data.error}`);
  return data;
}

async function insertAll(table, rows) {
  if (rows.length === 0) return 0;
  const { error } = await supabase.from(table).insert(rows);
  if (error) throw new Error(`Insert into ${table} failed: ${error.message}`);
  return rows.length;
}

const userId = await findUserId(TARGET_USER_EMAIL);
console.log(`Migrating data for ${TARGET_USER_EMAIL} (${userId})...`);

const old = await fetchOldData();

const counts = {};

counts.expenses = await insertAll('expenses', old.expenses.map((e) => ({
  id: e.ID, user_id: userId, date: e.Date, category: e.Category, amount: Number(e.Amount), note: e.Note || '',
})));

counts.goals = await insertAll('goals', old.goals.map((g) => ({
  id: g.ID, user_id: userId, name: g.Name, type: g.Type,
  target_amount: g.TargetAmount ? Number(g.TargetAmount) : null,
  target_date: g.TargetDate || null, note: g.Note || '',
})));

counts.savings = await insertAll('savings', old.savings.map((s) => ({
  id: s.ID, user_id: userId, goal_id: s.GoalID, date: s.Date, amount: Number(s.Amount), note: s.Note || '',
})));

counts.debts = await insertAll('debts', old.debts.map((d) => ({
  id: d.ID, user_id: userId, name: d.Name, type: d.Type, amount: Number(d.Amount),
  note: d.Note || '', date: d.Date, paid: d.Paid === true || d.Paid === 'TRUE',
})));

counts.debt_payments = await insertAll('debt_payments', old.debtPayments.map((p) => ({
  id: p.ID, user_id: userId, debt_id: p.DebtID, date: p.Date, amount: Number(p.Amount), note: p.Note || '',
})));

counts.todos = await insertAll('todos', old.todos.map((t) => ({
  id: t.ID, user_id: userId, month: t.Month, text: t.Text, done: t.Done === true || t.Done === 'TRUE',
})));

counts.notes = await insertAll('notes', old.notes.map((n) => ({
  id: n.ID, user_id: userId, date: n.Date, title: n.Title || '', content: n.Content || '',
})));

counts.habits = await insertAll('habits', (old.habits || []).map((h) => ({
  id: h.ID, user_id: userId, name: h.Name,
})));

counts.habit_logs = await insertAll('habit_logs', (old.habitLogs || []).map((l) => ({
  id: l.ID, user_id: userId, habit_id: l.HabitID, date: l.Date,
})));

console.log('Done. Rows migrated:');
console.table(counts);
