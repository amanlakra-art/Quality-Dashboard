'use client';

import { useState, useEffect, useCallback } from 'react';
import KPICard from '@/components/KPICard';
import CMSiteTable from '@/components/CMSiteTable';
import FSSAIPanel from '@/components/FSSAIPanel';
import PPMPanel from '@/components/PPMPanel';
import EditModal from '@/components/EditModal';
import ThemeToggle from '@/components/ThemeToggle';
import { KPI, COLOR_HEX } from '@/data/kpis';
import { CMSite } from '@/data/cmSites';
import { FSSAISummary } from '@/data/fssaiData';
import { PPMData, PPMSettings } from '@/data/ppmData';

type Panel = 'dark' | 'light';
type Theme = 'dark' | 'light';
type ActivePanel = 'gmp' | 'fssai' | 'ppm' | null;

export default function Dashboard() {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [sites, setSites] = useState<CMSite[]>([]);
  const [fssai, setFssai] = useState<FSSAISummary | null>(null);
  const [ppmData, setPpmData] = useState<PPMData | null>(null);
  const [ppmSettings, setPpmSettings] = useState<PPMSettings | null>(null);
  const [weightedPPM, setWeightedPPM] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [editModal, setEditModal] = useState<{ kpi: KPI } | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>('dark');

  // Apply + persist theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('qd-theme', theme);
  }, [theme]);

  // Restore on load
  useEffect(() => {
    const saved = localStorage.getItem('qd-theme') as Theme | null;
    if (saved === 'light' || saved === 'dark') setTheme(saved);
  }, []);

  const isDark = theme === 'dark';
  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  // Theme-aware style helpers
  const t = {
    bg: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
    border: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)',
    borderHover: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.16)',
    textPrimary: isDark ? '#E8EAF0' : '#0F1117',
    textSecondary: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.45)',
    textMuted: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)',
    textFaint: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.2)',
    cardBg: isDark ? 'linear-gradient(135deg, #1A1F2E 0%, #141720 100%)' : 'linear-gradient(135deg, #FFFFFF 0%, #F8F9FC 100%)',
    panelBg: isDark ? 'linear-gradient(135deg, #1A1F2E, #141720)' : 'linear-gradient(135deg, #FFFFFF, #F8F9FC)',
    shimmerRow: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
    divider: isDark
      ? 'linear-gradient(90deg, rgba(0,217,126,0.15), rgba(255,255,255,0.05) 40%, transparent)'
      : 'linear-gradient(90deg, rgba(0,217,126,0.3), rgba(0,0,0,0.06) 40%, transparent)',
    btnClose: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
  };

  const fetchAll = useCallback(async () => {
    const [kpiRes, siteRes, fssaiRes, ppmRes] = await Promise.all([
      fetch('/api/kpis').then(r => r.json()),
      fetch('/api/cm-sites').then(r => r.json()),
      fetch('/api/fssai').then(r => r.json()),
      fetch('/api/ppm').then(r => r.json()),
    ]);
    setKpis(kpiRes.kpis);
    setSites(siteRes.sites);
    setFssai(fssaiRes.summary);
    setPpmData(ppmRes.data);
    setPpmSettings(ppmRes.settings);
    setWeightedPPM(ppmRes.weightedPPM);
    setKpis(prev => prev.length ? prev.map(k =>
      k.id === 'complaints_ppm'
        ? { ...k, value: ppmRes.weightedPPM, status: ppmRes.status, color: ppmRes.color }
        : k
    ) : kpiRes.kpis);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const getLegalSubMetrics = (fssaiData: FSSAISummary | null) => {
    if (!fssaiData) return [];
    const relPct = (fssaiData.relabellerLicCompliance * 100).toFixed(1);
    const prodPct = (fssaiData.productCompliance * 100).toFixed(1);
    return [
      { label: 'Relabeller Lic. Compliance', value: `${relPct}%`, color: parseFloat(relPct) >= 75 ? '#00D97E' : '#F59E0B' },
      { label: 'Product Compliance', value: `${prodPct}%`, color: parseFloat(prodPct) >= 50 ? '#F59E0B' : '#EF4444' },
    ];
  };

  const handleKPISave = async (id: string, value: number) => {
    setSaving(true);
    const res = await fetch('/api/kpis', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, value }),
    });
    const data = await res.json();
    setKpis(prev => prev.map(k => k.id === id ? data.kpi : k));
    setSaving(false);
    setEditModal(null);
    setLastSaved(new Date().toLocaleTimeString());
  };

  const handleSiteUpdate = async (name: string, field: keyof CMSite, value: number | null) => {
    setSaving(true);
    const res = await fetch('/api/cm-sites', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, [field]: value }),
    });
    const data = await res.json();
    setSites(prev => prev.map(s => s.name === name ? data.site : s));
    if (data.overallGMPPct !== undefined) {
      setKpis(prev => prev.map(k =>
        k.id === 'gmp_compliance'
          ? { ...k, value: Math.round(data.overallGMPPct * 100) / 100, status: data.status, color: data.color }
          : k
      ));
    }
    setSaving(false);
    setLastSaved(new Date().toLocaleTimeString());
  };

  const handleFSSAIUpdate = async (updates: Partial<FSSAISummary>) => {
    setSaving(true);
    const res = await fetch('/api/fssai', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    setFssai(data.summary);
    if (data.legalScore !== undefined) {
      setKpis(prev => prev.map(k =>
        k.id === 'legal_regulatory'
          ? { ...k, value: data.legalScore, status: data.status, color: data.color }
          : k
      ));
    }
    setSaving(false);
    setLastSaved(new Date().toLocaleTimeString());
  };

  const handlePPMSettingsUpdate = async (updates: Partial<PPMSettings>) => {
    setSaving(true);
    const res = await fetch('/api/ppm', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'settings', payload: updates }),
    });
    const data = await res.json();
    setPpmSettings(data.settings);
    setWeightedPPM(data.weightedPPM);
    setKpis(prev => prev.map(k =>
      k.id === 'complaints_ppm'
        ? { ...k, value: data.weightedPPM, status: data.status, color: data.color }
        : k
    ));
    setSaving(false);
    setLastSaved(new Date().toLocaleTimeString());
  };

  const handlePPMDataUpdate = async (updates: Partial<PPMData>) => {
    setSaving(true);
    const res = await fetch('/api/ppm', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'data', payload: updates }),
    });
    const data = await res.json();
    setPpmData(data.data);
    setWeightedPPM(data.weightedPPM);
    setSaving(false);
    setLastSaved(new Date().toLocaleTimeString());
  };

  const panelFor = (kpi: KPI): ActivePanel => {
    if (kpi.id === 'gmp_compliance') return 'gmp';
    if (kpi.id === 'legal_regulatory') return 'fssai';
    if (kpi.id === 'complaints_ppm') return 'ppm';
    return null;
  };

  const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="min-h-screen grid-bg" style={{ fontFamily: 'var(--font-body)', background: 'var(--surface)' }}>
      {/* Ambient blobs — subtler in light mode */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, #00D97E, transparent 70%)', opacity: isDark ? 0.04 : 0.06 }} />
        <div className="absolute -bottom-40 -right-20 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, #F59E0B, transparent 70%)', opacity: isDark ? 0.04 : 0.05 }} />
        <div className="absolute top-1/2 -right-60 w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, #EF4444, transparent 70%)', opacity: isDark ? 0.03 : 0.04 }} />
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 py-10">

        {/* ── HEADER ── */}
        <header className="fade-up mb-10">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(0,217,126,0.12)', border: '1px solid rgba(0,217,126,0.25)' }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="#00D97E" strokeWidth="1.5" strokeLinejoin="round"/>
                    <circle cx="8" cy="8" r="2" fill="#00D97E"/>
                  </svg>
                </div>
                <span className="text-xs font-mono tracking-[0.2em] uppercase" style={{ color: t.textMuted }}>Mosaic Wellness</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)', color: t.textPrimary }}>
                NPD — Quality Dashboard
              </h1>
              <p className="mt-1 text-sm font-mono tracking-wide" style={{ color: t.textMuted }}>
                FOOD &amp; NUTRACEUTICALS &nbsp;·&nbsp; FY 2024–25
              </p>
            </div>

            <div className="flex items-center gap-3">
              {saving && <span className="text-xs font-mono animate-pulse" style={{ color: t.textMuted }}>Saving…</span>}
              {lastSaved && !saving && <span className="text-xs font-mono" style={{ color: t.textFaint }}>Saved {lastSaved}</span>}

              {/* Theme toggle */}
              <ThemeToggle theme={theme} onToggle={toggleTheme} />

              <div className="text-right">
                <div className="text-xs font-mono" style={{ color: t.textMuted }}>{dateStr}</div>
                <div className="text-xs font-mono mt-0.5" style={{ color: t.textFaint }}>Live · Auto-sync</div>
              </div>
            </div>
          </div>
          <div className="mt-6 h-px w-full" style={{ background: t.divider }} />
        </header>

        {/* ── KPI GRID ── */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-mono tracking-[0.18em] uppercase" style={{ color: t.textMuted }}>KPI Summary</h2>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[0,1,2].map(i => (
                <div key={i} className="h-56 rounded-2xl shimmer" style={{ border: `1px solid ${t.border}` }} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {kpis.map((kpi, i) => (
                <KPICard
                  key={kpi.id}
                  kpi={kpi}
                  index={i}
                  isDark={isDark}
                  onEdit={() => setEditModal({ kpi })}
                  onDrillDown={() => setActivePanel(prev => prev === panelFor(kpi) ? null : panelFor(kpi))}
                  subMetrics={kpi.id === 'legal_regulatory' ? getLegalSubMetrics(fssai) : undefined}
                  ppmOverride={kpi.id === 'complaints_ppm' && ppmSettings
                    ? { value: weightedPPM, target: ppmSettings.target }
                    : undefined
                  }
                />
              ))}
            </div>
          )}
        </section>

        {/* ── DRILL-DOWN PANELS ── */}
        {activePanel && (
          <section className="mb-10 fade-up">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xs font-mono tracking-[0.18em] uppercase" style={{ color: t.textMuted }}>
                  {activePanel === 'gmp' ? 'CM Site Breakdown' : activePanel === 'fssai' ? 'FSSAI Regulatory Breakdown' : 'PPM Analysis'}
                </h2>
                <p className="text-xs mt-0.5 font-mono" style={{ color: t.textFaint }}>
                  {activePanel === 'gmp'
                    ? 'Source: CM_Site_Scorecard.xlsx → Master'
                    : activePanel === 'fssai'
                    ? 'Source: FSSAI_3PL_Manufacture.xlsx → Summary'
                    : 'Source: Nutrimix_PPM_Analysis_Jul_to_Mar.xlsx'}
                </p>
              </div>
              <button
                onClick={() => setActivePanel(null)}
                className="text-xs font-mono px-3 py-1.5 rounded-lg transition-all"
                style={{ color: t.textSecondary, background: t.btnClose, border: `1px solid ${t.border}` }}
              >
                ✕ Close
              </button>
            </div>

            {activePanel === 'gmp' && sites.length > 0 && (
              <CMSiteTable sites={sites} onUpdate={handleSiteUpdate} isDark={isDark} />
            )}
            {activePanel === 'fssai' && fssai && (
              <FSSAIPanel data={fssai} onUpdate={handleFSSAIUpdate} isDark={isDark} />
            )}
            {activePanel === 'ppm' && ppmData && ppmSettings && (
              <PPMPanel
                data={ppmData}
                settings={ppmSettings}
                weightedPPM={weightedPPM}
                isDark={isDark}
                onUpdateSettings={handlePPMSettingsUpdate}
                onUpdateData={handlePPMDataUpdate}
              />
            )}
          </section>
        )}

        {/* ── FOOTER ── */}
        <footer className="mt-16 pt-6 flex items-center justify-between text-xs font-mono"
          style={{ borderTop: `1px solid ${t.border}`, color: t.textFaint }}>
          <span>NPD &amp; Innovation · Mosaic Wellness</span>
          <span>FY 2024–25 · Quality Metrics v1.2</span>
        </footer>
      </div>

      {editModal && (
        <EditModal kpi={editModal.kpi} isDark={isDark} onSave={handleKPISave} onClose={() => setEditModal(null)} />
      )}
    </div>
  );
}
