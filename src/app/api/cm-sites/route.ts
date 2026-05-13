import { NextResponse } from 'next/server';
import { sheetGet } from '@/lib/sheets';
import type { CMSite } from '@/data/cmSites';
import { deriveGMPStatus } from '@/data/kpis';

export const dynamic = 'force-dynamic';

// Shape returned by the deployed Apps Script (standalone multi-sheet version)
type DeployedRow = {
  site: string;
  siteReadiness: number | null;
  gmpCompliance: number | null;
  qmsCompliance: number | null;
  infraResources: number | null;
  avg: number | null;
  scorePct: number | null;
};
type DeployedMosaicOverall = {
  siteReadiness: number | null;
  gmpCompliance: number | null;
  qmsCompliance: number | null;
  infraResources: number | null;
  scorePct: number | null;
};
type DeployedCmSites = {
  rows: DeployedRow[];
  mosaicOverall: DeployedMosaicOverall;
  columnAverages: DeployedMosaicOverall & { avg: number | null };
  fetchedAt: string;
};

function mapToSite(r: DeployedRow): CMSite {
  return {
    name: r.site,
    siteReadiness: r.siteReadiness,
    gmpCompliance: r.gmpCompliance,
    qmsCompliance: r.qmsCompliance,
    infrastructure: r.infraResources,
    avg: r.avg,
    pct: r.scorePct,
  };
}

export async function GET() {
  try {
    const raw = await sheetGet<DeployedCmSites>('cm-sites');
    const sites: CMSite[] = (raw.rows ?? []).map(mapToSite);

    // overallGMPPct: use mosaicOverall.scorePct if present (= (avgScore/5)*100)
    // otherwise fall back to computing from individual site gmpCompliance values
    let overallGMPPct = raw.mosaicOverall?.scorePct ?? null;
    if (overallGMPPct === null) {
      const valid = sites.filter(s => s.gmpCompliance !== null);
      overallGMPPct = valid.length
        ? (valid.reduce((a, s) => a + (s.gmpCompliance ?? 0), 0) / valid.length / 5) * 100
        : 0;
    }

    return NextResponse.json({
      sites,
      overallGMPPct,
      mosaicOverall: raw.mosaicOverall ?? null,
      meta: { fetchedAt: raw.fetchedAt, source: 'google-sheets' },
    });
  } catch (e) {
    return NextResponse.json({
      sites: [], overallGMPPct: 0, mosaicOverall: null, meta: null,
      error: (e as Error).message,
    });
  }
}
