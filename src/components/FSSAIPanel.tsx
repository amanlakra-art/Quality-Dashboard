'use client';

import { useEffect, useState } from 'react';
import { FSSAISummary } from '@/data/fssaiData';

// Rich shape from the Apps Script — includes the per-SOI "licence endorsement
// pending" column and % pending that the legacy SOIRow doesn't have.
export type FssaiSoiRich = {
  soi: string;
  totalProducts: number | null;
  awaitedReview: number | null;
  received: number | null;
  licencePending: number | null;
  pendingPct: number | null;
};

interface Props {
  isDark: boolean;
  data: FSSAISummary;
  bySoi?: FssaiSoiRich[];
  totals?: FssaiSoiRich | null;
  fetchedAt?: string;
}

function StatBlock({
  label, value, suffix, isDark, accent,
}: {
  label: string; value: number | string; suffix?: string;
  isDark: boolean; accent?: string;
}) {
  const bg   = isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.03)';
  const bord = isDark ? 'rgba(255,255,255,0.06)'  : 'rgba(0,0,0,0.10)';
  const lbl  = isDark ? 'rgba(255,255,255,0.30)'  : 'rgba(0,0,0,0.55)';
  const note = isDark ? 'rgba(255,255,255,0.30)'  : 'rgba(0,0,0,0.55)';
  const txt  = accent || (isDark ? '#E8EAF0' : '#0F1117');

  return (
    <div className="rounded-xl p-4 flex flex-col gap-1"
      style={{ background: bg, border: `1px solid ${bord}` }}>
      <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: lbl }}>{label}</span>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)', color: txt }}>
          {value}
        </span>
        {suffix && <span className="text-sm font-mono" style={{ color: note }}>{suffix}</span>}
      </div>
    </div>
  );
}

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
  return `${Math.floor(m / 60)}h ${m % 60}m ago`;
}

