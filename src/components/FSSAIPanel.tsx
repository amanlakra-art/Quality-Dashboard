'use client';

import { useState } from 'react';
import { FSSAISummary } from '@/data/fssaiData';

interface Props {
  isDark: boolean;
  data: FSSAISummary;
  onUpdate: (updates: Partial<FSSAISummary>) => void;
}

function EditableNumber({ label, value, onSave, max, suffix = '', isDark }: {
  label: string; value: number; onSave: (v: number) => void;
  max?: number; suffix?: string; isDark: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value.toString());
  const bg   = isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.03)';
  const bord = isDark ? 'rgba(255,255,255,0.06)'  : 'rgba(0,0,0,0.07)';
  const lbl  = isDark ? 'rgba(255,255,255,0.30)'  : 'rgba(0,0,0,0.35)';
  const note = isDark ? 'rgba(255,255,255,0.20)'  : 'rgba(0,0,0,0.25)';
  const txt  = isDark ? '#E8EAF0' : '#0F1117';

  return (
    <div className="rounded-xl p-4 flex flex-col gap-1 transition-all duration-200"
      style={{ background: bg, border: `1px solid ${bord}` }}>
      <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: lbl }}>{label}</span>
      <div className="flex items-baseline gap-1">
        {editing ? (
          <input autoFocus type="number" min="0" max={max} value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={() => { const n = parseInt(draft); if (!isNaN(n)) onSave(n); setEditing(false); }}
            onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') { setDraft(value.toString()); setEditing(false); } }}
            className="text-2xl font-bold outline-none bg-transparent w-20"
            style={{ fontFamily: 'var(--font-display)', color: txt, borderBottom: `2px solid ${bord}` }}
          />
        ) : (
          <button onClick={() => { setDraft(value.toString()); setEditing(true); }}
            className="text-2xl font-bold hover:opacity-80 transition-opacity group relative"
            style={{ fontFamily: 'var(--font-display)', color: txt }} title="Click to edit">
            {value}
            <span className="absolute -top-1 -right-3 text-[8px] opacity-0 group-hover:opacity-100 font-mono"
              style={{ color: note }}>edit</span>
          </button>
        )}
        {suffix && <span className="text-sm font-mono" style={{ color: note }}>{suffix}</span>}
      </div>
    </div>
  );
}

function SOIBar({ label, total, awaited, received, isDark }: {
  label: string; total: number; awaited: number; received: number; isDark: boolean;
}) {
  const recPct = total > 0 ? (received / total) * 100 : 0;
  const awPct  = total > 0 ? (awaited  / total) * 100 : 0;
  const lbl = isDark ? 'rgba(255,255,255,0.50)' : 'rgba(0,0,0,0.55)';
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs font-mono" style={{ color: lbl }}>{label}</span>
        <div className="flex gap-3 text-[10px] font-mono">
          <span style={{ color: '#00D97E' }}>{received} received</span>
          <span style={{ color: '#F59E0B' }}>{awaited} awaited</span>
          <span style={{ color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.28)' }}>{total} total</span>
        </div>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden"
        style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
        <div className="h-full flex">
          <div className="h-full transition-all duration-700" style={{ width: `${recPct}%`, background: '#00D97E' }} />
          <div className="h-full transition-all duration-700" style={{ width: `${awPct}%`, background: 'rgba(245,159,11,0.4)' }} />
        </div>
      </div>
    </div>
  );
}

export default function FSSAIPanel({ isDark, data, onUpdate }: Props) {
  const relPct  = (data.relabellerLicCompliance * 100).toFixed(1);
  const prodPct = (data.productCompliance * 100).toFixed(1);

  const panelBg   = isDark ? 'linear-gradient(135deg, #1A1F2E, #141720)' : 'linear-gradient(135deg, #FFFFFF, #F8F9FC)';
  const borderCol = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';
  const divider   = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
  const secLbl    = isDark ? 'rgba(255,255,255,0.30)' : 'rgba(0,0,0,0.35)';
  const faint     = isDark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.22)';
  const barTrack  = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const footerTxt = isDark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.25)';
  const legendA   = isDark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.22)';

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: panelBg, border: `1px solid ${borderCol}` }}>

      {/* Top stats */}
      <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-3"
        style={{ borderBottom: `1px solid ${divider}` }}>
        <EditableNumber label="Total Mfg Sites"    value={data.totalMfgSites}
          onSave={v => onUpdate({ totalMfgSites: v })} isDark={isDark} />
        <EditableNumber label="Relabellers in Lic." value={data.relabellerInCurrentLic}
          max={data.totalMfgSites}
          onSave={v => onUpdate({ relabellerInCurrentLic: v })}
          suffix={`/ ${data.totalMfgSites} · ${relPct}%`} isDark={isDark} />
        <EditableNumber label="Total Products"      value={data.totalProducts}
          onSave={v => onUpdate({ totalProducts: v })} isDark={isDark} />
        <EditableNumber label="Products in Current Lic." value={data.totalProductInCurrentLic}
          max={data.totalProducts}
          onSave={v => onUpdate({ totalProductInCurrentLic: v })}
          suffix={`/ ${data.totalProducts} · ${prodPct}%`} isDark={isDark} />
      </div>

      {/* Compliance bars */}
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5"
        style={{ borderBottom: `1px solid ${divider}` }}>
        {[
          { label: 'Relabeller Lic. Compliance',      pct: relPct,  note: `${data.relabellerInCurrentLic} of ${data.totalMfgSites} manufacturers endorsed` },
          { label: 'Product Compliance in Relabeller', pct: prodPct, note: `${data.totalProductInCurrentLic} endorsed · ${data.pending} pending` },
        ].map(({ label, pct, note }) => {
          const pctNum = parseFloat(pct);
          const col = pctNum >= 75 ? '#00D97E' : pctNum >= 50 ? '#F59E0B' : '#EF4444';
          return (
            <div key={label}>
              <div className="flex justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: secLbl }}>{label}</span>
                <span className="text-sm font-bold font-mono" style={{ color: col }}>{pct}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: barTrack }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${col}88, ${col})` }} />
              </div>
              <p className="text-[10px] font-mono mt-1.5" style={{ color: faint }}>{note}</p>
            </div>
          );
        })}
      </div>

      {/* SOI Breakdown */}
      <div className="p-5">
        <h3 className="text-[10px] font-mono uppercase tracking-wider mb-4" style={{ color: secLbl }}>
          SOI Breakdown by Category
        </h3>
        {data.soiBreakdown.map(row => (
          <SOIBar key={row.category} label={row.category}
            total={row.total} awaited={row.awaitedForReview} received={row.received} isDark={isDark} />
        ))}
        <div className="mt-4 flex gap-4 text-[10px] font-mono" style={{ color: legendA }}>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm" style={{ background: '#00D97E' }} /> SOI Received
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm" style={{ background: '#F59E0B40', border: '1px solid #F59E0B60' }} /> Awaited for Review
          </span>
        </div>
      </div>

      <p className="px-5 py-3 text-[10px] font-mono" style={{ color: footerTxt, borderTop: `1px solid ${divider}` }}>
        Click any number to edit · Changes sync to Legal &amp; Regulatory KPI automatically
      </p>
    </div>
  );
}
