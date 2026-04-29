// src/lib/sheets.ts
// Server-side helper for talking to the Apps Script web app.
// Token never reaches the browser — env vars are read here and the request
// is made from the Vercel function. Responses are cached for 60s to keep
// Apps Script quota usage low.

const SHEETS_API_URL = process.env.SHEETS_API_URL;
const SHEETS_API_TOKEN = process.env.SHEETS_API_TOKEN;

if (!SHEETS_API_URL || !SHEETS_API_TOKEN) {
  if (process.env.NODE_ENV !== 'test') {
    // Soft-warn at module load. Routes will return a clean error.
    console.warn('[sheets] SHEETS_API_URL or SHEETS_API_TOKEN missing');
  }
}

// ---- Types ----------------------------------------------------------------

export type CmSiteRow = {
  site: string;
  siteReadiness: number | null;
  gmpCompliance: number | null;
  qmsCompliance: number | null;
  infraResources: number | null;
  avg: number | null;
  scorePct: number | null; // 0..100
};

export type CmSitesPayload = {
  rows: CmSiteRow[];
  columnAverages: {
    siteReadiness: number | null;
    gmpCompliance: number | null;
    qmsCompliance: number | null;
    infraResources: number | null;
    avg: number | null;
    scorePct: number | null;
  };
  mosaicOverall: {
    siteReadiness: number | null;
    gmpCompliance: number | null;
    qmsCompliance: number | null;
    infraResources: number | null;
    scorePct: number | null;
  };
  fetchedAt: string;
};

export type FssaiSummary = {
  totalMfgSite: number | null;
  relablerInCurrentLicence: number | null;
  relablerCompliancePct: number | null;
  totalProduct: number | null;
  totalProductInCurrentLicence: number | null;
  pending: number | null;
  productCompliancePct: number | null;
};

export type FssaiSoiRow = {
  soi: string;
  totalProducts: number | null;
  awaitedReview: number | null;
  received: number | null;
  licencePending: number | null;
  pendingPct: number | null;
};

export type FssaiPayload = {
  summary: FssaiSummary;
  bySoi: FssaiSoiRow[];
  totals: FssaiSoiRow | null;
  fetchedAt: string;
};

// ---- Low-level fetch ------------------------------------------------------

async function callAppsScript<T>(dataset: 'cm-sites' | 'fssai'): Promise<T> {
  if (!SHEETS_API_URL || !SHEETS_API_TOKEN) {
    throw new Error(
      'Sheets API not configured. Set SHEETS_API_URL and SHEETS_API_TOKEN ' +
        'in .env.local (and in Vercel project env).'
    );
  }

  // Apps Script /exec issues a 302 redirect to googleusercontent.com on first
  // hit — fetch follows by default, which is what we want.
  const url = `${SHEETS_API_URL}?token=${encodeURIComponent(SHEETS_API_TOKEN)}&dataset=${dataset}`;

  // Next.js fetch caching: revalidate every 60 seconds. Keeps Apps Script
  // quota safe and the dashboard snappy. Edits to the sheet are reflected
  // within ≤60s.
  const res = await fetch(url, { next: { revalidate: 60 } });

  if (!res.ok) {
    throw new Error(`Apps Script HTTP ${res.status}`);
  }

  const text = await res.text();

  // If the script is misdeployed (e.g., not published, or login required),
  // we'd get HTML back. Catch that with a friendlier error.
  if (text.trimStart().startsWith('<')) {
    throw new Error(
      'Apps Script returned HTML instead of JSON — check that the web app ' +
        'is deployed with "Anyone" access and the URL ends with /exec.'
    );
  }

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Apps Script returned non-JSON: ' + text.slice(0, 200));
  }

  // Apps Script can't set HTTP status codes; we encode them in the body.
  if (data && typeof data === 'object' && '_status' in (data as object)) {
    const errBody = data as { error?: string; _status?: number };
    throw new Error(errBody.error || `Apps Script error ${errBody._status}`);
  }
  if (data && typeof data === 'object' && 'error' in (data as object)) {
    throw new Error((data as { error: string }).error);
  }

  return data as T;
}

// ---- Public API -----------------------------------------------------------

export function getCmSites(): Promise<CmSitesPayload> {
  return callAppsScript<CmSitesPayload>('cm-sites');
}

export function getFssai(): Promise<FssaiPayload> {
  return callAppsScript<FssaiPayload>('fssai');
}
