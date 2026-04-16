'use client';

import { useState } from 'react';
import { PPMData, PPMSettings, DEFAULT_PPM_SETTINGS } from '@/data/ppmData';

interface Props {
  isDark: boolean;
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

function SettingToggle({ label, value, onChange, isDark }: {
  label: string; value: boolean; onChange: (v: boolean) => void; isDark: boolean;
}) {
  const lbl = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.50)';
  return (
    <div className="flex items-center justify-between py-2.5" style={{ borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}` }}>
      <span className="text-xs font-mono" style={{ color: lbl }}>{label}</span>
      <button onClick={() => onChange(!value)}
        className="relative w-10 h-5 rounded-full transition-colors duration-200"
        style={{ background: value ? '#00D97E' : isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.12)' }}>
        <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200"
          style={{ left: value ? '1.4rem' : '0.12rem' }} />
      </button>
    </div>
  );
}

export default function PPMPanel({ isDark, data, settings, weightedPPM, onUpdateSettings, onUpdateData }: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'packaging' | 'settings'>('overview');

  // Theme tokens
  const panelBg   = isDark ? 'linear-gradient(135deg, #1A1F2E, #141720)' : 'linear-gradient(135deg, #FFFFFF, #F8F9FC)';
  const borderCol = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';
  const divider   = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
  const secLbl    = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.30)';
  const subLbl    = isDark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.22)';
  const cellText  = isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.75)';
  const mutedText = isDark ? 'rgba(255,255,255,0.50)' : 'rgba(0,0,0,0.50)';
  const faintText = isDark ? 'rgba(255,255,255,0.40)' : 'rgba(0,0,0,0.42)';
  const trackBg   = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const sboxBg    = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';
  const sboxBord  = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';
  const inpColor  = isDark ? '#E8EAF0' : '#0F1117';
  const footerTxt = isDark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.25)';
  const sectBg    = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)';
  const sectBord  = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';

  const maxMonthlyPPM = Math.max(...data.monthly.map(m => m.ppm));
  const maxComplaint  = Math.max(...data.byIssueType.map(i => i.complaints));

  const tabs = [
    { id: 'overview',  label: 'Overview' },
    { id: 'packaging', label: 'By Packaging' },
    { id: 'settings',  label: '⚙ PPM Settings' },
  ] as const;

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: panelBg, border: `1px solid ${borderCol}` }}>

      {/* Tab bar */}
      <div className="flex px-5 pt-4 gap-1" style={{ borderBottom: `1px solid ${divider}` }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className="px-3 py-2 text-[11px] font-mono rounded-t-lg transition-all duration-150"
            style={{
              color: activeTab === t.id ? (isDark ? '#fff' : '#0F1117') : mutedText,
              background: activeTab === t.id ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)') : 'transparent',
              borderBottom: activeTab === t.id ? '2px solid #EF4444' : '2px solid transparent',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {activeTab === 'overview' && (
        <div className="p-5">
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Total Sales',      value: data.totalSales.toLocaleString(), color: cellText },
              { label: 'Total Complaints', value: data.totalComplaints.toString(),  color: '#F59E0B' },
              { label: 'Raw PPM',          value: data.overallPPM.toFixed(1),       color: '#EF4444' },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-3 text-center"
                style={{ background: sboxBg, border: `1px solid ${sboxBord}` }}>
                <div className="text-[9px] font-mono uppercase tracking-wider mb-1" style={{ color: secLbl }}>{s.label}</div>
                <div className="text-lg font-bold font-mono" style={{ color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Monthly trend */}
          <div className="mb-6">
            <div className="text-[10px] font-mono uppercase tracking-wider mb-3" style={{ color: secLbl }}>
              Monthly PPM Trend · {data.period}
            </div>
            <div className="flex items-end gap-1.5 h-28">
              {data.monthly.map(m => {
                const h = Math.max((m.ppm / maxMonthlyPPM) * 100, 4);
                const overTarget = m.ppm > settings.target;
                const barColor = overTarget ? '#EF4444' : m.ppm > settings.warningThreshold ? '#F59E0B' : '#00D97E';
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1 group">
                    <div className="relative w-full flex justify-center">
                      <div className="text-[9px] font-mono opacity-0 group-hover:opacity-100 transition-colors absolute -top-4"
                        style={{ color: barColor }}>{m.ppm.toFixed(0)}</div>
                      <div className="w-full rounded-t-sm transition-all duration-700"
                        style={{ height: `${h}%`, background: barColor + 'cc', minHeight: 4,
                          boxShadow: overTarget ? `0 0 8px ${barColor}60` : 'none' }} />
                    </div>
                    <span className="text-[8px] font-mono" style={{ color: subLbl, transform: 'rotate(-35deg)', transformOrigin: 'center', whiteSpace: 'nowrap', display: 'block' }}>
                      {m.month}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 mt-3">
              <span className="w-4 h-0.5 rounded" style={{ background: '#EF4444' }} />
              <span className="text-[10px] font-mono" style={{ color: subLbl }}>Target: {settings.target} PPM</span>
              <span className="w-4 h-0.5 rounded ml-2" style={{ background: '#F59E0B' }} />
              <span className="text-[10px] font-mono" style={{ color: subLbl }}>Warning: {settings.warningThreshold} PPM</span>
            </div>
          </div>

          {/* Issue type breakdown */}
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider mb-3" style={{ color: secLbl }}>
              Issue Type Breakdown
            </div>
            {data.byIssueType.map(issue => {
              const isExcluded =
                (settings.excludeDelivery && issue.type === 'Delivery Issue') ||
                (settings.criticalIssuesOnly && !['Infestation','Product Quality Issue','Product Performance Issue'].includes(issue.type));
              return (
                <div key={issue.type} className="flex items-center gap-3 py-2"
                  style={{ borderBottom: `1px solid ${divider}`, opacity: isExcluded ? 0.25 : 1 }}>
                  <div className="w-2 h-2 rounded-sm flex-shrink-0"
                    style={{ background: ISSUE_COLORS[issue.type] ?? '#666' }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-mono truncate" style={{ color: faintText }}>{issue.type}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs font-mono" style={{ color: ISSUE_COLORS[issue.type] }}>{issue.ppm.toFixed(1)} PPM</span>
                        <span className="text-[10px] font-mono" style={{ color: subLbl }}>{issue.complaints}c</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: trackBg }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.min((issue.complaints / maxComplaint) * 100, 100)}%`, background: ISSUE_COLORS[issue.type] ?? '#666' }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* PPM callout */}
          <div className="mt-4 px-4 py-3 rounded-xl flex items-center justify-between"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <div>
              <span className="text-xs font-mono" style={{ color: mutedText }}>
                Effective PPM {settings.excludeDelivery || settings.criticalIssuesOnly ? '(filtered)' : '(all issues)'}
              </span>
              <div className="text-[10px] font-mono mt-0.5" style={{ color: subLbl }}>
                {data.totalComplaints.toLocaleString()} complaints ÷ {data.totalSales.toLocaleString()} units × 1,000,000
              </div>
            </div>
            <span className="text-lg font-bold font-mono text-red-400">{weightedPPM.toFixed(1)}</span>
          </div>
        </div>
      )}

      {/* ── PACKAGING ── */}
      {activeTab === 'packaging' && (
        <div className="p-5">
          <div className="text-[10px] font-mono uppercase tracking-wider mb-4" style={{ color: secLbl }}>
            PPM by Packaging Type · Jul 2025 – Mar 2026
          </div>
          {data.byPackaging.map(p => {
            const color = p.ppm > settings.target ? '#EF4444' : p.ppm > settings.warningThreshold ? '#F59E0B' : '#00D97E';
            return (
              <div key={p.type} className="mb-4">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-mono" style={{ color: faintText }}>{p.type}</span>
                  <div className="flex gap-3 text-[10px] font-mono">
                    <span style={{ color: subLbl }}>{p.sales.toLocaleString()} units</span>
                    <span style={{ color: mutedText }}>{p.complaints} complaints</span>
                    <span className="font-bold" style={{ color }}>{p.ppm.toFixed(1)} PPM</span>
                  </div>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: trackBg }}>
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

      {/* ── SETTINGS ── */}
      {activeTab === 'settings' && (
        <div className="p-5">
          <div className="text-[10px] font-mono uppercase tracking-wider mb-4" style={{ color: secLbl }}>
            PPM Logic Configuration
          </div>

          {/* Target + Warning */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {(['target', 'warningThreshold'] as const).map(field => (
              <div key={field} className="rounded-xl p-3" style={{ background: sboxBg, border: `1px solid ${sboxBord}` }}>
                <div className="text-[9px] font-mono uppercase tracking-wider mb-2" style={{ color: secLbl }}>
                  {field === 'target' ? 'PPM Target (Critical)' : 'Warning Threshold'}
                </div>
                <input type="number" value={settings[field]}
                  onChange={e => onUpdateSettings({ [field]: parseInt(e.target.value) || 0 })}
                  className="w-full text-xl font-bold bg-transparent outline-none font-mono"
                  style={{ color: field === 'target' ? '#EF4444' : '#F59E0B' }}
                />
                <div className="text-[9px] font-mono mt-1" style={{ color: subLbl }}>
                  {field === 'target' ? 'Above this = Critical' : 'Above this = Near target'}
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="mb-5 rounded-xl p-4" style={{ background: sectBg, border: `1px solid ${sectBord}` }}>
            <div className="text-[10px] font-mono uppercase tracking-wider mb-2" style={{ color: secLbl }}>Filters</div>
            <SettingToggle
              label="Exclude Delivery Issues from PPM"
              value={settings.excludeDelivery}
              onChange={v => onUpdateSettings({ excludeDelivery: v })}
              isDark={isDark}
            />
            <SettingToggle
              label="Critical Issues Only (Infestation + Product Quality)"
              value={settings.criticalIssuesOnly}
              onChange={v => onUpdateSettings({ criticalIssuesOnly: v })}
              isDark={isDark}
            />
          </div>

          {/* Formula note */}
          <div className="rounded-xl p-4" style={{ background: sectBg, border: `1px solid ${sectBord}` }}>
            <div className="text-[10px] font-mono uppercase tracking-wider mb-2" style={{ color: secLbl }}>PPM Formula</div>
            <div className="text-xs font-mono mb-1" style={{ color: mutedText }}>
              PPM = (Total Complaints ÷ Total Units Sold) × 1,000,000
            </div>
            <div className="text-[9px] font-mono" style={{ color: subLbl }}>
              Filters reduce the complaint count in the numerator. 1 complaint = 1 unit regardless of issue type.
            </div>
          </div>

          {/* Reset */}
          <button onClick={() => onUpdateSettings(DEFAULT_PPM_SETTINGS)}
            className="mt-4 w-full py-2 rounded-xl text-xs font-mono transition-all"
            style={{
              color: mutedText, border: `1px solid ${sboxBord}`,
              background: 'transparent',
            }}>
            Reset to defaults
          </button>
        </div>
      )}

      <p className="px-5 py-3 text-[10px] font-mono" style={{ color: footerTxt, borderTop: `1px solid ${divider}` }}>
        Source: Nutrimix_PPM_Analysis_Jul_to_Mar.xlsx · Raw complaint data: Book1_Final_Updated_v2.xlsx
      </p>
    </div>
  );
}
