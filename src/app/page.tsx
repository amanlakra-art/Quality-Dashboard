'use client';

import { useState, useEffect, useCallback } from 'react';
import KPICard from '@/components/KPICard';
import CMSiteTable from '@/components/CMSiteTable';
import FSSAIPanel from '@/components/FSSAIPanel';
import PPMPanel from '@/components/PPMPanel';
import EditModal from '@/components/EditModal';
import { KPI, STATUS_META, COLOR_HEX } from '@/data/kpis';
import { CMSite } from '@/data/cmSites';
import { FSSAISummary } from '@/data/fssaiData';
import { PPMData, PPMSettings } from '@/data/ppmData';

type Panel = 'gmp' | 'fssai' | 'ppm' | null;

export default function Dashboard() {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [sites, setSites] = useState<CMSite[]>([]);
  const [fssai, setFssai] = useState<FSSAISummary | null>(null);
  const [ppmData, setPpmData] = useState<PPMData | null>(null);
  const [ppmSettings, setPpmSettings] = useState<PPMSettings | null>(null);
  const [weightedPPM, setWeightedPPM] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [activePanel, setActivePanel] = useState<Panel>(null);
  const [editModal, setEditModal] = useState<{ kpi: KPI } | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

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

    // Sync PPM KPI value from API
    setKpis(prev => prev.map(k =>
      k.id === 'complaints_ppm'
        ? { ...k, value: ppmRes.weightedPPM, status: ppmRes.status, color: ppmRes.color }
        : k
    ));

    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Build Legal sub-metrics from FSSAI data
  const getLegalSubMetrics = (fssaiData: FSSAISummary | null) => {
    if (!fssaiData) return [];
    const relPct = (fssaiData.relabellerLicCompliance * 100).toFixed(1);
    const prodPct = (fssaiData.productCompliance * 100).toFixed(1);
    return [
      {
        label: 'Relabeller Lic. Compliance',
        value: `${relPct}%`,
        color: parseFloat(relPct) >= 75 ? '#00D97E' : '#F59E0B',
      },
      {
        label: 'Product Compliance',
        value: `${prodPct}%`,
        color: parseFloat(prodPct) >= 50 ? '#F59E0B' : '#EF4444',
      },
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

  const panelFor = (kpi: KPI): Panel => {
    if (kpi.id === 'gmp_compliance') return 'gmp';
    if (kpi.id === 'legal_regulatory') return 'fssai';
    if (kpi.id === 'complaints_ppm') return 'ppm';
    return null;
  };

  const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="min-h-screen grid-bg" style={{ fontFamily: 'var(--font-body)' }}>
      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #00D97E, transparent 70%)' }} />
        <div className="absolute -bottom-40 -right-20 w-[500px] h-[500px] rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #F59E0B, transparent 70%)' }} />
        <div className="absolute top-1/2 -right-60 w-[400px] h-[400px] rounded-full opacity-[0.03]"
          style={{ background: 'radial-gradient(circle, #EF4444, transparent 70%)' }} />
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 py-10">

        {/* HEADER */}
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
                <span className="text-xs font-mono tracking-[0.2em] text-white/30 uppercase">Mosaic Wellness</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white" style={{ fontFamily: 'var(--font-display)' }}>
                NPD — Quality Dashboard
              </h1>
              <p className="mt-1 text-sm text-white/40 font-mono tracking-wide">
                FOOD &amp; NUTRACEUTICALS &nbsp;·&nbsp; FY 2024–25
              </p>
            </div>
            <div className="flex items-center gap-3">
              {saving && <span className="text-xs text-white/40 font-mono animate-pulse">Saving…</span>}
              {lastSaved && !saving && <span className="text-xs text-white/25 font-mono">Saved {lastSaved}</span>}
              <div className="text-right">
                <div className="text-xs text-white/30 font-mono">{dateStr}</div>
                <div className="text-xs text-white/20 font-mono mt-0.5">Live · Auto-sync</div>
              </div>
            </div>
          </div>
          <div className="mt-6 h-px w-full"
            style={{ background: 'linear-gradient(90deg, #00D97E22, rgba(255,255,255,0.06) 40%, transparent)' }} />
        </header>

        {/* KPI GRID */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-mono tracking-[0.18em] text-white/30 uppercase">KPI Summary</h2>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[0,1,2].map(i => (
                <div key={i} className="h-56 rounded-2xl shimmer" style={{ border: '1px solid rgba(255,255,255,0.06)' }} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {kpis.map((kpi, i) => (
                <KPICard
                  key={kpi.id}
                  kpi={kpi}
                  index={i}
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

        {/* DRILL-DOWN PANELS */}
        {activePanel && (
          <section className="mb-10 fade-up">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xs font-mono tracking-[0.18em] text-white/30 uppercase">
                  {activePanel === 'gmp' ? 'CM Site Breakdown' : activePanel === 'fssai' ? 'FSSAI Regulatory Breakdown' : 'PPM Analysis'}
                </h2>
                <p className="text-xs text-white/20 mt-0.5 font-mono">
                  {activePanel === 'gmp'
                    ? 'Source: CM_Site_Scorecard.xlsx → Master'
                    : activePanel === 'fssai'
                    ? 'Source: FSSAI_3PL_Manufacture.xlsx → Summary'
                    : 'Source: Nutrimix_PPM_Analysis_Jul_to_Mar.xlsx'}
                </p>
              </div>
              <button onClick={() => setActivePanel(null)}
                className="text-xs text-white/30 hover:text-white/60 transition-colors font-mono border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg">
                ✕ Close
              </button>
            </div>

            {activePanel === 'gmp' && sites.length > 0 && (
              <CMSiteTable sites={sites} onUpdate={handleSiteUpdate} />
            )}
            {activePanel === 'fssai' && fssai && (
              <FSSAIPanel data={fssai} onUpdate={handleFSSAIUpdate} />
            )}
            {activePanel === 'ppm' && ppmData && ppmSettings && (
              <PPMPanel
                data={ppmData}
                settings={ppmSettings}
                weightedPPM={weightedPPM}
                onUpdateSettings={handlePPMSettingsUpdate}
                onUpdateData={handlePPMDataUpdate}
              />
            )}
          </section>
        )}

        {/* FOOTER */}
        <footer className="mt-16 pt-6 border-t border-white/[0.04] flex items-center justify-between text-xs text-white/20 font-mono">
          <span>NPD &amp; Innovation · Mosaic Wellness</span>
          <span>FY 2024–25 · Quality Metrics v1.1</span>
        </footer>
      </div>

      {editModal && (
        <EditModal kpi={editModal.kpi} onSave={handleKPISave} onClose={() => setEditModal(null)} />
      )}
    </div>
  );
}
