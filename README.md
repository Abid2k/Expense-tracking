# Expense Tracker

A personal expense tracker with charts, a savings goal tracker, debt tracking, a monthly
to-do list, notes, a daily habit tracker, and monthly reports — built with React. Sign in
with Google; your data lives in your own private Supabase account, isolated from every
other user.

Live site: https://Abid2k.github.io/Expense-tracking/

## Features

- Add expenses with date, category, amount (in your own currency) and notes
- Pick your name, country, and currency on first sign-in — every amount in the app displays in your chosen currency
- Dashboard with a category pie chart, a daily spending trend chart, smart stats (average daily spend, projected month total, days left), and at-a-glance widgets for savings goals, debts, and this month's to-dos
- Savings: create multiple goals (e.g. "Monthly Savings", "Vacation 2027"), tagged Monthly/Yearly/One-time/General/Custom. Leave the target amount blank for open-ended savings with no specific goal — just a running total. Add an optional target date to see the monthly contribution needed to hit it on time. Edit any goal later if you make a mistake
- Debts: track things you owe or are owed; either log payments gradually and watch the progress bar, or just tick "Mark as Paid" to close one out instantly. Edit any debt later if you make a mistake
- Monthly to-do list
- Daily habit tracker: a 31-day grid per habit, tap a day to mark it done, plus a monthly progress chart
- Notes tab for freeform notes
- Reports page: monthly spending trend chart and a side-by-side month comparison (totals, % change, per-category diff)
- Light/dark mode toggle in the navbar (persists per browser, independent of your system setting)
- Sign in with your Google account — no passwords, no PINs. Your data is private to your account; nobody else can see or share it
- Add it to your phone's home screen for a one-tap app icon (see below)

## How it works

The website is a static React app hosted for free on GitHub Pages. It talks directly to
[Supabase](https://supabase.com) (hosted Postgres + Auth) — there's no custom backend server.
Google is the identity provider (via Supabase Auth); Postgres row-level security ensures each
signed-in account only ever sees its own rows.

## One-time setup (for running your own copy)

The live site above already has this configured. These steps are only needed if you're
deploying your own fork.

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. In the SQL Editor, paste and run the contents of [`supabase/schema.sql`](./supabase/schema.sql) from this repo. This creates all 9 tables and their row-level-security policies.
3. Under **Project Settings → API**, note your **Project URL** and **anon public key** — you'll need these below.

### 2. Set up Google sign-in

1. In [Google Cloud Console](https://console.cloud.google.com), create (or select) a project → **APIs & Services → Credentials → Create OAuth client ID** (type: Web application).
   - **Authorized redirect URI:** `https://<your-project-ref>.supabase.co/auth/v1/callback` (Supabase shows you this exact URL in step 2 below).
   - **Authorized JavaScript origins:** your GitHub Pages URL, plus `http://localhost:5173` for local dev.
2. Copy the generated **Client ID** and **Client Secret**.
3. In the Supabase Dashboard → **Authentication → Providers → Google**, paste the Client ID + Secret and enable the provider.
4. In Supabase Dashboard → **Authentication → URL Configuration**, set **Site URL** to your GitHub Pages URL, and add both the GitHub Pages URL and `localhost:5173` to **Redirect URLs**.

### 3. Configure the app

Copy `.env.example` to `.env.local` and fill in your Supabase Project URL and anon key:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

For the deployed GitHub Pages build, add the same two values as **repository secrets**
(**Settings → Secrets and variables → Actions**) named `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` — the deploy workflow reads them at build time.

### 4. Migrate data from the old Google Sheet version (optional, one-time)

If you used the previous PIN/Google Sheet version of this app and want to carry that history
into your new account:

1. Sign in with Google on the new site at least once (this creates your `auth.users` row).
2. Create `.env.migrate` in the project root (gitignored — never commit it) with:
   ```
   APPS_SCRIPT_URL=https://script.google.com/macros/s/XXXXXXXX/exec
   APPS_SCRIPT_PIN=your-old-owner-pin
   SUPABASE_URL=https://your-project-ref.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   TARGET_USER_EMAIL=you@gmail.com
   ```
   The service role key is under **Project Settings → API** — treat it like a password, it
   bypasses row-level security entirely.
3. Run `npm run migrate`. It prints a row count per table when done.

This only needs to run once — it's a standalone script, not part of the deployed app.

### 5. Add it to your phone's home screen (recommended)

The site works in any mobile browser as-is, but adding it to your home screen gives you a
one-tap app icon with no browser address bar, so logging an expense is as fast as opening any
other app:

- **iPhone (Safari):** open the live site → tap the Share icon → **Add to Home Screen**.
- **Android (Chrome):** open the live site → tap the ⋮ menu → **Add to Home screen** / **Install app**.

You only need to do this once. After that, your Google sign-in session stays saved on that
phone, so opening the icon takes you straight to your dashboard.

## Local development

Copy `.env.example` to `.env.local` and fill in your Supabase project URL + anon key (see
setup above), then:

```bash
npm install
npm run dev
```

## Deployment

Pushing to `main` automatically builds and deploys the site to GitHub Pages via
[`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml). In the repo's
**Settings → Pages**, make sure "Source" is set to **GitHub Actions**.

## Tech stack

- React + Vite
- react-router-dom (HashRouter, for GitHub Pages compatibility)
- Recharts (pie chart, bar charts, line chart)
- Supabase (Postgres + Auth) — Google sign-in, row-level security for per-user data isolation
