import { NextRequest, NextResponse } from 'next/server';
import { CM_SITES, CMSite, MOSAIC_OVERALL } from '@/data/cmSites';
import { deriveGMPStatus } from '@/data/kpis';

let siteStore: CMSite[] = JSON.parse(JSON.stringify(CM_SITES));

function recomputeOverall() {
  const validGMP = siteStore.filter(s => s.gmpCompliance !== null);
  const avgGMP = validGMP.reduce((s, x) => s + (x.gmpCompliance ?? 0), 0) / validGMP.length;
  return { rawAvg: avgGMP, pct: (avgGMP / 5) * 100 };
}

export async function GET() {
  const overall = recomputeOverall();
  return NextResponse.json({ sites: siteStore, overallGMPPct: overall.pct });
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json() as Partial<CMSite> & { name: string };
    const { name, ...updates } = body;
    const idx = siteStore.findIndex(s => s.name === name);
    if (idx === -1) return NextResponse.json({ error: 'Site not found' }, { status: 404 });

    siteStore[idx] = { ...siteStore[idx], ...updates };
    // Recompute avg & pct for this site
    const s = siteStore[idx];
    const vals = [s.siteReadiness, s.gmpCompliance, s.qmsCompliance, s.infrastructure].filter(v => v !== null) as number[];
    if (vals.length > 0) {
      siteStore[idx].avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      siteStore[idx].pct = (siteStore[idx].avg! / 5) * 100;
    }

    const overall = recomputeOverall();
    return NextResponse.json({ site: siteStore[idx], overallGMPPct: overall.pct, ...deriveGMPStatus(overall.pct) });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
