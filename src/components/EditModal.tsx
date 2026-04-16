'use client';

import { useState, useEffect } from 'react';
import { KPI, COLOR_HEX, deriveGMPStatus, deriveLegalStatus } from '@/data/kpis';

interface Props {
  isDark: boolean;
  kpi: KPI;
  onSave: (id: string, value: number) => void;
  onClose: () => void;
}

export default function EditModal({ isDark, kpi, onSave, onClose }: Props) {
  const [value, setValue] = useState(kpi.value);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const color = COLOR_HEX[kpi.color];
  const previewDerived = kpi.id === 'gmp_compliance' ? deriveGMPStatus(value) : deriveLegalStatus(value);
  const previewColor = COLOR_HEX[previewDerived.color];

  // Theme tokens
  const modalBg   = isDark ? 'linear-gradient(135deg, #1E2436, #171C28)' : 'linear-gradient(135deg, #FFFFFF, #F4F5FA)';
  const modalBord = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)';
  const closeBg   = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
  const closeHov  = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
  const titleCol  = isDark ? '#E8EAF0' : '#0F1117';
  const lblCol    = isDark ? 'rgba(255,255,255,0.30)' : 'rgba(0,0,0,0.35)';
  const valueBg   = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';
  const valueBord = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';
  const btnBg     = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
  const btnBord   = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)';
  const btnCol    = isDark ? 'rgba(255,255,255,0.40)' : 'rgba(0,0,0,0.45)';
  const tickBg    = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)';
  const tickCol   = isDark ? 'rgba(255,255,255,0.40)' : 'rgba(0,0,0,0.45)';
  const srcCol    = isDark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.25)';
  const rangeMax  = kpi.unit === 'PPM' ? (kpi.target * 2).toString() : '100';

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-2xl p-6 transition-all duration-300"
        style={{
          background: modalBg,
          border: `1px solid ${modalBord}`,
          boxShadow: `0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px ${color}18`,
          transform: mounted ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.97)',
          opacity: mounted ? 1 : 0,
        }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] font-mono tracking-widest uppercase mb-1" style={{ color: lblCol }}>Edit KPI Value</p>
            <h3 className="font-semibold text-sm" style={{ color: titleCol }}>{kpi.title}</h3>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
            style={{ color: lblCol, background: closeBg }}
            onMouseEnter={e => (e.currentTarget.style.background = closeHov)}
            onMouseLeave={e => (e.currentTarget.style.background = closeBg)}>
            ✕
          </button>
        </div>

        {/* Value display */}
        <div className="flex items-center justify-center gap-3 py-6 rounded-xl mb-4"
          style={{ background: valueBg, border: `1px solid ${valueBord}` }}>
          <button onClick={() => setValue(v => Math.max(0, parseFloat((v - 0.5).toFixed(2))))}
            className="w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all active:scale-90"
            style={{ color: tickCol, background: tickBg, border: `1px solid ${btnBord}` }}>
            −
          </button>
          <div className="text-center">
            <input type="number" min="0" max={rangeMax} step="0.5" value={value}
              onChange={e => setValue(parseFloat(e.target.value) || 0)}
              className="text-5xl font-bold text-center bg-transparent outline-none w-32"
              style={{ fontFamily: 'var(--font-display)', color: previewColor }}
            />
            <span className="text-xl font-mono" style={{ color: previewColor + '80' }}>{kpi.unit}</span>
          </div>
          <button onClick={() => setValue(v => parseFloat((v + 0.5).toFixed(2)))}
            className="w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all active:scale-90"
            style={{ color: tickCol, background: tickBg, border: `1px solid ${btnBord}` }}>
            +
          </button>
        </div>

        {/* Slider */}
        <input type="range" min="0" max={rangeMax} step="0.5" value={value}
          onChange={e => setValue(parseFloat(e.target.value))}
          className="w-full mb-1"
          style={{ accentColor: previewColor }}
        />
        <div className="flex justify-between text-[10px] font-mono mb-5" style={{ color: srcCol }}>
          <span>0{kpi.unit}</span>
          <span>Target: {kpi.targetLabel}</span>
          <span>{rangeMax}{kpi.unit}</span>
        </div>

        {/* Status preview */}
        <div className="mb-5 px-4 py-3 rounded-xl flex items-center gap-3"
          style={{ background: previewColor + '10', border: `1px solid ${previewColor}25` }}>
          <div className="w-2 h-2 rounded-full" style={{ background: previewColor, boxShadow: `0 0 6px ${previewColor}` }} />
          <span className="text-xs font-mono" style={{ color: previewColor }}>
            Status will be: <strong>{previewDerived.status.replace('_', ' ')}</strong>
          </span>
        </div>

        <p className="text-[10px] font-mono mb-5" style={{ color: srcCol }}>Source: {kpi.source}</p>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-mono transition-all"
            style={{ color: btnCol, background: btnBg, border: `1px solid ${btnBord}` }}>
            Cancel
          </button>
          <button onClick={() => onSave(kpi.id, value)}
            className="flex-1 py-2.5 rounded-xl text-sm font-mono font-semibold transition-all active:scale-95"
            style={{
              background: `linear-gradient(135deg, ${previewColor}88, ${previewColor})`,
              color: '#000',
              boxShadow: `0 4px 16px ${previewColor}40`,
            }}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
