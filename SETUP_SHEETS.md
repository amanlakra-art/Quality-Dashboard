# Google Sheets sync — setup

## 1. Deploy Apps Script

1. Open your sheet → **Extensions → Apps Script**.
2. Delete the default `Code.gs`, paste the contents of `apps-script/Code.gs`.
3. Edit two constants at the top:
   - `SHEET_ID` — already set for your current sheet; change if you move it.
   - `TOKEN` — replace with a long random string (e.g. `openssl rand -hex 32`). Keep this secret.
4. **Deploy → New deployment → Type: Web app**
   - Description: `quality-dashboard-api`
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click **Deploy**, authorize, copy the `/exec` URL.
5. When you change the script later: **Manage deployments → pencil icon → Version: New version → Deploy**. The URL stays the same.

## 2. Set Vercel env vars

Vercel dashboard → your project → Settings → Environment Variables. Add for **Production + Preview + Development**:

```
SHEETS_API_URL   = https://script.google.com/macros/s/AKfy.../exec
SHEETS_API_TOKEN = <same token you put in Code.gs>
```

Also add them to `.env.local` for `npm run dev`.

Redeploy after setting env vars.

## 3. Verify

- `GET /api/cm-sites` should return live sheet data.
- Editing a site in the UI should write to the sheet — refresh the Google Sheet tab to confirm.

## 4. Extending to fssai / ppm / kpis

The `cm-sites` route is the reference pattern. For each other entity:

1. **Google Sheet**: add or reuse a tab with clear column layout.
2. **Apps Script `Code.gs`**: add `_getFssai()` / `_patchFssai()` (same pattern as `_getCmSites`), then route them in `doGet` / `doPost` by `entity === 'fssai'`.
3. **Next.js route**: replace the in-memory `let store = ...` with `sheetGet('fssai')` / `sheetPatch('fssai', body)`.
4. **Redeploy** the Apps Script (new version) and push to Vercel.

## 5. Highlights tab

The `Highlights` tab is **created automatically** by Apps Script on the first write — you don't need to create it manually.

Column layout (auto-created with header row):

| A — id | B — text | C — weekStart | D — createdAt |
|--------|----------|---------------|---------------|
| UUID | Highlight text | `YYYY-MM-DD` (Monday) | ISO timestamp |

No extra env vars needed — the existing `SHEETS_API_URL` and `SHEETS_API_TOKEN` cover this entity. After redeploying `Code.gs` (new version), the endpoint responds to `entity=highlights` in GET and POST.

## Gotchas

- **Never** expose `SHEETS_API_TOKEN` to the browser. It only belongs in server-side code (API routes) and Vercel env vars.
- Apps Script has quotas (~20k reads/day for free). Fine for an internal dashboard. If you want caching, add `unstable_cache` or an in-memory TTL cache in `lib/sheets.ts`.
- If you add/remove rows, update `CM_LAST_ROW` in `Code.gs` or change it to use `getLastRow()`.
- `redirect: 'follow'` in the fetch is load-bearing — Apps Script issues a 302 to `googleusercontent.com` for the actual payload.
