// ============================================================
//  kpis.ts — Single source of truth for all KPI data
//  Color coding rules from CM_Site_Scorecard Summary tab:
//    >=75%  -> Dark Green  -> 'on_track'
//    60-74% -> Light Green -> 'good'
//    50-59% -> Amber       -> 'near_target'
//    <50%   -> Red         -> 'critical'
// ============================================================

export type KPIStatus = 'on_track' | 'good' | 'near_target' | 'critical';

export interface KPI {
  id: string;
  title: string;
  value: number;
  unit: string;
  subtext: string;
  target: number;
  targetLabel: string;
  status: KPIStatus;
  color: 'green' | 'light_green' | 'amber' | 'red';
  description?: string;
  source?: string;
  lastUpdated?: string;
}

export function deriveGMPStatus(pct: number): { status: KPIStatus; color: KPI['color'] } {
  if (pct >= 75) return { status: 'on_track',   color: 'green' };
  if (pct >= 60) return { status: 'good',        color: 'light_green' };
  if (pct >= 50) return { status: 'near_target', color: 'amber' };
  return { status: 'critical', color: 'red' };
}

export function deriveLegalStatus(pct: number): { status: KPIStatus; color: KPI['color'] } {
  if (pct >= 98) return { status: 'on_track',   color: 'green' };
  if (pct >= 90) return { status: 'near_target', color: 'amber' };
  return { status: 'critical', color: 'red' };
}

// GMP: Mosaic Overall CM site Score -> GMP column = 0.6875 = 68.75%
// Legal: composite from FSSAI Summary = 94% (display value)
const GMP_VALUE = 68.75;
const LEGAL_VALUE = 94;

const gmpDerived = deriveGMPStatus(GMP_VALUE);
const legalDerived = deriveLegalStatus(LEGAL_VALUE);

export const DEFAULT_KPIS: KPI[] = [
  {
    id: 'legal_regulatory',
    title: 'Legal & Regulatory Compliance',
    value: LEGAL_VALUE,
    unit: '%',
    subtext: 'of regulatory requirements met',
    target: 98,
    targetLabel: '>=98%',
    status: legalDerived.status,
    color: legalDerived.color,
    description: 'FSSAI licensing: 11/14 relabellers in current licence (78.6%). 32/110 products endorsed in Mosaic licence (29.1%). 78 products pending.',
    source: 'FSSAI_3PL_Manufacture.xlsx -> Summary',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'gmp_compliance',
    title: 'GMP Compliance Score (CM Sites)',
    value: GMP_VALUE,
    unit: '%',
    subtext: 'avg across contract manufacturing sites',
    target: 75,
    targetLabel: '>=75%',
    status: gmpDerived.status,
    color: gmpDerived.color,
    description: 'Mosaic Overall CM Site Score (GMP) = 0.6875 from 8 sites on 5-pt scale. Rules: >=75% Dark Green, 60-74% Light Green, 50-59% Amber, <50% Red.',
    source: 'CM_Site_Scorecard.xlsx -> Summary (Mosaic Overall CM site Score)',
    lastUpdated: new Date().toISOString(),
  },
];

export const STATUS_META: Record<KPIStatus, { label: string; dot: string; badge: string }> = {
  on_track:    { label: 'On track',    dot: '#00D97E', badge: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10' },
  good:        { label: 'Good',        dot: '#4ADE80', badge: 'text-green-400 border-green-400/30 bg-green-400/10' },
  near_target: { label: 'Near target', dot: '#F59E0B', badge: 'text-amber-400 border-amber-400/30 bg-amber-400/10' },
  critical:    { label: 'Critical',    dot: '#EF4444', badge: 'text-red-400 border-red-400/30 bg-red-400/10' },
};

export const COLOR_HEX: Record<KPI['color'], string> = {
  green:       '#00D97E',
  light_green: '#4ADE80',
  amber:       '#F59E0B',
  red:         '#EF4444',
};

// PPM KPI — uncomment to enable (Phase 2, now active)
// Added directly to the store at runtime from PPM API
export const PPM_KPI_TEMPLATE = {
  id: 'complaints_ppm',
  title: 'Complaints PPM',
  value: 265.1,
  unit: 'PPM' as const,
  subtext: 'parts per million · Jul 2025 – Mar 2026',
  target: 250,
  targetLabel: '≤250 PPM',
  status: 'critical' as const,
  color: 'red' as const,
  description: 'Total complaints / total units sold × 1,000,000. Weighted by issue severity. Raw PPM: 265.1. Source: Nutrimix PPM Analysis.',
  source: 'Nutrimix_PPM_Analysis_Jul_to_Mar.xlsx',
  lastUpdated: new Date().toISOString(),
};
