'use client';

import { useState } from 'react';
import { PPMData, PPMSettings, DEFAULT_PPM_SETTINGS } from '@/data/ppmData';

interface Props {
  data: PPMData;
  settings: PPMSettings;
  weightedPPM: number;
  onUpdateSettings: (s: Partial<PPMSettings>) => void;
  onUpdateData: (d: Partial<PPMData>) => void;
}

const ISSUE_COLORS: Record<string, string> = {
  'Primary Packaging Issue':   '#3B82F6',
  'Product Quality Issue':     '#F59E0B',
  'Secondary Packaging Issue': '#8B5CF6',
  'Infestation':               '#EF4444',
  'Delivery Issue':            '#6B7280',
  'Other':                     '#64748B',
  'Product Performance Issue': '#EC4899',
};

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)', minWidth: 60 }}>
      <div className="h-full rounded-full" style={{ width: `${Math.min((value / max) * 100, 100)}%`, background: color, transition: 'width .8s cubic-bezier(.16,1,.3,1)' }} />
    </div>
  );
}

function SettingToggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/[0.04]">
      <span className="text-xs text-white/50 font-mono">{label}</span>
      <button onClick={() => onChange(!value)}
        className="relative w-10 h-5 rounded-full transition-colors duration-200"
        style={{ background: value ? '#00D97E' : 'rgba(255,255,255,0.1)' }}>
        <span className="absolute top-0.5 transition-all duration-200 w-4 h-4 rounded-full bg-white shadow"
          style={{ left: value ? '1.4rem' : '0.12rem' }} />
      </button>
    </div>
  );
}

function WeightSlider({ issueType, value, onChange }: { issueType: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1">
        <div className="flex justify-between mb-1">
          <span className="text-[10px] font-mono text-white/40 truncate max-w-[160px]">{issueType}</span>
          <span className="text-[10px] font-mono font-bold" style={{ color: ISSUE_COLORS[issueType] ?? '#fff' }}>×{value.toFixed(1)}</span>
        </div>
        <input type="range" min="0.5" max="3" step="0.5" value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          className="w-full h-1 rounded-full appearance-none cursor-pointer"
          style={{ accentColor: ISSUE_COLORS[issueType] ?? '#fff' }} />
      </div>
    </div>
  );
}

