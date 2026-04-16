'use client';

import { useState } from 'react';
import { CMSite, getSiteColor } from '@/data/cmSites';

interface Props {
  sites: CMSite[];
  onUpdate: (name: string, field: keyof CMSite, value: number | null) => void;
}

type EditableField = 'siteReadiness' | 'gmpCompliance' | 'qmsCompliance' | 'infrastructure';

const FIELDS: { key: EditableField; label: string }[] = [
  { key: 'siteReadiness',  label: 'Site Readiness' },
  { key: 'gmpCompliance',  label: 'GMP Compliance' },
  { key: 'qmsCompliance',  label: 'QMS Compliance' },
  { key: 'infrastructure', label: 'Infrastructure' },
];

function ScoreCell({ value, onSave }: { value: number | null; onSave: (v: number | null) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value?.toString() ?? '');
  const color = value !== null ? getSiteColor((value / 5) * 100) : '#6B7280';

  if (editing) {
    return (
      <input
        autoFocus
        type="number"
        min="0"
        max="5"
        step="0.5"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={() => {
          const n = parseFloat(draft);
          onSave(isNaN(n) ? null : Math.min(5, Math.max(0, n)));
          setEditing(false);
        }}
        onKeyDown={e => {
          if (e.key === 'Enter') e.currentTarget.blur();
          if (e.key === 'Escape') { setDraft(value?.toString() ?? ''); setEditing(false); }
        }}
        className="w-14 text-center text-xs font-mono rounded px-1 py-0.5 outline-none"
        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }}
      />
    );
  }

  return (
    <button
      onClick={() => { setDraft(value?.toString() ?? ''); setEditing(true); }}
      className="group/cell relative w-14 text-center text-xs font-mono rounded px-2 py-1 transition-all duration-150 hover:ring-1"
      style={{
        color: value !== null ? color : '#6B7280',
        background: value !== null ? color + '15' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${value !== null ? color + '30' : 'rgba(255,255,255,0.06)'}`,
      }}
      title="Click to edit"
    >
      {value !== null ? value : '—'}
      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-white/20 opacity-0 group-hover/cell:opacity-100 transition-opacity" />
    </button>
  );
}

function colorRuleLabel(pct: number | null) {
  if (pct === null) return { label: 'N/A', color: '#6B7280' };
  if (pct >= 75) return { label: '●  Dark Green', color: '#00D97E' };
  if (pct >= 60) return { label: '●  Light Green', color: '#4ADE80' };
  if (pct >= 50) return { label: '●  Amber', color: '#F59E0B' };
  return { label: '●  Red', color: '#EF4444' };
}

export default function CMSiteTable({ sites, onUpdate }: Props) {
  const overallGMP = sites
    .filter(s => s.gmpCompliance !== null)
    .reduce((sum, s, _, arr) => sum + (s.gmpCompliance! / arr.length), 0);
  const overallPct = (overallGMP / 5) * 100;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #1A1F2E, #141720)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* Color legend */}
      <div className="px-5 pt-5 pb-3 border-b border-white/[0.05] flex items-center gap-6 flex-wrap">
        <span className="text-[10px] font-mono text-white/25 tracking-widest uppercase">Scoring Rules (out of 5)</span>
        {[
          { label: '≥75%  Dark Green',  color: '#00D97E' },
          { label: '60–74%  Light Green', color: '#4ADE80' },
          { label: '50–59%  Amber',    color: '#F59E0B' },
          { label: '<50%  Red',         color: '#EF4444' },
        ].map(r => (
          <span key={r.label} className="text-[10px] font-mono flex items-center gap-1.5" style={{ color: r.color + 'cc' }}>
            <span className="w-2 h-2 rounded-sm" style={{ background: r.color }} />
            {r.label}
          </span>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <th className="text-left px-5 py-3 font-mono text-white/30 tracking-wider font-normal uppercase text-[10px]">CM Site</th>
              {FIELDS.map(f => (
                <th key={f.key} className="text-center px-3 py-3 font-mono text-white/30 tracking-wider font-normal uppercase text-[10px]">
                  {f.label}
                </th>
              ))}
              <th className="text-center px-3 py-3 font-mono text-white/30 tracking-wider font-normal uppercase text-[10px]">AVG</th>
              <th className="text-center px-3 py-3 font-mono text-white/30 tracking-wider font-normal uppercase text-[10px]">Score</th>
              <th className="text-center px-4 py-3 font-mono text-white/30 tracking-wider font-normal uppercase text-[10px]">Rating</th>
            </tr>
          </thead>
          <tbody>
            {sites.map((site, i) => {
              const rule = colorRuleLabel(site.pct);
              return (
                <tr
                  key={site.name}
                  className="transition-colors duration-150 hover:bg-white/[0.02]"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', animationDelay: `${i * 0.05}s` }}
                >
                  <td className="px-5 py-3 text-white/70 font-medium">{site.name}</td>
                  {FIELDS.map(f => (
                    <td key={f.key} className="px-3 py-3 text-center">
                      <ScoreCell
                        value={site[f.key] as number | null}
                        onSave={v => onUpdate(site.name, f.key, v)}
                      />
                    </td>
                  ))}
                  <td className="px-3 py-3 text-center font-mono text-white/50">
                    {site.avg?.toFixed(3) ?? '—'}
                  </td>
                  <td className="px-3 py-3 text-center font-mono font-medium" style={{ color: getSiteColor(site.pct) }}>
                    {site.pct !== null ? `${site.pct.toFixed(1)}%` : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-[10px] font-mono" style={{ color: rule.color }}>{rule.label}</span>
                  </td>
                </tr>
              );
            })}

            {/* Overall row */}
            <tr style={{ background: 'rgba(255,255,255,0.03)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <td className="px-5 py-3 text-white/50 font-mono text-[10px] tracking-wider uppercase">Mosaic Overall</td>
              {FIELDS.map(f => (
                <td key={f.key} className="px-3 py-3 text-center font-mono text-white/30 text-[10px]">—</td>
              ))}
              <td className="px-3 py-3 text-center font-mono text-white/30 text-[10px]">—</td>
              <td className="px-3 py-3 text-center font-mono font-bold text-[13px]" style={{ color: getSiteColor(overallPct) }}>
                {overallPct.toFixed(2)}%
              </td>
              <td className="px-4 py-3 text-center">
                <span className="text-[10px] font-mono font-medium" style={{ color: colorRuleLabel(overallPct).color }}>
                  {colorRuleLabel(overallPct).label}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="px-5 py-3 text-[10px] text-white/20 font-mono border-t border-white/[0.04]">
        Click any score cell to edit · Changes sync to GMP Compliance KPI automatically
      </p>
    </div>
  );
}
