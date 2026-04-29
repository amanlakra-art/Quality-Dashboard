// ============================================================
//  fssaiData.ts — Types only.
//  Data now lives in the FSSAI 3PL Manufacture Google Sheet and is fetched
//  via /api/fssai. Stale hardcoded summary removed.
// ============================================================

export interface SOIRow {
  category: string;
  total: number;
  awaitedForReview: number;
  received: number;
}

export interface FSSAISummary {
  totalMfgSites: number;
  relabellerInCurrentLic: number;
  relabellerLicCompliance: number;  // 0..1 fraction (kept for backward compat)
  totalProducts: number;
  totalProductInCurrentLic: number;
  pending: number;
  productCompliance: number;        // 0..1 fraction
  soiBreakdown: SOIRow[];
}
