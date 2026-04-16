import { NextRequest, NextResponse } from 'next/server';
import { FSSAI_SUMMARY, FSSAISummary } from '@/data/fssaiData';

let store: FSSAISummary = JSON.parse(JSON.stringify(FSSAI_SUMMARY));

function recompute(s: FSSAISummary): FSSAISummary {
  return {
    ...s,
    relabellerLicCompliance: s.relabellerInCurrentLic / s.totalMfgSites,
    productCompliance: s.totalProductInCurrentLic / s.totalProducts,
    pending: s.totalProducts - s.totalProductInCurrentLic,
  };
}

export async function GET() {
  // Return FSSAI data only — no longer computes or owns the Legal KPI value
  return NextResponse.json({ summary: store });
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json() as Partial<FSSAISummary>;
    store = recompute({ ...store, ...body });
    return NextResponse.json({ summary: store });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
