// src/app/api/cm-sites/route.ts
//
// Read-only, sourced from Google Sheets via Apps Script. PATCH was removed
// when we moved the source of truth to the sheet.
//
// `overallGMPPct` is sourced from the sheet's column-averages row (the row
// just below the per-site rows in the Summary tab). That row's score-percent
// cell is the sheet's own composite "overall CM site score". Using this
// value means the KPI card always matches what quality leaders see in
// the sheet (e.g. cell G15 = 65.23% in the current data).
//
// Fall back to averaging per-site scorePct only if the sheet didn't have
// that row populated.

import { NextResponse } from 'next/server';
import { getCmSites, type CmSiteRow } from '@/lib/sheets';
import type { CMSite } from '@/data/cmSites';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const payload = await getCmSites();

    // Map sheet shape → legacy CMSite shape so the existing components
    // and homepage keep working unchanged.
    const sites: CMSite[] = payload.rows.map((r: CmSiteRow) => ({
      name: r.site,
      siteReadiness: r.siteReadiness,
      gmpCompliance: r.gmpCompliance,
      qmsCompliance: r.qmsCompliance,
      infrastructure: r.infraResources,
      avg: r.avg,
      pct: r.scorePct,
    }));

    let overallGMPPct: number | null = payload.columnAverages.scorePct;
    if (overallGMPPct === null) {
      const validPct = sites
        .map((s) => s.pct)
        .filter((v): v is number => typeof v === 'number');
      overallGMPPct =
        validPct.length > 0
          ? validPct.reduce((a, b) => a + b, 0) / validPct.length
          : 0;
    }

    return NextResponse.json({
      sites,
      overallGMPPct,
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