export default function FSSAIPanel({ isDark, data, bySoi, totals, fetchedAt }: Props) {
  const relPct  = (data.relabellerLicCompliance * 100);
  const prodPct = (data.productCompliance * 100);
  const relative = useRelative(fetchedAt);

  const panelBg   = isDark ? 'linear-gradient(135deg, #1A1F2E, #141720)' : 'linear-gradient(135deg, #FFFFFF, #F8F9FC)';
  const borderCol = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.10)';
  const divider   = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)';
  // Light-mode opacities raised — was 0.22-0.40 against near-white = invisible.
  const secLbl    = isDark ? 'rgba(255,255,255,0.30)' : 'rgba(0,0,0,0.55)';
  const faint     = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.55)';
  const veryFaint = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.50)';
  const cellText  = isDark ? 'rgba(255,255,255,0.78)' : 'rgba(0,0,0,0.82)';
  const barTrack  = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';
  const totalsBg  = isDark ? 'rgba(245,159,11,0.06)'  : 'rgba(245,159,11,0.12)';
  const totalsBd  = isDark ? 'rgba(245,159,11,0.20)'  : 'rgba(245,159,11,0.30)';
  const footerTxt = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.55)';

  const relCol  = relPct  >= 75 ? '#00D97E' : relPct  >= 50 ? '#F59E0B' : '#EF4444';
  const prodCol = prodPct >= 75 ? '#00D97E' : prodPct >= 50 ? '#F59E0B' : '#EF4444';

  const soiRows = bySoi || [];

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: panelBg, border: `1px solid ${borderCol}` }}>

      {/* Sync indicator strip */}
      {fetchedAt && (
        <div className="px-5 pt-4 pb-2 flex items-center justify-end gap-2 text-[10px] font-mono"
          style={{ color: faint }}>
          <span className="relative inline-flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
              style={{ background: '#00D97E' }} />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: '#00D97E' }} />
          </span>
          <span>Live · synced {relative}</span>
        </div>
      )}

      {/* Top stats — read-only, derived from the actual sheet */}
      <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-3"
        style={{ borderBottom: `1px solid ${divider}` }}>
        <StatBlock label="Total Mfg Sites" value={data.totalMfgSites} isDark={isDark} />
        <StatBlock label="Relabellers in Lic." value={data.relabellerInCurrentLic}
          suffix={`/ ${data.totalMfgSites} · ${relPct.toFixed(1)}%`}
          isDark={isDark} accent={relCol} />
        <StatBlock label="Total Products" value={data.totalProducts} isDark={isDark} />
        <StatBlock label="Products in Current Lic." value={data.totalProductInCurrentLic}
          suffix={`/ ${data.totalProducts} · ${prodPct.toFixed(1)}%`}
          isDark={isDark} accent={prodCol} />
      </div>

      {/* Compliance bars */}
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5"
        style={{ borderBottom: `1px solid ${divider}` }}>
        {[
          { label: 'Relabeller Lic. Compliance', pct: relPct, col: relCol,
            note: `${data.relabellerInCurrentLic} of ${data.totalMfgSites} manufacturers endorsed` },
          { label: 'Product Compliance in Relabeller', pct: prodPct, col: prodCol,
            note: `${data.totalProductInCurrentLic} endorsed · ${data.pending} pending` },
        ].map(({ label, pct, col, note }) => (
          <div key={label}>
            <div className="flex justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: secLbl }}>{label}</span>
              <span className="text-sm font-bold font-mono" style={{ color: col }}>{pct.toFixed(1)}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: barTrack }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, pct)}%`, background: `linear-gradient(90deg, ${col}88, ${col})` }} />
            </div>
            <p className="text-[10px] font-mono mt-1.5" style={{ color: veryFaint }}>{note}</p>
          </div>
        ))}
      </div>

      {/* SOI breakdown — full table including the new "licence pending" col */}
      <div className="p-5">
        <h3 className="text-[10px] font-mono uppercase tracking-wider mb-4" style={{ color: secLbl }}>
          Endorsement Status by SOI
        </h3>

        {soiRows.length === 0 ? (
          <p className="text-[11px] font-mono" style={{ color: faint }}>
            No SOI breakdown available — check that the Summary tab&apos;s SOI table is populated.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: `1px solid ${divider}` }}>
                  <th className="text-left px-3 py-2.5 font-mono tracking-wider font-normal uppercase text-[10px]"
                    style={{ color: secLbl }}>SOI</th>
                  <th className="text-right px-3 py-2.5 font-mono tracking-wider font-normal uppercase text-[10px]"
                    style={{ color: secLbl }}>Total</th>
                  <th className="text-right px-3 py-2.5 font-mono tracking-wider font-normal uppercase text-[10px]"
                    style={{ color: secLbl }}>Awaited Review</th>
                  <th className="text-right px-3 py-2.5 font-mono tracking-wider font-normal uppercase text-[10px]"
                    style={{ color: secLbl }}>Received</th>
                  <th className="text-right px-3 py-2.5 font-mono tracking-wider font-normal uppercase text-[10px]"
                    style={{ color: secLbl }}>Endorsement Pending</th>
                  <th className="text-right px-3 py-2.5 font-mono tracking-wider font-normal uppercase text-[10px]"
                    style={{ color: secLbl }}>% Pending</th>
                </tr>
              </thead>
              <tbody>
                {soiRows.map((row) => (
                  <tr key={row.soi} style={{ borderBottom: `1px solid ${divider}` }}>
                    <td className="px-3 py-2.5 font-medium" style={{ color: cellText }}>{row.soi}</td>
                    <SoiNum value={row.totalProducts} color={cellText} />
                    <SoiNum value={row.awaitedReview} color={'#F59E0B'} />
                    <SoiNum value={row.received} color={'#00D97E'} />
                    <SoiNum value={row.licencePending} color={cellText} />
                    <td className="px-3 py-2.5 text-right font-mono">
                      <span style={{
                        color: row.pendingPct !== null
                          ? (row.pendingPct >= 90 ? '#EF4444'
                              : row.pendingPct >= 50 ? '#F59E0B'
                              : '#00D97E')
                          : faint
                      }}>
                        {row.pendingPct !== null ? `${row.pendingPct.toFixed(1)}%` : '—'}
                      </span>
                    </td>
                  </tr>
                ))}

                {totals && (
                  <tr style={{ background: totalsBg, borderTop: `2px solid ${totalsBd}` }}>
                    <td className="px-3 py-2.5 font-mono text-[10px] tracking-wider uppercase font-semibold"
                      style={{ color: cellText }}>Total</td>
                    <SoiNum value={totals.totalProducts} color={cellText} bold />
                    <SoiNum value={totals.awaitedReview} color={'#F59E0B'} bold />
                    <SoiNum value={totals.received} color={'#00D97E'} bold />
                    <SoiNum value={totals.licencePending} color={cellText} bold />
                    <td className="px-3 py-2.5 text-right font-mono font-bold">
                      <span style={{ color: '#F59E0B' }}>
                        {totals.pendingPct !== null ? `${totals.pendingPct.toFixed(1)}%` : '—'}
                      </span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="px-5 py-3 text-[10px] font-mono"
        style={{ color: footerTxt, borderTop: `1px solid ${divider}` }}>
        Read-only · Edit values in the source Google Sheet — changes appear here within ~60s
      </p>
    </div>
  );
}

function SoiNum({
  value, color, bold,
}: { value: number | null; color: string; bold?: boolean }) {
  return (
    <td className="px-3 py-2.5 text-right font-mono"
      style={{ color: value === null ? 'rgba(128,128,128,0.5)' : color, fontWeight: bold ? 700 : 400 }}>
      {value === null ? '—' : value}
    </td>
  );
}
