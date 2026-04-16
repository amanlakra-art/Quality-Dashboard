import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_KPIS, KPI, deriveGMPStatus, deriveLegalStatus, PPM_KPI_TEMPLATE } from '@/data/kpis';
import { DEFAULT_PPM_SETTINGS, computeWeightedPPM, derivePPMStatus, PPM_DATA } from '@/data/ppmData';

// Build initial KPI store once at module load
function buildInitialStore(): KPI[] {
  const base = JSON.parse(JSON.stringify(DEFAULT_KPIS)) as KPI[];
  const initialPPM = computeWeightedPPM(PPM_DATA, DEFAULT_PPM_SETTINGS);
  const ppmDerived = derivePPMStatus(initialPPM, DEFAULT_PPM_SETTINGS);
  const ppmKPI: KPI = {
    ...PPM_KPI_TEMPLATE,
    value: initialPPM,
    status: ppmDerived.status as KPI['status'],
    color: ppmDerived.color,
  };
  return [...base, ppmKPI];
}

let kpiStore: KPI[] = buildInitialStore();

export async function GET() {
  return NextResponse.json({ kpis: kpiStore });
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, value, status, color } = body as {
      id: string; value: number; status?: string; color?: string;
    };

    if (!id || value === undefined) {
      return NextResponse.json({ error: 'Missing id or value' }, { status: 400 });
    }

    const idx = kpiStore.findIndex(k => k.id === id);
    if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Derive status from value for KPIs that have rules
    // For legal_regulatory: status is derived from the value the user explicitly sets
    // For gmp_compliance: same
    // For complaints_ppm: passed in from PPM API
    let derived: { status: KPI['status']; color: KPI['color'] };
    if (id === 'gmp_compliance') {
      derived = deriveGMPStatus(value);
    } else if (id === 'legal_regulatory') {
      derived = deriveLegalStatus(value);
    } else {
      derived = {
        status: (status ?? kpiStore[idx].status) as KPI['status'],
        color: (color ?? kpiStore[idx].color) as KPI['color'],
      };
    }

    kpiStore[idx] = {
      ...kpiStore[idx],
      value,
      ...derived,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json({ kpi: kpiStore[idx] });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
