// src/app/api/fssai/route.ts
//
// Read-only, sourced from the FSSAI Summary sheet via Apps Script.
// Returns a backwards-compatible `summary` object so the existing homepage
// (which calls `getLegalSubMetrics(fssai)`) keeps working unchanged.
// Adds `bySoi` / `totals` with the new "endorsement pending" column from
// the actual sheet (which the hardcoded data didn't have).

import { NextResponse } from 'next/server';
import { sheetGet } from '@/lib/sheets';
import type { FSSAISummary, SOIRow } from '@/data/fssaiData';

type FssaiSheetPayload = {
  summary: {
    totalMfgSite: number | null;
    relablerInCurrentLicence: number | null;
    relablerCompliancePct: number | null;
    totalProduct: number | null;
    totalProductInCurrentLicence: number | null;
    pending: number | null;
    productCompliancePct: number | null;
  };
  bySoi: { soi: string; totalProducts: number | null; awaitedReview: number | null; received: number | null; licencePending: number | null; pendingPct: number | null; }[];
  totals: { soi: string; totalProducts: number | null; awaitedReview: number | null; received: number | null; licencePending: number | null; pendingPct: number | null; } | null;
  fetchedAt: string;
};

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const payload = await sheetGet<FssaiSheetPayload>('fssai');
    const s = payload.summary;

    // ---- Legacy shape mapping ----
    // The homepage's getLegalSubMetrics() reads:
    //   relabellerLicCompliance (0-1 fraction), productCompliance (0-1),
    //   totalMfgSites, relabellerInCurrentLic, totalProducts,
    //   totalProductInCurrentLic, pending, soiBreakdown
    // The Apps Script returns 0-100 percents — we divide by 100 for legacy.

    const legacySoi: SOIRow[] = payload.bySoi.map((r) => ({
      category: r.soi,
      total: r.totalProducts ?? 0,
      awaitedForReview: r.awaitedReview ?? 0,
      received: r.received ?? 0,
    }));

    const summary: FSSAISummary = {
      totalMfgSites: s.totalMfgSite ?? 0,
      relabellerInCurrentLic: s.relablerInCurrentLicence ?? 0,
      relabellerLicCompliance:
        s.relablerCompliancePct !== null ? s.relablerCompliancePct / 100 : 0,
      totalProducts: s.totalProduct ?? 0,
      totalProductInCurrentLic: s.totalProductInCurrentLicence ?? 0,
      pending: s.pending ?? 0,
      productCompliance:
        s.productCompliancePct !== null ? s.productCompliancePct / 100 : 0,
      soiBreakdown: legacySoi,
    };

    return NextResponse.json({
      summary,
      // New rich shape — used by the upgraded FSSAI panel.
      bySoi: payload.bySoi,
      totals: payload.totals,
      meta: { fetchedAt: payload.fetchedAt, source: 'google-sheets' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    // Return safe zero-state so the page doesn't crash when sheet isn't configured
    const emptySummary: FSSAISummary = {
      totalMfgSites: 0, relabellerInCurrentLic: 0, relabellerLicCompliance: 0,
      totalProducts: 0, totalProductInCurrentLic: 0, pending: 0,
      productCompliance: 0, soiBreakdown: [],
    };
    return NextResponse.json({
      summary: emptySummary, bySoi: [], totals: null,
      meta: { fetchedAt: new Date().toISOString(), source: 'fallback' },
      error: message,
    });
  }
}
