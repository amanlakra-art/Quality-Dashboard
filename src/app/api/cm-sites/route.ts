import { NextRequest, NextResponse } from 'next/server';
import { sheetGet, sheetPatch } from '@/lib/sheets';
import type { CMSite } from '@/data/cmSites';
import { deriveGMPStatus } from '@/data/kpis';

export const dynamic = 'force-dynamic';

type CmSitesResponse = { sites: CMSite[]; overallGMPPct: number };

export async function GET() {
  try {
    const data = await sheetGet<CmSitesResponse>('cm-sites');
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<CMSite> & { name: string };
    const data = await sheetPatch<CmSitesResponse>('cm-sites', body);
    const site = data.sites.find(s => s.name === body.name);
    return NextResponse.json({
      site,
      overallGMPPct: data.overallGMPPct,
      ...deriveGMPStatus(data.overallGMPPct),
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
