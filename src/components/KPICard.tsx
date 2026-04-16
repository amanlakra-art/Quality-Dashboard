'use client';

import { useEffect, useRef, useState } from 'react';
import { KPI, STATUS_META, COLOR_HEX } from '@/data/kpis';

export interface SubMetric {
  label: string;
  value: string;
  color?: string;
}

interface Props {
  kpi: KPI;
  index: number;
  onEdit: () => void;
  onDrillDown: () => void;
  subMetrics?: SubMetric[];
  ppmOverride?: { value: number; target: number };
}

export default function KPICard({ kpi, index, onEdit, onDrillDown, subMetrics, ppmOverride }: Props) {
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

  let displayValue = isPPM && ppmOverride ? ppmOverride.value : kpi.value;
  let barPct: number;
  let targetMarkerPct: number;

  if (isPPM && ppmOverride) {
    barPct = animated ? Math.min((ppmOverride.value / ppmOverride.target) * 100, 110) : 0;
    targetMarkerPct = 90.9; // target / (target * 1.1) normalized
  } else {
    barPct = animated ? Math.min(kpi.value, 100) : 0;
    targetMarkerPct = Math.min(kpi.target, 100);
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setTilt({
      x: ((e.clientY - rect.top - rect.height / 2) / rect.height) * 8,
      y: -((e.clientX - rect.left - rect.width / 2) / rect.width) * 8,
    });
  };

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
        background: 'linear-gradient(135deg, #1A1F2E 0%, #141720 100%)',
        border: `1px solid ${hovered ? color + '28' : 'rgba(255,255,255,0.07)'}`,
        boxShadow: hovered
          ? `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${color}14, inset 0 1px 0 rgba(255,255,255,0.06)`
          : '0 1px 3px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
      className="rounded-2xl p-6 relative overflow-hidden cursor-default"
    >
      <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none"
        style={{ background: `radial-gradient(circle at top right, ${color}12, transparent 70%)`, opacity: hovered ? 1 : 0.5, transition: 'opacity .3s' }} />

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 pr-4">
          <p className="text-xs font-mono tracking-[0.14em] text-white/35 uppercase mb-2">{kpi.title}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)', color }}>
              {displayValue % 1 === 0 ? displayValue : displayValue.toFixed(1)}
            </span>
            <span className="text-xl font-mono" style={{ color: color + 'aa' }}>{kpi.unit}</span>
          </div>
          <p className="text-xs text-white/30 mt-1">{kpi.subtext}</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-mono font-medium whitespace-nowrap ${status.badge}`}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: status.dot, boxShadow: `0 0 6px ${status.dot}` }} />
          {status.label}
        </span>
      </div>

      {/* Sub-metrics (Legal card: Relabeller % + Product compliance %) */}
      {subMetrics && subMetrics.length > 0 && (
        <div className="flex gap-2 mb-4">
          {subMetrics.map((m) => (
            <div key={m.label} className="flex-1 rounded-xl px-3 py-2.5"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-[9px] font-mono text-white/25 uppercase tracking-wider mb-1 leading-tight">{m.label}</div>
              <div className="text-base font-bold font-mono" style={{ color: m.color ?? color }}>{m.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-white/25 font-mono">0</span>
          <span className="text-xs font-mono" style={{ color: color + '80' }}>Target {kpi.targetLabel}</span>
          <span className="text-xs text-white/25 font-mono">{isPPM ? `${kpi.target}+` : '100%'}</span>
        </div>
        <div className="relative h-2 rounded-full overflow-visible" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div className="absolute inset-y-0 left-0 rounded-full"
            style={{
              width: `${Math.min(barPct, 100)}%`,
              background: `linear-gradient(90deg, ${color}88, ${color})`,
              boxShadow: animated ? `0 0 8px ${color}60` : 'none',
              transition: animated ? 'width 1.2s cubic-bezier(0.16,1,0.3,1)' : 'none',
            }} />
          <div className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full"
            style={{ left: `${targetMarkerPct}%`, background: 'rgba(255,255,255,0.3)' }} />
          <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 transition-all duration-1000"
            style={{ left: `calc(${Math.min(barPct, 100)}% - 6px)`, borderColor: color, background: '#141720', boxShadow: `0 0 8px ${color}80` }} />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-white/[0.05]">
        <span className="text-[10px] text-white/20 font-mono truncate max-w-[55%]">{kpi.source}</span>
        <div className="flex items-center gap-2">
          <button onClick={onDrillDown}
            className="text-[11px] font-mono px-2.5 py-1 rounded-lg transition-all duration-200 active:scale-95"
            style={{ color: color + 'bb', background: color + '10', border: `1px solid ${color}22` }}
            onMouseEnter={e => (e.currentTarget.style.background = color + '20')}
            onMouseLeave={e => (e.currentTarget.style.background = color + '10')}>
            Drill down ↗
          </button>
          <button onClick={onEdit}
            className="text-[11px] font-mono px-2.5 py-1 rounded-lg border border-white/10 text-white/40 hover:text-white/70 hover:border-white/20 transition-all duration-200 active:scale-95"
            style={{ background: 'rgba(255,255,255,0.03)' }}>
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}
