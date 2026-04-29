# Quality Dashboard — Sheets Integration Setup

This patch replaces the in-memory `let store = []` data with live reads from
your two Google Sheets, via a single shared Apps Script web app.

## What changed

```
NEW    apps-script/Code.gs              ← shared Apps Script (one deploy, both sheets)
NEW    src/lib/sheets.ts                ← server-side helper, calls Apps Script
NEW    .env.local.example               ← env var template

UPDATED src/app/api/cm-sites/route.ts   ← read-only, fetches from sheet
UPDATED src/app/api/fssai/route.ts      ← read-only, fetches from sheet
UPDATED src/components/CMSiteTable.tsx  ← read-only, live "Mosaic Overall", sync indicator
UPDATED src/components/FSSAIPanel.tsx   ← adds licence-pending column, totals row, sync indicator
UPDATED src/app/page.tsx                ← removes site-edit / fssai-edit handlers, auto-refresh every 60s
UPDATED src/data/cmSites.ts             ← types + color helpers only (stale 8-site array removed)
UPDATED src/data/fssaiData.ts           ← types only (stale hardcoded summary removed)

UNTOUCHED  /api/kpis, /api/ppm, KPICard, PPMPanel, EditModal, ThemeToggle, layout, globals
```

KPIs and PPM keep working exactly as before — they still use their own
hardcoded data and PATCH handlers. Only CM Sites and FSSAI moved to the sheet.

## Setup — 10 minutes

### 1. Create the Apps Script (one-time)

1. Go to <https://script.google.com> → **New project**.
2. Name it `Quality Dashboard API`.
3. Replace the default `Code.gs` with the contents of `apps-script/Code.gs`.
4. The two sheet IDs in the file are already filled in for your sheets.
   If you ever change them, edit the constants at the top.

### 2. Set the API token (one-time)

1. In the Apps Script editor, click the gear icon (**Project Settings**).
2. Scroll to **Script properties** → **Add script property**.
3. Property name: `API_TOKEN`
4. Value: a long random string. Generate one with:
   ```bash
   openssl rand -hex 32
   ```
5. **Save**.

The script reads this at request time, so rotating the token is just editing
this property — no redeploy needed.

### 3. Deploy as a web app

1. Click **Deploy** → **New deployment**.
2. Type: **Web app**.
3. Description: `v1`.
4. Execute as: **Me** (your account — that's how it can read private sheets).
5. Who has access: **Anyone**.
   The token gates access; this just lets requests reach the script without
   a Google login.
6. **Deploy** → grant the permission scopes when prompted.
7. Copy the **Web app URL** (ends in `/exec`).

### 4. Sanity-check the script

In a browser:

```
<your-/exec-url>?token=<your-token>&dataset=cm-sites
```

You should see JSON with `rows`, `columnAverages`, `mosaicOverall`. Try
`dataset=fssai` too. If you see a 401, the token doesn't match. If you see
HTML instead of JSON, the deployment isn't set to Anyone access.

### 5. Wire up Next.js

1. In the repo root, copy `.env.local.example` to `.env.local`.
2. Fill in the `/exec` URL and the same token.
3. In Vercel: **Settings → Environment Variables**, add:
   - `SHEETS_API_URL` = the `/exec` URL
   - `SHEETS_API_TOKEN` = the same token
4. Redeploy.

### 6. Test locally

```bash
npm run dev
```

Open the dashboard, click GMP Compliance to drill in — the CM site table
should show all 11 sites from the sheet (not the stale 8 from the old
hardcoded data). Click the Legal & Regulatory KPI — FSSAI panel should
show the live counts plus the "Endorsement Pending" column.

Now go edit a value in either sheet (e.g., bump Sapiens GMP from 2 to 3).
Within ~60 seconds, the dashboard reflects it. The sync indicator on each
panel shows when data was last pulled.

## How it works

- **Token never reaches the browser.** The Next.js API route reads
  `SHEETS_API_TOKEN` from server-only env, calls Apps Script with it, and
  returns just the JSON.
- **60s caching.** Both `getCmSites()` and `getFssai()` use Next.js
  `fetch(..., { next: { revalidate: 60 } })`. Apps Script gets hit at most
  once per minute per Vercel region.
- **Polling.** The homepage auto-refreshes every 60s, so the sync indicator
  stays current without a hard reload.
- **Failure isolation.** If one sheet fails (sheet renamed, token expired,
  Apps Script down), the other one and the KPI cards still render. The
  error banner at the top of the page shows what failed.

## Updating

- **Token rotation:** change Script Property → change Vercel env var → redeploy. No script edit.
- **New columns in the sheet:** the parser is label-driven (finds "CM site",
  "SOI", etc., by content), so reordering or inserting rows doesn't break it.
  New *columns* need a small change in `Code.gs` and `sheets.ts`.
- **Adding writes later:** add a `doPost` to the Apps Script with a token
  check, and a PATCH route in Next.js that proxies to it. The structure is
  ready for it; nothing here forecloses that.

## Privacy / security notes

- The script runs as your account, so it has access to anything you can read
  in your Drive. Don't add other sheets without intent.
- "Anyone with the link" on the deployment means anyone who has the URL can
  *attempt* a request, but the token check rejects them. Treat the URL as
  semi-public; treat the token as a secret.
- If you suspect the token is leaked, rotate it via Script Properties — old
  requests stop working immediately.
