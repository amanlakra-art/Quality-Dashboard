'use client';

import { useState, useRef, useEffect } from 'react';
import type { Highlight } from '@/data/highlights';
import { getWeekStart, formatWeekRange } from '@/data/highlights';

interface StyleTokens {
  cardBg: string;
  border: string;
  borderHover: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textFaint: string;
  bg: string;
}

interface Props {
  highlights: Highlight[];
  onAdd: (text: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isDark: boolean;
  t: StyleTokens;
}

export default function HighlightsSection({ highlights, onAdd, onDelete, isDark, t }: Props) {
  const [tab, setTab] = useState<'current' | 'historical'>('current');
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const thisWeek = getWeekStart();

  const currentItems = highlights.filter(h => h.weekStart === thisWeek);
  const historicalItems = highlights.filter(h => h.weekStart !== thisWeek);

  // Group historical by weekStart desc
  const grouped = historicalItems.reduce<Record<string, Highlight[]>>((acc, h) => {
    (acc[h.weekStart] ||= []).push(h);
    return acc;
  }, {});
  const sortedWeeks = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  async function handleAdd() {
    const text = input.trim();
    if (!text || submitting) return;
    setSubmitting(true);
    setInput('');
    await onAdd(text);
    setSubmitting(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleAdd();
  }

  const tabBase: React.CSSProperties = {
    padding: '4px 14px',
    borderRadius: 8,
    fontSize: 11,
    fontFamily: 'monospace',
    letterSpacing: '0.1em',
    cursor: 'pointer',
    border: `1px solid ${t.border}`,
    transition: 'all 0.15s',
  };

  const tabActive: React.CSSProperties = {
    ...tabBase,
    background: isDark ? 'rgba(0,217,126,0.12)' : 'rgba(0,160,100,0.1)',
    borderColor: isDark ? 'rgba(0,217,126,0.4)' : 'rgba(0,160,100,0.35)',
    color: isDark ? '#00D97E' : '#008C52',
  };

  const tabInactive: React.CSSProperties = {
    ...tabBase,
    background: 'transparent',
    color: t.textMuted,
  };

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2
          className="text-xs font-mono tracking-[0.18em] uppercase"
          style={{ color: t.textMuted }}
        >
          Highlights
        </h2>
        <div className="flex gap-2">
          <button
            style={tab === 'current' ? tabActive : tabInactive}
            onClick={() => setTab('current')}
          >
            Current
          </button>
          <button
            style={tab === 'historical' ? tabActive : tabInactive}
            onClick={() => setTab('historical')}
          >
            Historical
            {historicalItems.length > 0 && (
              <span
                className="ml-1.5 inline-flex items-center justify-center rounded-full text-[10px] font-mono"
                style={{
                  width: 16, height: 16,
                  background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                  color: t.textSecondary,
                }}
              >
                {sortedWeeks.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <div
        className="rounded-2xl p-6"
        style={{
          background: t.cardBg,
          border: `1px solid ${t.border}`,
          boxShadow: isDark
            ? '0 4px 24px rgba(0,0,0,0.3), 0 1px 4px rgba(0,0,0,0.2)'
            : '0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)',
        }}
      >
        {tab === 'current' ? (
          <div>
            <p
              className="text-xs font-mono mb-4"
              style={{ color: t.textFaint, letterSpacing: '0.08em' }}
            >
              Week of {formatWeekRange(thisWeek)}
            </p>

            {currentItems.length === 0 && (
              <p className="text-sm mb-4" style={{ color: t.textMuted }}>
                No highlights yet for this week.
              </p>
            )}

            <ul className="space-y-2 mb-4">
              {currentItems.map(h => (
                <li
                  key={h.id}
                  className="flex items-start gap-3 group"
                >
                  <span
                    className="mt-[3px] shrink-0 text-[10px]"
                    style={{ color: isDark ? '#00D97E' : '#008C52' }}
                  >
                    ●
                  </span>
                  <span
                    className="flex-1 text-sm leading-relaxed"
                    style={{ color: t.textPrimary }}
                  >
                    {h.text}
                  </span>
                  <button
                    onClick={() => onDelete(h.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-xs shrink-0 mt-0.5"
                    style={{ color: t.textMuted }}
                    title="Remove"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>

            <div
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{
                background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                border: `1px solid ${t.border}`,
              }}
            >
              <span style={{ color: isDark ? '#00D97E' : '#008C52', fontSize: 12 }}>+</span>
              <input
                ref={inputRef}
                type="text"
                placeholder="Add a highlight… (press Enter)"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={submitting}
                className="flex-1 bg-transparent outline-none text-sm font-mono placeholder:opacity-40"
                style={{ color: t.textPrimary }}
              />
              {input.trim() && (
                <button
                  onClick={handleAdd}
                  disabled={submitting}
                  className="text-xs font-mono px-3 py-1 rounded-lg transition-all"
                  style={{
                    background: isDark ? 'rgba(0,217,126,0.12)' : 'rgba(0,160,100,0.1)',
                    color: isDark ? '#00D97E' : '#008C52',
                    border: `1px solid ${isDark ? 'rgba(0,217,126,0.3)' : 'rgba(0,160,100,0.25)'}`,
                  }}
                >
                  Add
                </button>
              )}
            </div>
          </div>
        ) : (
          <div>
            {sortedWeeks.length === 0 ? (
              <p className="text-sm" style={{ color: t.textMuted }}>
                No historical highlights yet — they'll appear here when the next week starts.
              </p>
            ) : (
              <div className="space-y-6">
                {sortedWeeks.map(weekStart => (
                  <div key={weekStart}>
                    <p
                      className="text-xs font-mono mb-3"
                      style={{
                        color: t.textFaint,
                        letterSpacing: '0.08em',
                        borderBottom: `1px solid ${t.border}`,
                        paddingBottom: 8,
                      }}
                    >
                      Week of {formatWeekRange(weekStart)}
                    </p>
                    <ul className="space-y-2">
                      {grouped[weekStart].map(h => (
                        <li key={h.id} className="flex items-start gap-3">
                          <span
                            className="mt-[3px] shrink-0 text-[10px]"
                            style={{ color: isDark ? 'rgba(0,217,126,0.5)' : 'rgba(0,140,82,0.5)' }}
                          >
                            ●
                          </span>
                          <span
                            className="flex-1 text-sm leading-relaxed"
                            style={{ color: t.textSecondary }}
                          >
                            {h.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