export default function PPMPanel({ data, settings, weightedPPM, onUpdateSettings, onUpdateData }: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'packaging' | 'settings'>('overview');
  const [editTarget, setEditTarget] = useState(false);
  const [draftTarget, setDraftTarget] = useState(settings.target.toString());

  const maxMonthlyPPM = Math.max(...data.monthly.map(m => m.ppm));
  const maxComplaint = Math.max(...data.byIssueType.map(i => i.complaints));

  const tabs = [
    { id: 'overview',  label: 'Overview' },
    { id: 'packaging', label: 'By Packaging' },
    { id: 'settings',  label: '⚙ PPM Settings' },
  ] as const;

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #1A1F2E, #141720)', border: '1px solid rgba(255,255,255,0.07)' }}>

      {/* Tab bar */}
      <div className="flex border-b border-white/[0.05] px-5 pt-4 gap-1">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className="px-3 py-2 text-[11px] font-mono rounded-t-lg transition-all duration-150"
            style={{
              color: activeTab === t.id ? '#fff' : 'rgba(255,255,255,0.3)',
              background: activeTab === t.id ? 'rgba(255,255,255,0.06)' : 'transparent',
              borderBottom: activeTab === t.id ? '2px solid #EF4444' : '2px solid transparent',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === 'overview' && (
        <div className="p-5">
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Total Sales', value: data.totalSales.toLocaleString(), color: 'rgba(255,255,255,0.7)' },
              { label: 'Total Complaints', value: data.totalComplaints.toString(), color: '#F59E0B' },
              { label: 'Raw PPM', value: data.overallPPM.toFixed(1), color: '#EF4444' },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-3 text-center"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="text-[9px] font-mono text-white/25 uppercase tracking-wider mb-1">{s.label}</div>
                <div className="text-lg font-bold font-mono" style={{ color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Monthly trend */}
          <div className="mb-6">
            <div className="text-[10px] font-mono text-white/25 uppercase tracking-wider mb-3">Monthly PPM Trend · {data.period}</div>
            <div className="flex items-end gap-1.5 h-28">
              {data.monthly.map((m) => {
                const h = Math.max((m.ppm / maxMonthlyPPM) * 100, 4);
                const overTarget = m.ppm > settings.target;
                const barColor = overTarget ? '#EF4444' : m.ppm > settings.warningThreshold ? '#F59E0B' : '#00D97E';
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1 group">
                    <div className="relative w-full flex justify-center">
                      <div className="text-[9px] font-mono text-white/0 group-hover:text-white/60 transition-colors absolute -top-4"
                        style={{ color: barColor }}>{m.ppm.toFixed(0)}</div>
                      <div className="w-full rounded-t-sm transition-all duration-700"
                        style={{ height: `${h}%`, background: barColor + 'cc', minHeight: 4,
                          boxShadow: overTarget ? `0 0 8px ${barColor}60` : 'none' }} />
                    </div>
                    <span className="text-[8px] font-mono text-white/25 writing-mode-vertical"
                      style={{ fontSize: 8, transform: 'rotate(-35deg)', transformOrigin: 'center', whiteSpace: 'nowrap' }}>
                      {m.month}
                    </span>
                  </div>
                );
              })}
            </div>
            {/* Target line indicator */}
            <div className="flex items-center gap-2 mt-3">
              <span className="w-4 h-0.5 rounded" style={{ background: '#EF4444' }} />
              <span className="text-[10px] font-mono text-white/30">Target: {settings.target} PPM</span>
              <span className="w-4 h-0.5 rounded ml-3" style={{ background: '#F59E0B' }} />
              <span className="text-[10px] font-mono text-white/30">Warning: {settings.warningThreshold} PPM</span>
            </div>
          </div>

          {/* Issue type breakdown */}
          <div>
            <div className="text-[10px] font-mono text-white/25 uppercase tracking-wider mb-3">Issue Type Breakdown</div>
            {data.byIssueType.map(issue => {
              const isExcluded =
                (settings.excludeDelivery && issue.type === 'Delivery Issue') ||
                (settings.criticalIssuesOnly && !['Infestation','Product Quality Issue','Product Performance Issue'].includes(issue.type));
              const w = settings.issueWeights[issue.type as keyof typeof settings.issueWeights] ?? 1;
              return (
                <div key={issue.type} className={`flex items-center gap-3 py-2 border-b border-white/[0.03] ${isExcluded ? 'opacity-30' : ''}`}>
                  <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: ISSUE_COLORS[issue.type] ?? '#666' }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-white/60 font-mono truncate">{issue.type}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {w !== 1 && <span className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                          style={{ background: ISSUE_COLORS[issue.type] + '20', color: ISSUE_COLORS[issue.type] }}>×{w}</span>}
                        <span className="text-xs font-mono" style={{ color: ISSUE_COLORS[issue.type] }}>{issue.ppm.toFixed(1)} PPM</span>
                        <span className="text-[10px] font-mono text-white/25">{issue.complaints}c</span>
                      </div>
                    </div>
                    <MiniBar value={issue.complaints} max={maxComplaint} color={ISSUE_COLORS[issue.type] ?? '#666'} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Weighted PPM callout */}
          <div className="mt-4 px-4 py-3 rounded-xl flex items-center justify-between"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <span className="text-xs font-mono text-white/50">Weighted PPM (with issue severity × weights)</span>
            <span className="text-lg font-bold font-mono text-red-400">{weightedPPM.toFixed(1)}</span>
          </div>
        </div>
      )}

      {/* ── PACKAGING TAB ── */}
      {activeTab === 'packaging' && (
        <div className="p-5">
          <div className="text-[10px] font-mono text-white/25 uppercase tracking-wider mb-4">PPM by Packaging Type · Jul 2025 – Mar 2026</div>
          {data.byPackaging.map(p => {
            const color = p.ppm > settings.target ? '#EF4444' : p.ppm > settings.warningThreshold ? '#F59E0B' : '#00D97E';
            return (
              <div key={p.type} className="mb-4">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-mono text-white/60">{p.type}</span>
                  <div className="flex gap-3 text-[10px] font-mono">
                    <span className="text-white/25">{p.sales.toLocaleString()} units</span>
                    <span className="text-white/40">{p.complaints} complaints</span>
                    <span className="font-bold" style={{ color }}>{p.ppm.toFixed(1)} PPM</span>
                  </div>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full" style={{
                    width: `${Math.min((p.ppm / 1000) * 100, 100)}%`,
                    background: color,
                    boxShadow: p.ppm > settings.target ? `0 0 6px ${color}60` : 'none',
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── SETTINGS TAB ── */}
      {activeTab === 'settings' && (
        <div className="p-5">
          <div className="text-[10px] font-mono text-white/25 uppercase tracking-wider mb-4">PPM Logic Configuration</div>

          {/* Target + Warning */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {(['target', 'warningThreshold'] as const).map(field => (
              <div key={field} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="text-[9px] font-mono text-white/25 uppercase tracking-wider mb-2">
                  {field === 'target' ? 'PPM Target (Critical)' : 'Warning Threshold'}
                </div>
                <input
                  type="number"
                  value={settings[field]}
                  onChange={e => onUpdateSettings({ [field]: parseInt(e.target.value) || 0 })}
                  className="w-full text-xl font-bold bg-transparent outline-none font-mono"
                  style={{ color: field === 'target' ? '#EF4444' : '#F59E0B' }}
                />
                <div className="text-[9px] text-white/20 font-mono mt-1">
                  {field === 'target' ? 'Above this = Critical' : 'Above this = Near target'}
                </div>
              </div>
            ))}
          </div>

          {/* Toggles */}
          <div className="mb-5 rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="text-[10px] font-mono text-white/25 uppercase tracking-wider mb-2">Filters</div>
            <SettingToggle
              label="Exclude Delivery Issues from PPM"
              value={settings.excludeDelivery}
              onChange={v => onUpdateSettings({ excludeDelivery: v })}
            />
            <SettingToggle
              label="Critical Issues Only (Infestation + Product Quality)"
              value={settings.criticalIssuesOnly}
              onChange={v => onUpdateSettings({ criticalIssuesOnly: v })}
            />
          </div>

          {/* Issue weights */}
          <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="text-[10px] font-mono text-white/25 uppercase tracking-wider mb-1">Issue Severity Weights</div>
            <div className="text-[9px] font-mono text-white/20 mb-3">Higher weight = more PPM contribution per complaint</div>
            {Object.entries(settings.issueWeights).map(([issueType, weight]) => (
              <WeightSlider
                key={issueType}
                issueType={issueType}
                value={weight}
                onChange={v => onUpdateSettings({ issueWeights: { ...settings.issueWeights, [issueType]: v } as PPMSettings['issueWeights'] })}
              />
            ))}
          </div>

          {/* Reset */}
          <button
            onClick={() => onUpdateSettings(DEFAULT_PPM_SETTINGS)}
            className="mt-4 w-full py-2 rounded-xl text-xs font-mono text-white/30 hover:text-white/60 transition-all border border-white/10 hover:border-white/20"
          >
            Reset to defaults
          </button>
        </div>
      )}

      <p className="px-5 py-3 text-[10px] text-white/20 font-mono border-t border-white/[0.04]">
        Source: Nutrimix_PPM_Analysis_Jul_to_Mar.xlsx · Raw complaint data: Book1_Final_Updated_v2.xlsx
      </p>
    </div>
  );
}
