'use client';

import { useEffect, useState } from 'react';
import { CMSite, getSiteColor } from '@/data/cmSites';

interface Props {
  isDark: boolean;
  sites: CMSite[];
  // Live "Mosaic Overall CM site Score" row from the sheet. When provided, we
  // render its actual values instead of the previously-hardcoded ones.
  mosaicOverall?: {
    siteReadiness: number | null;
    gmpCompliance: number | null;
    qmsCompliance: number | null;
    infraResources: number | null;
    scorePct: number | null;
  };
  fetchedAt?: string;
}

const FIELDS: { key: keyof CMSite; label: string; short: string }[] = [
  { key: 'siteReadiness',  label: 'Site Readiness',  short: 'Readiness' },
  { key: 'gmpCompliance',  label: 'GMP Compliance',  short: 'GMP' },
  { key: 'qmsCompliance',  label: 'QMS Compliance',  short: 'QMS' },
  { key: 'infrastructure', label: 'Infrastructure',  short: 'Infra' },
];

/**
 * Read-only score cell. Color matches the sheet's threshold rules
 * (≥75% dark green, 60-74 light green, 50-59 amber, <50 red), but applied
 * to the per-cell value scaled to a percent — gives at-a-glance heat without
 * needing to scan numbers.
 */
function ScoreCell({ value, isDark }: { value: number | null; isDark: boolean }) {
  const color = value !== null ? getSiteColor((value / 5) * 100) : '#6B7280';
  return (
    <span
      className="inline-flex w-14 justify-center rounded px-2 py-1 text-xs font-mono"
      style={{
        color: value !== null ? color : '#6B7280',
        background: value !== null
          ? color + '15'
          : isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
        border: `1px solid ${
          value !== null
            ? color + '30'
            : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'
        }`,
      }}
    >
      {value !== null ? value : '—'}
    </span>
  );
}

function colorRuleLabel(pct: number | null) {
  if (pct === null) return { label: 'N/A', color: '#6B7280' };
  if (pct >= 75) return { label: '● Dark Green', color: '#00D97E' };
  if (pct >= 60) return { label: '● Light Green', color: '#4ADE80' };
  if (pct >= 50) return { label: '● Amber', color: '#F59E0B' };
  return { label: '● Red', color: '#EF4444' };
}

