-- Expense Tracker — Supabase schema.
-- Apply once in the Supabase SQL editor for a new project. Source of truth
-- for the schema — diff future changes against this file, don't run it from
-- the app.
--
-- Every table is owned by exactly one auth user (auth.uid()) and locked
-- down with row level security, so each signed-in Google account only ever
-- sees its own rows. There is no cross-account sharing.

create table expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  date date not null,
  category text not null,
  amount numeric(12,2) not null,
  note text,
  created_at timestamptz not null default now()
);

create table goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  name text not null,
  type text not null, -- Monthly / Yearly / One-time / General / Custom
  target_amount numeric(12,2), -- null = open-ended goal, no target
  target_date date,
  note text,
  created_at timestamptz not null default now()
);

-- Savings contributions — a ledger, not a running total, so history and
-- per-entry notes/dates survive.
create table savings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  goal_id uuid not null references goals(id) on delete cascade,
  date date not null,
  amount numeric(12,2) not null,
  note text,
  created_at timestamptz not null default now()
);

create table debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  name text not null,
  type text not null, -- 'I Owe' / 'Owed to Me'
  amount numeric(12,2) not null,
  note text,
  date date,
  paid boolean not null default false,
  created_at timestamptz not null default now()
);

-- Debt payments — a ledger, same reasoning as savings.
create table debt_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  debt_id uuid not null references debts(id) on delete cascade,
  date date not null,
  amount numeric(12,2) not null,
  note text,
  created_at timestamptz not null default now()
);

create table todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  month text not null, -- 'YYYY-MM'
  text text not null,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

create table notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  date date,
  title text,
  content text,
  created_at timestamptz not null default now()
);

create table habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- A row's presence means the habit was done that day — no separate "done"
-- flag needed. Unchecking a day deletes the row.
create table habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  habit_id uuid not null references habits(id) on delete cascade,
  date date not null,
  created_at timestamptz not null default now(),
  unique (habit_id, date)
);

create index on expenses (user_id, date desc);
create index on savings (user_id, goal_id);
create index on debt_payments (user_id, debt_id);
create index on todos (user_id, month);
create index on habit_logs (user_id, habit_id, date);

-- ---- Row level security ----
-- Identical 4-policy set on every table: a user can select/insert/update/
-- delete only rows where user_id matches their own auth.uid().

alter table expenses enable row level security;
alter table goals enable row level security;
alter table savings enable row level security;
alter table debts enable row level security;
alter table debt_payments enable row level security;
alter table todos enable row level security;
alter table notes enable row level security;
alter table habits enable row level security;
alter table habit_logs enable row level security;

create policy "select own" on expenses for select using (auth.uid() = user_id);
create policy "insert own" on expenses for insert with check (auth.uid() = user_id);
create policy "update own" on expenses for update using (auth.uid() = user_id);
create policy "delete own" on expenses for delete using (auth.uid() = user_id);

create policy "select own" on goals for select using (auth.uid() = user_id);
create policy "insert own" on goals for insert with check (auth.uid() = user_id);
create policy "update own" on goals for update using (auth.uid() = user_id);
create policy "delete own" on goals for delete using (auth.uid() = user_id);

create policy "select own" on savings for select using (auth.uid() = user_id);
create policy "insert own" on savings for insert with check (auth.uid() = user_id);
create policy "update own" on savings for update using (auth.uid() = user_id);
create policy "delete own" on savings for delete using (auth.uid() = user_id);

create policy "select own" on debts for select using (auth.uid() = user_id);
create policy "insert own" on debts for insert with check (auth.uid() = user_id);
create policy "update own" on debts for update using (auth.uid() = user_id);
create policy "delete own" on debts for delete using (auth.uid() = user_id);

create policy "select own" on debt_payments for select using (auth.uid() = user_id);
create policy "insert own" on debt_payments for insert with check (auth.uid() = user_id);
create policy "update own" on debt_payments for update using (auth.uid() = user_id);
create policy "delete own" on debt_payments for delete using (auth.uid() = user_id);

create policy "select own" on todos for select using (auth.uid() = user_id);
create policy "insert own" on todos for insert with check (auth.uid() = user_id);
create policy "update own" on todos for update using (auth.uid() = user_id);
create policy "delete own" on todos for delete using (auth.uid() = user_id);

create policy "select own" on notes for select using (auth.uid() = user_id);
create policy "insert own" on notes for insert with check (auth.uid() = user_id);
create policy "update own" on notes for update using (auth.uid() = user_id);
create policy "delete own" on notes for delete using (auth.uid() = user_id);

create policy "select own" on habits for select using (auth.uid() = user_id);
create policy "insert own" on habits for insert with check (auth.uid() = user_id);
create policy "update own" on habits for update using (auth.uid() = user_id);
create policy "delete own" on habits for delete using (auth.uid() = user_id);

create policy "select own" on habit_logs for select using (auth.uid() = user_id);
create policy "insert own" on habit_logs for insert with check (auth.uid() = user_id);
create policy "update own" on habit_logs for update using (auth.uid() = user_id);
create policy "delete own" on habit_logs for delete using (auth.uid() = user_id);
