// ============================================================
//  cmSites.ts — Types and color helpers only.
//  Data now lives in the Google Sheet and is fetched via /api/cm-sites.
//  The previously-hardcoded CM_SITES array (with stale 8-site data) is
//  deliberately removed — keeping it would risk components rendering
//  outdated data if they import the wrong source.
//
//  Color rules from the Summary tab:
//    >=75% Dark Green, 60-74% Light Green, 50-59% Amber, <50% Red
// ============================================================

export interface CMSite {
  name: string;
  siteReadiness: number | null;
  gmpCompliance: number | null;
  qmsCompliance: number | null;
  infrastructure: number | null;
  avg: number | null;
  pct: number | null; // (avg / 5) * 100
}

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
