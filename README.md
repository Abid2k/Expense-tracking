# Expense Tracker

A personal expense tracker with charts, a savings goal tracker, and monthly reports —
built with React and using a Google Sheet as its database (no server or paid hosting needed).

Live site: https://Abid2k.github.io/Expense-tracking/

## Features

- Add expenses with date, category, amount (SAR) and notes
- Dashboard pie chart of spending by category, per month
- Savings goal: set a target amount and add contributions any time; see progress as a bar
- Reports page: monthly spending trend chart and a side-by-side month comparison (totals, % change, per-category diff)
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

The script automatically creates three sheets the first time it runs: `Expenses`, `Savings`, and `Settings` — you don't need to create these yourself.

### 2. Connect the website to your sheet

1. Open the live site: https://Abid2k.github.io/Expense-tracking/
2. Go to **Settings**.
3. Paste the Web app URL you copied above.
4. Click **Test Connection**, then **Save**.

Your data now lives in your Google Sheet — you can open the sheet directly at any time to view or edit it.

> **Note:** each browser/device stores the Web App URL locally (in `localStorage`). If you use the site from a new browser or device, you'll need to paste the URL into Settings again there too — the underlying data is the same shared Google Sheet either way.

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
