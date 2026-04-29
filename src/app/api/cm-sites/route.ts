// src/app/api/cm-sites/route.ts
//
// Replaces the previous version that held data in `let siteStore = []` at
// module scope (which loses writes on Vercel cold starts and never wrote
// to anything persistent anyway).
//
// New behavior: read-only, sourced from Google Sheets via Apps Script.
// PATCH is intentionally removed — sheet is the source of truth, edits
// happen in the sheet itself.
//
// Backwards-compatible response shape: the existing homepage expects
// `{ sites, overallGMPPct }`. We keep that and add `meta` + `mosaicOverall`
// for the polished panel without breaking anything.

import { NextResponse } from 'next/server';
import { getCmSites, type CmSiteRow } from '@/lib/sheets';
import type { CMSite } from '@/data/cmSites';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const payload = await getCmSites();

    // Map the Apps Script shape to the legacy CMSite shape so the existing
    // CMSiteTable component and homepage keep working without a rewrite.
    // Key differences:
    //   sheet field          → legacy field
    //   infraResources       → infrastructure
    //   scorePct             → pct
    const sites: CMSite[] = payload.rows.map((r: CmSiteRow) => ({
      name: r.site,
      siteReadiness: r.siteReadiness,
      gmpCompliance: r.gmpCompliance,
      qmsCompliance: r.qmsCompliance,
      infrastructure: r.infraResources,
      avg: r.avg,
      pct: r.scorePct,
    }));

    // Compute overallGMPPct from live data. The previous version computed
    // this from the in-memory store; we do the same, just from the sheet.
    const validGMP = sites.filter((s) => s.gmpCompliance !== null);
    const avgGMP =
      validGMP.length > 0
        ? validGMP.reduce((acc, s) => acc + (s.gmpCompliance ?? 0), 0) /
          validGMP.length
        : 0;
    const overallGMPPct = (avgGMP / 5) * 100;

    return NextResponse.json({
      sites,
      overallGMPPct,
      // Extras for the polished panel — don't break old consumers.
      mosaicOverall: payload.mosaicOverall,
      columnAverages: payload.columnAverages,
      meta: { fetchedAt: payload.fetchedAt, source: 'google-sheets' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      {
        error: message,
        hint: 'Check SHEETS_API_URL / SHEETS_API_TOKEN env vars and that the Apps Script is deployed.',
      },
      { status: 500 }
    );
  }
}
