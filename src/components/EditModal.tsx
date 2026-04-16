'use client';

import { useState, useEffect } from 'react';
import { KPI, COLOR_HEX, deriveGMPStatus, deriveLegalStatus } from '@/data/kpis';

interface Props {
  kpi: KPI;
  onSave: (id: string, value: number) => void;
  onClose: () => void;
}

export default function EditModal({ kpi, onSave, onClose }: Props) {
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 transition-all duration-300"
        style={{
          background: 'linear-gradient(135deg, #1E2436, #171C28)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: `0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px ${color}18`,
          transform: mounted ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.97)',
          opacity: mounted ? 1 : 0,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] font-mono text-white/30 tracking-widest uppercase mb-1">Edit KPI Value</p>
            <h3 className="text-white font-semibold text-sm">{kpi.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all"
          >
            ✕
          </button>
        </div>

        {/* Value input */}
        <div className="mb-6">
          <div className="flex items-center justify-center gap-3 py-6 rounded-xl mb-4"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <button
              onClick={() => setValue(v => Math.max(0, parseFloat((v - 0.5).toFixed(2))))}
              className="w-9 h-9 rounded-xl text-lg text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-90 flex items-center justify-center border border-white/10"
            >−</button>
            <div className="text-center">
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={value}
                onChange={e => setValue(parseFloat(e.target.value) || 0)}
                className="text-5xl font-bold text-center bg-transparent outline-none w-32"
                style={{ fontFamily: 'var(--font-display)', color: previewColor }}
              />
              <span className="text-xl font-mono" style={{ color: previewColor + '80' }}>{kpi.unit}</span>
            </div>
            <button
              onClick={() => setValue(v => Math.min(100, parseFloat((v + 0.5).toFixed(2))))}
              className="w-9 h-9 rounded-xl text-lg text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-90 flex items-center justify-center border border-white/10"
            >+</button>
          </div>

          {/* Slider */}
          <input
            type="range"
            min="0"
            max="100"
            step="0.5"
            value={value}
            onChange={e => setValue(parseFloat(e.target.value))}
            className="w-full accent-current"
            style={{ accentColor: previewColor }}
          />
          <div className="flex justify-between text-[10px] font-mono text-white/20 mt-1">
            <span>0{kpi.unit}</span>
            <span>Target: {kpi.targetLabel}</span>
            <span>100{kpi.unit}</span>
          </div>
        </div>

        {/* Preview */}
        <div className="mb-5 px-4 py-3 rounded-xl flex items-center gap-3"
          style={{ background: previewColor + '10', border: `1px solid ${previewColor}25` }}>
          <div className="w-2 h-2 rounded-full" style={{ background: previewColor, boxShadow: `0 0 6px ${previewColor}` }} />
          <span className="text-xs font-mono" style={{ color: previewColor }}>
            Status will be: <strong>{previewDerived.status.replace('_', ' ')}</strong>
          </span>
        </div>

        {/* Source info */}
        <p className="text-[10px] text-white/20 font-mono mb-5">
          Source: {kpi.source}
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-mono text-white/40 hover:text-white/60 transition-all border border-white/10 hover:border-white/20"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(kpi.id, value)}
            className="flex-1 py-2.5 rounded-xl text-sm font-mono font-semibold transition-all active:scale-95"
            style={{
              background: `linear-gradient(135deg, ${previewColor}88, ${previewColor})`,
              color: '#000',
              boxShadow: `0 4px 16px ${previewColor}40`,
            }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 6px 24px ${previewColor}60`)}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = `0 4px 16px ${previewColor}40`)}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
