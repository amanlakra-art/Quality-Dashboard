import { NextRequest, NextResponse } from 'next/server';
import { FSSAI_SUMMARY, FSSAISummary } from '@/data/fssaiData';
import { deriveLegalStatus } from '@/data/kpis';

let store: FSSAISummary = JSON.parse(JSON.stringify(FSSAI_SUMMARY));

function recompute(s: FSSAISummary): FSSAISummary {
  return {
    ...s,
    relabellerLicCompliance: s.relabellerInCurrentLic / s.totalMfgSites,
    productCompliance: s.totalProductInCurrentLic / s.totalProducts,
    pending: s.totalProducts - s.totalProductInCurrentLic,
  };
}

function legalScore(s: FSSAISummary): number {
  // Weighted: relabeller compliance 60% + product compliance 40%, scaled to 0-100
  return Math.round((s.relabellerLicCompliance * 0.6 + s.productCompliance * 0.4) * 100);
}

export async function GET() {
  const score = legalScore(store);
  return NextResponse.json({ summary: store, legalScore: score, ...deriveLegalStatus(score) });
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json() as Partial<FSSAISummary>;
    store = recompute({ ...store, ...body });
    const score = legalScore(store);
    return NextResponse.json({ summary: store, legalScore: score, ...deriveLegalStatus(score) });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
