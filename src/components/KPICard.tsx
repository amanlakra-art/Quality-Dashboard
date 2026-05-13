'use client';

import { useEffect, useRef, useState } from 'react';
import { KPI, STATUS_META, COLOR_HEX } from '@/data/kpis';

export interface SubMetric {
  label: string;
  value: string;
  numericValue: number;  // 0-100
  target: number;
  color: string;
  note?: string;
}

interface Props {
  kpi: KPI;
  index: number;
  isDark: boolean;
  hideEdit?: boolean;
  legalMode?: boolean;       // replaces big number with two sub-metric blocks
  onEdit: () => void;
  onDrillDown: () => void;
  subMetrics?: SubMetric[];
  ppmOverride?: { value: number; target: number };
}

export default function KPICard({ kpi, index, isDark, hideEdit, legalMode, onEdit, onDrillDown, subMetrics, ppmOverride }: Props) {
  const [animated, setAnimated] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100 + index * 150);
    return () => clearTimeout(t);
  }, [index]);

  const color = COLOR_HEX[kpi.color];
  const status = STATUS_META[kpi.status];
  const isPPM = kpi.unit === 'PPM';

  const displayValue = isPPM && ppmOverride ? ppmOverride.value : kpi.value;
  const barPct = isPPM && ppmOverride
    ? animated ? Math.min((ppmOverride.value / ppmOverride.target) * 100, 110) : 0
    : animated ? Math.min(kpi.value, 100) : 0;
  const targetMarkerPct = isPPM ? 90.9 : Math.min(kpi.target, 100);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setTilt({
      x: ((e.clientY - rect.top - rect.height / 2) / rect.height) * 8,
      y: -((e.clientX - rect.left - rect.width / 2) / rect.width) * 8,
    });
  };

  // Theme tokens. Light-mode opacities increased — the previous values (0.38,
  // 0.28, 0.30, 0.20) were too low against the near-white card surface,
  // making the subtext/labels/source line nearly invisible.
  const cardBg       = isDark ? 'linear-gradient(135deg, #1A1F2E 0%, #141720 100%)' : 'linear-gradient(135deg, #FFFFFF 0%, #F8F9FC 100%)';
  const borderBase   = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.10)';
  const shadowBase   = isDark ? '0 1px 3px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.25)' : '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)';
  const shadowHover  = isDark ? `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${color}14` : `0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px ${color}28`;
  const labelColor   = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.55)';
  const subtextColor = isDark ? 'rgba(255,255,255,0.30)' : 'rgba(0,0,0,0.55)';
  const trackBg      = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';
  const targetLineBg = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)';
  const dotBg        = isDark ? '#141720' : '#FFFFFF';
  const footerBorder = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)';
  const srcColor     = isDark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.45)';
  const editBtnStyle = isDark
    ? { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.40)' }
    : { background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.12)', color: 'rgba(0,0,0,0.65)' };
  const chipBorder   = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.10)';
  const noteTxt      = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.55)';

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setTilt({ x: 0, y: 0 }); setHovered(false); }}
      style={{
        transform: hovered
          ? `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(-2px)`
          : 'perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0px)',
        transition: hovered ? 'transform 0.1s ease' : 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        animation: `fadeUp 0.5s ${index * 0.12}s ease both`,
        background: cardBg,
        border: `1px solid ${hovered ? color + '30' : borderBase}`,
        boxShadow: hovered ? shadowHover : shadowBase,
      }}
      className="rounded-2xl p-6 relative overflow-hidden cursor-default"
    >
      {/* Corner glow */}
      <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none"
        style={{ background: `radial-gradient(circle at top right, ${color}12, transparent 70%)`, opacity: hovered ? 1 : 0.5, transition: 'opacity .3s' }} />

      {/* ── TITLE ROW (always shown) ── */}
      <div className="flex items-start justify-between mb-5">
        <p className="text-xs font-mono tracking-[0.14em] uppercase" style={{ color: labelColor }}>{kpi.title}</p>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-mono font-medium whitespace-nowrap ${status.badge}`}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: status.dot, boxShadow: `0 0 6px ${status.dot}` }} />
          {status.label}
        </span>
      </div>

      {/* ── LEGAL MODE: two big metric blocks, no headline number ── */}
      {legalMode && subMetrics && subMetrics.length > 0 ? (
        <div className="flex flex-col gap-3 mb-4">
          {subMetrics.map(m => {
            const metricPct = animated ? Math.min(m.numericValue, 100) : 0;
            const targetPct = Math.min(m.target, 100);
            return (
              <div key={m.label} className="rounded-xl p-4"
                style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', border: `1px solid ${chipBorder}` }}>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: labelColor }}>{m.label}</span>
                  <span className="text-2xl font-bold font-mono" style={{ fontFamily: 'var(--font-display)', color: m.color }}>{m.value}</span>
                </div>
                {m.note && (
                  <p className="text-[10px] font-mono mb-2" style={{ color: noteTxt }}>{m.note}</p>
                )}
                {/* Mini progress bar */}
                <div className="relative h-1.5 rounded-full overflow-visible" style={{ background: trackBg }}>
                  <div className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      width: `${metricPct}%`,
                      background: `linear-gradient(90deg, ${m.color}88, ${m.color})`,
                      transition: animated ? 'width 1.2s cubic-bezier(0.16,1,0.3,1)' : 'none',
                    }} />
                  <div className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 rounded-full"
                    style={{ left: `${targetPct}%`, background: targetLineBg }} />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[9px] font-mono" style={{ color: noteTxt }}>0%</span>
                  <span className="text-[9px] font-mono" style={{ color: m.color + '80' }}>Target ≥{m.target}%</span>
                  <span className="text-[9px] font-mono" style={{ color: noteTxt }}>100%</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── STANDARD MODE: big number + single progress bar ── */
        <>
          <div className="mb-4">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)', color }}>
                {displayValue % 1 === 0 ? displayValue : displayValue.toFixed(1)}
              </span>
              <span className="text-xl font-mono" style={{ color: color + 'aa' }}>{kpi.unit}</span>
            </div>
            <p className="text-xs mt-1" style={{ color: subtextColor }}>{kpi.subtext}</p>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-mono" style={{ color: subtextColor }}>0</span>
              <span className="text-xs font-mono" style={{ color: color + '90' }}>Target {kpi.targetLabel}</span>
              <span className="text-xs font-mono" style={{ color: subtextColor }}>{isPPM ? `${kpi.target}+` : '100%'}</span>
            </div>
            <div className="relative h-2 rounded-full overflow-visible" style={{ background: trackBg }}>
              <div className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  width: `${Math.min(barPct, 100)}%`,
                  background: `linear-gradient(90deg, ${color}88, ${color})`,
                  boxShadow: animated ? `0 0 8px ${color}60` : 'none',
                  transition: animated ? 'width 1.2s cubic-bezier(0.16,1,0.3,1)' : 'none',
                }} />
              <div className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full"
                style={{ left: `${targetMarkerPct}%`, background: targetLineBg }} />
              <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 transition-all duration-1000"
                style={{ left: `calc(${Math.min(barPct, 100)}% - 6px)`, borderColor: color, background: dotBg, boxShadow: `0 0 8px ${color}80` }} />
            </div>
          </div>
        </>
      )}

      {/* ── FOOTER ── */}
      <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${footerBorder}` }}>
        <span className="text-[10px] font-mono truncate max-w-[55%]" style={{ color: srcColor }}>{kpi.source}</span>
        <div className="flex items-center gap-2">
          <button onClick={onDrillDown}
            className="text-[11px] font-mono px-2.5 py-1 rounded-lg transition-all duration-200 active:scale-95"
            style={{ color: color + 'cc', background: color + '12', border: `1px solid ${color}25` }}
            onMouseEnter={e => (e.currentTarget.style.background = color + '22')}
            onMouseLeave={e => (e.currentTarget.style.background = color + '12')}>
            Drill down ↗
          </button>
          {!hideEdit && (
            <button onClick={onEdit}
              className="text-[11px] font-mono px-2.5 py-1 rounded-lg transition-all duration-200 active:scale-95"
              style={editBtnStyle}>
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
