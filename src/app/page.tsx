'use client';

import { useState, useEffect, useCallback } from 'react';
import KPICard from '@/components/KPICard';
import CMSiteTable from '@/components/CMSiteTable';
import FSSAIPanel, { type FssaiSoiRich } from '@/components/FSSAIPanel';
import PPMPanel from '@/components/PPMPanel';
import EditModal from '@/components/EditModal';
import ThemeToggle from '@/components/ThemeToggle';
import HighlightsSection from '@/components/HighlightsSection';
import { KPI, COLOR_HEX, deriveGMPStatus } from '@/data/kpis';
import { CMSite } from '@/data/cmSites';
import { FSSAISummary } from '@/data/fssaiData';
import { PPMData, PPMSettings } from '@/data/ppmData';
import type { Highlight } from '@/data/highlights';

type Theme = 'dark' | 'light';
type ActivePanel = 'gmp' | 'fssai' | 'ppm' | null;

// Live-from-sheet meta for the panels.
type SheetMeta = { fetchedAt: string; source: string };
type MosaicOverall = {
  siteReadiness: number | null;
  gmpCompliance: number | null;
  qmsCompliance: number | null;
  infraResources: number | null;
  scorePct: number | null;
};

export default function Dashboard() {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [sites, setSites] = useState<CMSite[]>([]);
  const [mosaicOverall, setMosaicOverall] = useState<MosaicOverall | null>(null);
  const [cmMeta, setCmMeta] = useState<SheetMeta | null>(null);

  const [fssai, setFssai] = useState<FSSAISummary | null>(null);
  const [fssaiSoi, setFssaiSoi] = useState<FssaiSoiRich[]>([]);
  const [fssaiTotals, setFssaiTotals] = useState<FssaiSoiRich | null>(null);
  const [fssaiMeta, setFssaiMeta] = useState<SheetMeta | null>(null);

  const [ppmData, setPpmData] = useState<PPMData | null>(null);
  const [ppmSettings, setPpmSettings] = useState<PPMSettings | null>(null);
  const [weightedPPM, setWeightedPPM] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [editModal, setEditModal] = useState<{ kpi: KPI } | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>('dark');
  const [highlights, setHighlights] = useState<Highlight[]>([]);

  // Apply + persist theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('qd-theme', theme);
  }, [theme]);

  useEffect(() => {
    const saved = localStorage.getItem('qd-theme') as Theme | null;
    if (saved === 'light' || saved === 'dark') setTheme(saved);
  }, []);

  const isDark = theme === 'dark';
  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  const t = {
    border: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.10)',
    textPrimary: isDark ? '#E8EAF0' : '#0F1117',
    // Light-mode opacities bumped up — the previous 0.3/0.2 values were
    // unreadable against the near-white surface.
    textSecondary: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.65)',
    textMuted: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.50)',
    textFaint: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.40)',
    divider: isDark
      ? 'linear-gradient(90deg, rgba(0,217,126,0.15), rgba(255,255,255,0.05) 40%, transparent)'
      : 'linear-gradient(90deg, rgba(0,217,126,0.3), rgba(0,0,0,0.06) 40%, transparent)',
    btnClose: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
  };

  const fetchAll = useCallback(async () => {
    try {
      const [kpiRes, siteRes, fssaiRes, ppmRes, hlRes] = await Promise.all([
        fetch('/api/kpis').then(r => r.json()),
        fetch('/api/cm-sites').then(r => r.json()),
        fetch('/api/fssai').then(r => r.json()),
        fetch('/api/ppm').then(r => r.json()),
        fetch('/api/highlights').then(r => r.json()),
      ]);

      // GMP card is driven live from the CM Site Scorecard "Mosaic Overall"
      // score (same 66.3% the table below shows). PPM is driven from the PPM
      // analysis. Both are read-only on the card — the sheet is the source of truth.
      const liveGMP = siteRes.mosaicOverall?.scorePct ?? siteRes.overallGMPPct;
      const kpisWithLive = (kpiRes.kpis as KPI[]).map(k => {
        if (k.id === 'complaints_ppm') {
          return { ...k, value: ppmRes.weightedPPM, status: ppmRes.status, color: ppmRes.color };
        }
        if (k.id === 'gmp_compliance' && typeof liveGMP === 'number' && !Number.isNaN(liveGMP)) {
          const rounded = Math.round(liveGMP * 10) / 10;
          const d = deriveGMPStatus(rounded);
          return { ...k, value: rounded, status: d.status, color: d.color };
        }
        return k;
      });
      setKpis(kpisWithLive);

      setSites(siteRes.sites ?? []);
      setMosaicOverall(siteRes.mosaicOverall ?? null);
      setCmMeta(siteRes.meta ?? null);

      setFssai(fssaiRes.summary ?? null);
      setFssaiSoi(fssaiRes.bySoi ?? []);
      setFssaiTotals(fssaiRes.totals ?? null);
      setFssaiMeta(fssaiRes.meta ?? null);

      setPpmData(ppmRes.data);
      setPpmSettings(ppmRes.settings);
      setWeightedPPM(ppmRes.weightedPPM);

      if (hlRes.highlights) setHighlights(hlRes.highlights);

      const apiError = siteRes.error || fssaiRes.error;
      setLoadError(apiError ? `Sheet data unavailable: ${apiError}` : null);
    } catch (err) {
      setLoadError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Auto-refresh every 60s so the dashboard reflects sheet edits without a manual reload.
  useEffect(() => {
    const id = setInterval(fetchAll, 60_000);
    return () => clearInterval(id);
  }, [fetchAll]);

  const getLegalSubMetrics = (fssaiData: FSSAISummary | null) => {
    if (!fssaiData) return [];
    const relPct  = fssaiData.relabellerLicCompliance * 100;
    const prodPct = fssaiData.productCompliance * 100;
    return [
      {
        label: 'Relabeller Lic. Compliance',
        value: `${relPct.toFixed(1)}%`,
        numericValue: relPct,
        target: 90,
        color: relPct >= 90 ? '#00D97E' : relPct >= 75 ? '#4ADE80' : '#F59E0B',
        note: `${fssaiData.relabellerInCurrentLic} of ${fssaiData.totalMfgSites} manufacturers in Mosaic licence`,
      },
      {
        label: 'Product Compliance in Relabeller',
        value: `${prodPct.toFixed(1)}%`,
        numericValue: prodPct,
        target: 75,
        color: prodPct >= 75 ? '#00D97E' : prodPct >= 50 ? '#F59E0B' : '#EF4444',
        note: `${fssaiData.totalProductInCurrentLic} of ${fssaiData.totalProducts} products endorsed · ${fssaiData.pending} pending`,
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

  // NOTE: handleSiteUpdate and handleFSSAIUpdate were removed — those panels
  // are now read-only since the Google Sheet is the source of truth.

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

  const addHighlight = async (text: string) => {
    const res = await fetch('/api/highlights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    if (data.highlights) setHighlights(data.highlights);
  };

  const deleteHighlight = async (id: string) => {
    const res = await fetch('/api/highlights', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (data.highlights) setHighlights(data.highlights);
  };

  const editHighlight = async (id: string, text: string) => {
    const res = await fetch('/api/highlights', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, text }),
    });
    const data = await res.json();
    if (data.highlights) setHighlights(data.highlights);
  };

  const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="min-h-screen grid-bg" style={{ fontFamily: 'var(--font-body)', background: 'var(--surface)' }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, #00D97E, transparent 70%)', opacity: isDark ? 0.04 : 0.06 }} />
        <div className="absolute -bottom-40 -right-20 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, #F59E0B, transparent 70%)', opacity: isDark ? 0.04 : 0.05 }} />
        <div className="absolute top-1/2 -right-60 w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, #EF4444, transparent 70%)', opacity: isDark ? 0.03 : 0.04 }} />
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 py-10">

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

              <ThemeToggle theme={theme} onToggle={toggleTheme} />

              <div className="text-right">
                <div className="text-xs font-mono" style={{ color: t.textMuted }}>{dateStr}</div>
                <div className="text-xs font-mono mt-0.5" style={{ color: t.textFaint }}>Live · Auto-sync</div>
              </div>
            </div>
          </div>
          <div className="mt-6 h-px w-full" style={{ background: t.divider }} />
        </header>

        {/* Sheet load error banner — non-blocking */}
        {loadError && (
          <div className="mb-6 px-4 py-3 rounded-lg text-xs font-mono fade-up"
            style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)',
              color: '#F87171',
            }}>
            <strong>Couldn’t load sheet data:</strong> {loadError}
          </div>
        )}

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
                  hideEdit={kpi.id === 'legal_regulatory' || kpi.id === 'gmp_compliance'}
                  legalMode={kpi.id === 'legal_regulatory'}
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

        {/* ── HIGHLIGHTS ── */}
        <HighlightsSection
          highlights={highlights}
          onAdd={addHighlight}
          onDelete={deleteHighlight}
          onEdit={editHighlight}
          isDark={isDark}
          t={t}
        />

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
                    ? 'Source: CM Site Scorecard sheet · Summary tab (live)'
                    : activePanel === 'fssai'
                    ? 'Source: FSSAI 3PL Manufacture sheet · Summary tab (live)'
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
              <CMSiteTable
                sites={sites}
                isDark={isDark}
                mosaicOverall={mosaicOverall ?? undefined}
                fetchedAt={cmMeta?.fetchedAt}
              />
            )}
            {activePanel === 'fssai' && fssai && (
              <FSSAIPanel
                data={fssai}
                isDark={isDark}
                bySoi={fssaiSoi}
                totals={fssaiTotals}
                fetchedAt={fssaiMeta?.fetchedAt}
              />
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

        <footer className="mt-16 pt-6 flex items-center justify-between text-xs font-mono"
          style={{ borderTop: `1px solid ${t.border}`, color: t.textFaint }}>
          <span>NPD &amp; Innovation · Mosaic Wellness</span>
          <span>FY 2024–25 · Quality Metrics v1.3</span>
        </footer>
      </div>

      {editModal && (
        <EditModal kpi={editModal.kpi} isDark={isDark} onSave={handleKPISave} onClose={() => setEditModal(null)} />
      )}
    </div>
  );
}
