// ============================================================
//  cmSites.ts — Parsed from CM_Site_Scorecard.xlsx -> Summary tab
//  Color rules from Summary:
//    >=75% -> Dark Green, 60-74% -> Light Green, 50-59% -> Amber, <50% -> Red
// ============================================================

export interface CMSite {
  name: string;
  siteReadiness: number | null;
  gmpCompliance: number | null;
  qmsCompliance: number | null;
  infrastructure: number | null;
  avg: number | null;
  pct: number | null; // avg/5 * 100
}

// Directly from Summary sheet rows 1-8
export const CM_SITES: CMSite[] = [
  { name: 'NG Electro Baddi',           siteReadiness: 4,   gmpCompliance: 4,   qmsCompliance: 4,   infrastructure: 4,   avg: 4,     pct: 80.00 },
  { name: 'Sapiens, Baddi',             siteReadiness: 2.5, gmpCompliance: 2,   qmsCompliance: 2,   infrastructure: 2.5, avg: 2.25,  pct: 45.00 },
  { name: 'Functional Food, Coimbatore',siteReadiness: 3,   gmpCompliance: 3.5, qmsCompliance: 3.5, infrastructure: 3,   avg: 3.25,  pct: 65.00 },
  { name: 'Kreata Foods',               siteReadiness: 4,   gmpCompliance: 4,   qmsCompliance: 4,   infrastructure: 4.5, avg: 4.125, pct: 82.50 },
  { name: 'Advama Gummies & More',      siteReadiness: null,gmpCompliance: 4,   qmsCompliance: 3.5, infrastructure: 3,   avg: 3.5,   pct: 70.00 },
  { name: 'Muffin Man',                 siteReadiness: 1,   gmpCompliance: 2,   qmsCompliance: 1.5, infrastructure: 1.5, avg: 1.5,   pct: 30.00 },
  { name: 'Pragati Packaging',          siteReadiness: 4,   gmpCompliance: 4,   qmsCompliance: 4,   infrastructure: 4.5, avg: 4.125, pct: 82.50 },
  { name: 'H&H Indore',                 siteReadiness: 4,   gmpCompliance: 4,   qmsCompliance: 3,   infrastructure: 4,   avg: 3.75,  pct: 75.00 },
];

// Mosaic Overall CM site Score row (row 10 in Summary):
// Site Readiness: 0.642857, GMP: 0.6875, QMS: 0.6375, Infra: 0.675
export const MOSAIC_OVERALL = {
  siteReadiness: 0.6429,
  gmpCompliance: 0.6875,
  qmsCompliance: 0.6375,
  infrastructure: 0.6750,
};

export function getSiteColor(pct: number | null): string {
  if (pct === null) return '#6B7280';
  if (pct >= 75) return '#00D97E';
  if (pct >= 60) return '#4ADE80';
  if (pct >= 50) return '#F59E0B';
  return '#EF4444';
}

export function getSiteStatusLabel(pct: number | null): string {
  if (pct === null) return 'N/A';
  if (pct >= 75) return 'Dark Green';
  if (pct >= 60) return 'Light Green';
  if (pct >= 50) return 'Amber';
  return 'Red';
}
