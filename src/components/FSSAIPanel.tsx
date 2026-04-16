'use client';

import { useState } from 'react';
import { FSSAISummary } from '@/data/fssaiData';

interface Props {
  data: FSSAISummary;
  onUpdate: (updates: Partial<FSSAISummary>) => void;
}

function EditableNumber({
  label, value, onSave, max, suffix = '',
}: {
  label: string; value: number; onSave: (v: number) => void; max?: number; suffix?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value.toString());

  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-1 transition-all duration-200 hover:bg-white/[0.04] cursor-default"
      style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider">{label}</span>
      <div className="flex items-baseline gap-1">
        {editing ? (
          <input
            autoFocus
            type="number"
            min="0"
            max={max}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={() => {
              const n = parseInt(draft);
              if (!isNaN(n)) onSave(n);
              setEditing(false);
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') e.currentTarget.blur();
              if (e.key === 'Escape') { setDraft(value.toString()); setEditing(false); }
            }}
            className="w-20 text-2xl font-bold outline-none bg-transparent border-b-2 border-white/30 text-white"
            style={{ fontFamily: 'var(--font-display)' }}
          />
        ) : (
          <button
            onClick={() => { setDraft(value.toString()); setEditing(true); }}
            className="text-2xl font-bold text-white hover:opacity-80 transition-opacity group relative"
            style={{ fontFamily: 'var(--font-display)' }}
            title="Click to edit"
          >
            {value}
            <span className="absolute -top-1 -right-3 text-[8px] text-white/20 opacity-0 group-hover:opacity-100 font-mono">edit</span>
          </button>
        )}
        {suffix && <span className="text-sm text-white/30 font-mono">{suffix}</span>}
      </div>
    </div>
  );
}

function SOIBar({ label, total, awaited, received }: { label: string; total: number; awaited: number; received: number }) {
  const recPct = total > 0 ? (received / total) * 100 : 0;
  const awPct = total > 0 ? (awaited / total) * 100 : 0;

  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs text-white/50 font-mono">{label}</span>
        <div className="flex gap-3 text-[10px] font-mono">
          <span style={{ color: '#00D97E' }}>{received} received</span>
          <span style={{ color: '#F59E0B' }}>{awaited} awaited</span>
          <span className="text-white/25">{total} total</span>
        </div>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="h-full flex">
          <div className="h-full transition-all duration-700" style={{ width: `${recPct}%`, background: '#00D97E' }} />
          <div className="h-full transition-all duration-700" style={{ width: `${awPct}%`, background: '#F59E0B40' }} />
        </div>
      </div>
    </div>
  );
}

export default function FSSAIPanel({ data, onUpdate }: Props) {
  const relPct = (data.relabellerLicCompliance * 100).toFixed(1);
  const prodPct = (data.productCompliance * 100).toFixed(1);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #1A1F2E, #141720)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* Top stats grid */}
      <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-3 border-b border-white/[0.05]">
        <EditableNumber
          label="Total Mfg Sites"
          value={data.totalMfgSites}
          onSave={v => onUpdate({ totalMfgSites: v })}
        />
        <EditableNumber
          label="Relabellers in Licence"
          value={data.relabellerInCurrentLic}
          max={data.totalMfgSites}
          onSave={v => onUpdate({ relabellerInCurrentLic: v })}
          suffix={`/ ${data.totalMfgSites} · ${relPct}%`}
        />
        <EditableNumber
          label="Total Products"
          value={data.totalProducts}
          onSave={v => onUpdate({ totalProducts: v })}
        />
        <EditableNumber
          label="Products in Current Lic."
          value={data.totalProductInCurrentLic}
          max={data.totalProducts}
          onSave={v => onUpdate({ totalProductInCurrentLic: v })}
          suffix={`/ ${data.totalProducts} · ${prodPct}%`}
        />
      </div>

      {/* Compliance bars */}
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5 border-b border-white/[0.05]">
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider">Relabeller Lic. Compliance</span>
            <span className="text-sm font-bold font-mono" style={{ color: parseFloat(relPct) >= 75 ? '#00D97E' : '#F59E0B' }}>{relPct}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${relPct}%`,
                background: `linear-gradient(90deg, ${parseFloat(relPct) >= 75 ? '#00D97E88' : '#F59E0B88'}, ${parseFloat(relPct) >= 75 ? '#00D97E' : '#F59E0B'})`,
              }}
            />
          </div>
          <p className="text-[10px] text-white/20 font-mono mt-1.5">{data.relabellerInCurrentLic} of {data.totalMfgSites} manufacturers endorsed</p>
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider">Product Compliance in Relabeller</span>
            <span className="text-sm font-bold font-mono" style={{ color: parseFloat(prodPct) >= 75 ? '#00D97E' : '#EF4444' }}>{prodPct}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${prodPct}%`,
                background: `linear-gradient(90deg, #EF444488, #EF4444)`,
              }}
            />
          </div>
          <p className="text-[10px] text-white/20 font-mono mt-1.5">{data.totalProductInCurrentLic} endorsed · {data.pending} pending</p>
        </div>
      </div>

      {/* SOI Breakdown */}
      <div className="p-5">
        <h3 className="text-[10px] font-mono text-white/30 uppercase tracking-wider mb-4">SOI Breakdown by Category</h3>
        {data.soiBreakdown.map(row => (
          <SOIBar
            key={row.category}
            label={row.category}
            total={row.total}
            awaited={row.awaitedForReview}
            received={row.received}
          />
        ))}
        <div className="mt-4 flex gap-4 text-[10px] font-mono text-white/30">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm" style={{ background: '#00D97E' }} /> SOI Received</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm" style={{ background: '#F59E0B40', border: '1px solid #F59E0B60' }} /> Awaited for Review</span>
        </div>
      </div>

      <p className="px-5 py-3 text-[10px] text-white/20 font-mono border-t border-white/[0.04]">
        Click any number to edit · Changes sync to Legal &amp; Regulatory KPI automatically
      </p>
    </div>
  );
}