/** Format a fetchedAt ISO timestamp as "12s ago" / "3m ago" / "1h 12m ago". */
function useRelative(iso?: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(id);
  }, []);
  if (!iso) return null;
  const diff = Math.max(0, now - new Date(iso).getTime());
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m ago`;
}

export default function CMSiteTable({ isDark, sites, mosaicOverall, fetchedAt }: Props) {
  const relative = useRelative(fetchedAt);

  // Theme tokens — matching the existing homepage's dark/light system.
  const panelBg    = isDark ? 'linear-gradient(135deg, #1A1F2E, #141720)' : 'linear-gradient(135deg, #FFFFFF, #F8F9FC)';
  const borderCol  = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.10)';
  const dividerCol = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)';
  const rowHover   = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)';
  const rowDivider = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.05)';
  const overallBg  = isDark ? 'rgba(0,217,126,0.04)'   : 'rgba(0,217,126,0.08)';
  const overallBd  = isDark ? 'rgba(0,217,126,0.20)'   : 'rgba(0,217,126,0.30)';
  // Light-mode opacities raised to readable levels (was 0.22-0.40 → washed out).
  const hdrText    = isDark ? 'rgba(255,255,255,0.30)' : 'rgba(0,0,0,0.55)';
  const cellText   = isDark ? 'rgba(255,255,255,0.78)' : 'rgba(0,0,0,0.82)';
  const mutedText  = isDark ? 'rgba(255,255,255,0.30)' : 'rgba(0,0,0,0.55)';
  const faintText  = isDark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.50)';
  const footerText = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.55)';

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: panelBg, border: `1px solid ${borderCol}` }}>

      {/* Top bar: legend on the left, sync indicator on the right */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between flex-wrap gap-3"
        style={{ borderBottom: `1px solid ${dividerCol}` }}>
        <div className="flex items-center gap-6 flex-wrap">
          <span className="text-[10px] font-mono tracking-widest uppercase" style={{ color: hdrText }}>
            Scoring out of 5 · % = score / 5
          </span>
          {[
            { label: '≥75% Dark Green',   color: '#00D97E' },
            { label: '60–74 Light Green', color: '#4ADE80' },
            { label: '50–59 Amber',       color: '#F59E0B' },
            { label: '<50 Red',           color: '#EF4444' },
          ].map(r => (
            <span key={r.label} className="text-[10px] font-mono flex items-center gap-1.5" style={{ color: r.color + 'cc' }}>
              <span className="w-2 h-2 rounded-sm" style={{ background: r.color }} />
              {r.label}
            </span>
          ))}
        </div>

        {/* Sync indicator — gives quick confidence the data is fresh */}
        {fetchedAt && (
          <div className="flex items-center gap-2 text-[10px] font-mono" style={{ color: faintText }}>
            <span className="relative inline-flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
                style={{ background: '#00D97E' }} />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: '#00D97E' }} />
            </span>
            <span>Live · synced {relative}</span>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: `1px solid ${dividerCol}` }}>
              <th className="text-left px-5 py-3 font-mono tracking-wider font-normal uppercase text-[10px]"
                style={{ color: hdrText }}>CM Site</th>
              {FIELDS.map(f => (
                <th key={String(f.key)} className="text-center px-3 py-3 font-mono tracking-wider font-normal uppercase text-[10px]"
                  title={f.label} style={{ color: hdrText }}>{f.short}</th>
              ))}
              <th className="text-center px-3 py-3 font-mono tracking-wider font-normal uppercase text-[10px]"
                style={{ color: hdrText }}>AVG</th>
              <th className="text-center px-3 py-3 font-mono tracking-wider font-normal uppercase text-[10px]"
                style={{ color: hdrText }}>Score</th>
              <th className="text-center px-4 py-3 font-mono tracking-wider font-normal uppercase text-[10px]"
                style={{ color: hdrText }}>Rating</th>
            </tr>
          </thead>
          <tbody>
            {sites.map((site) => {
              const rule = colorRuleLabel(site.pct);
              return (
                <tr key={site.name}
                  className="transition-colors duration-150"
                  style={{ borderBottom: `1px solid ${rowDivider}` }}
                  onMouseEnter={e => (e.currentTarget.style.background = rowHover)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td className="px-5 py-3 font-medium" style={{ color: cellText }}>{site.name}</td>
                  {FIELDS.map(f => (
                    <td key={String(f.key)} className="px-3 py-3 text-center">
                      <ScoreCell value={site[f.key] as number | null} isDark={isDark} />
                    </td>
                  ))}
                  <td className="px-3 py-3 text-center font-mono" style={{ color: mutedText }}>
                    {site.avg !== null ? site.avg.toFixed(2) : '—'}
                  </td>
                  <td className="px-3 py-3 text-center font-mono font-medium"
                    style={{ color: getSiteColor(site.pct) }}>
                    {site.pct !== null ? `${site.pct.toFixed(1)}%` : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-[10px] font-mono" style={{ color: rule.color }}>{rule.label}</span>
                  </td>
                </tr>
              );
            })}

            {/* Mosaic Overall row — uses live values from the sheet when present. */}
            {mosaicOverall && (
              <tr style={{ background: overallBg, borderTop: `2px solid ${overallBd}` }}>
                <td className="px-5 py-3 font-mono text-[10px] tracking-wider uppercase font-semibold"
                  style={{ color: cellText }}>
                  Mosaic Overall
                  <div className="text-[9px] font-normal mt-0.5 normal-case tracking-normal" style={{ color: faintText }}>
                    Live from Summary tab
                  </div>
                </td>
                <OverallCell pct={mosaicOverall.siteReadiness} faintColor={faintText} />
                <OverallCell pct={mosaicOverall.gmpCompliance} faintColor={faintText} />
                <OverallCell pct={mosaicOverall.qmsCompliance} faintColor={faintText} />
                <OverallCell pct={mosaicOverall.infraResources} faintColor={faintText} />
                <td className="px-3 py-3 text-center" />
                <td className="px-3 py-3 text-center">
                  {mosaicOverall.scorePct !== null && (
                    <span className="font-mono text-[13px] font-bold"
                      style={{ color: getSiteColor(mosaicOverall.scorePct) }}>
                      {mosaicOverall.scorePct.toFixed(1)}%
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {mosaicOverall.scorePct !== null && (
                    <span className="text-[10px] font-mono font-semibold"
                      style={{ color: colorRuleLabel(mosaicOverall.scorePct).color }}>
                      {colorRuleLabel(mosaicOverall.scorePct).label}
                    </span>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="px-5 py-3 text-[10px] font-mono" style={{ color: footerText, borderTop: `1px solid ${dividerCol}` }}>
        Read-only · Edit values in the source Google Sheet — changes appear here within ~60s
      </p>
    </div>
  );
}

function OverallCell({ pct, faintColor }: { pct: number | null; faintColor: string }) {
  if (pct === null) return <td className="px-3 py-3 text-center" />;
  const score = (pct / 100) * 5;
  return (
    <td className="px-3 py-3 text-center">
      <span className="font-mono text-[11px] font-bold" style={{ color: getSiteColor(pct) }}>
        {pct.toFixed(1)}%
      </span>
      <div className="text-[9px] font-mono" style={{ color: faintColor }}>
        {score.toFixed(2)} / 5
      </div>
    </td>
  );
}
