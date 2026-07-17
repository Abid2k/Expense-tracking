# Expense Tracker

A personal expense tracker with charts, a savings goal tracker, debt tracking, a monthly
to-do list, notes, and monthly reports — built with React and using a Google Sheet as its
database (no server or paid hosting needed).

Live site: https://Abid2k.github.io/Expense-tracking/

## Features

- Add expenses with date, category, amount (SAR) and notes
- Dashboard with a category pie chart, a daily spending trend chart, smart stats (average daily spend, projected month total, days left), and at-a-glance widgets for savings goals, debts, and this month's to-dos
- Savings: create multiple goals (e.g. "Monthly Savings", "Vacation 2027"), tagged Monthly/Yearly/One-time/General/Custom. Leave the target amount blank for open-ended savings with no specific goal — just a running total. Add an optional target date to see the monthly contribution needed to hit it on time. Edit any goal later if you make a mistake
- Debts: track things you owe or are owed; either log payments gradually and watch the progress bar, or just tick "Mark as Paid" to close one out instantly. Edit any debt later if you make a mistake
- Monthly to-do list
- Notes tab for freeform notes
- Reports page: monthly spending trend chart and a side-by-side month comparison (totals, % change, per-category diff)
- Light/dark mode toggle in the navbar (persists per browser, independent of your system setting)
- Privacy: lock the whole site behind an Owner PIN, with an optional separate Viewer PIN you can share with someone for read-only access
- All data is stored in your own Google Sheet, so it's private to you and easy to inspect/edit directly

## How it works

The website is a static React app hosted for free on GitHub Pages. It talks to a small
Google Apps Script "Web App" (also free, hosted on Google's infrastructure) which reads and
writes rows in a Google Sheet you own. There is no separate backend server or database to pay for.

## One-time setup

### 1. Create the Google Sheet backend

1. Go to [sheets.google.com](https://sheets.google.com) and create a new blank spreadsheet (e.g. name it "Expense Tracker Data").
2. In the sheet, open **Extensions → Apps Script**.
3. Delete any starter code in the editor, then paste in the entire contents of [`apps-script/Code.gs`](./apps-script/Code.gs) from this repo.
4. Click **Deploy → New deployment**.
5. Click the gear icon next to "Select type" and choose **Web app**.
6. Set:
   - **Execute as:** Me
   - **Who has access:** Anyone
7. Click **Deploy**. The first time, Google will ask you to authorize the script — approve it (you may see an "unverified app" warning since it's your own script; click **Advanced → Go to (project name)** to proceed).
8. Copy the **Web app URL** it gives you (looks like `https://script.google.com/macros/s/XXXXXXXXXXXX/exec`).

The script automatically creates all the sheets it needs the first time it runs
(`Expenses`, `Savings`, `Goals`, `Debts`, `DebtPayments`, `Todos`, `Notes`, `Settings`) — you
don't need to create these yourself. It also safely upgrades sheets created by older versions
of the script (e.g. adding the `Paid` column to `Debts`) without touching your existing data.

### 2. Connect the website to your sheet

1. Open the live site: https://Abid2k.github.io/Expense-tracking/
2. Go to **Settings**.
3. Paste the Web app URL you copied above.
4. Click **Test Connection**, then **Save**.

Your data now lives in your Google Sheet — you can open the sheet directly at any time to view or edit it.

> **Note:** each browser/device stores the Web App URL locally (in `localStorage`). If you use the site from a new browser or device, you'll need to paste the URL into Settings again there too — the underlying data is the same shared Google Sheet either way.

### 3. Make it private (recommended)

By default, anyone who has both your GitHub Pages link *and* your Apps Script URL could see
and edit your data — so it's worth locking it down:

1. On the live site, go to **Settings**.
2. Under **Privacy — Access PINs**, set an **Owner PIN**. This is checked on the Google Sheet
   side (not just hidden in the page), so it's real protection, not just cosmetic.
3. You'll immediately be asked to re-enter that PIN to confirm — this is expected.
4. Once set, anyone loading the site (including you, on a new browser/device) must enter the
   correct PIN before any data loads.

**To share read-only access with someone** (e.g. a family member): set a separate **Viewer PIN**
in the same Settings section, and give that person the site link + the Viewer PIN. They'll be
able to see everything, but every add/edit/delete action is rejected for that PIN — enforced by
the script itself, not just hidden buttons in the UI.

Use the **Lock** button in the navbar any time to end your session on a shared/public computer.

### Updating the script later

If you ever change `apps-script/Code.gs` in this repo, copy the updated code into the Apps Script editor for your sheet, then **Deploy → Manage deployments → edit (pencil icon) → New version → Deploy**. The Web App URL stays the same.

## Local development

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
- Recharts (pie chart + bar charts)
- Google Apps Script + Google Sheets (data storage, no external database)
