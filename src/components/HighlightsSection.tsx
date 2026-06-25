'use client';

import { useState, useRef } from 'react';
import type { Highlight } from '@/data/highlights';
import { getWeekStart, formatWeekRange } from '@/data/highlights';

interface StyleTokens {
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textFaint: string;
}

interface Props {
  highlights: Highlight[];
  onAdd: (text: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onEdit: (id: string, text: string) => Promise<void>;
  isDark: boolean;
  t: StyleTokens;
}

// Grow a textarea to fit its content (Shift+Enter adds lines without a scrollbar).
function autoResize(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
}

export default function HighlightsSection({ highlights, onAdd, onDelete, onEdit, isDark, t }: Props) {
  const [tab, setTab] = useState<'current' | 'historical'>('current');
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
    if (inputRef.current) {
      autoResize(inputRef.current);
      inputRef.current.focus();
    }
  }

  // Enter submits; Shift+Enter inserts a newline.
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAdd();
    }
  }

  function startEdit(h: Highlight) {
    setEditingId(h.id);
    setEditText(h.text);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditText('');
  }

  async function saveEdit(id: string) {
    const text = editText.trim();
    if (!text || savingEdit) return;
    setSavingEdit(true);
    try {
      await onEdit(id, text);
      cancelEdit();
    } catch (err) {
      // Keep the editor open so the edit isn't lost; the user can retry.
      console.error('Failed to save highlight', err);
    } finally {
      setSavingEdit(false);
    }
  }

  function handleEditKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>, id: string) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveEdit(id);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
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

  const accent = isDark ? '#00D97E' : '#008C52';

  const editBoxStyle: React.CSSProperties = {
    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
    border: `1px solid ${t.border}`,
    color: t.textPrimary,
    resize: 'none',
    overflow: 'hidden',
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
          background: isDark
            ? 'linear-gradient(135deg, #1A1F2E 0%, #141720 100%)'
            : 'linear-gradient(135deg, #FFFFFF 0%, #F8F9FC 100%)',
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
                    style={{ color: accent }}
                  >
                    ●
                  </span>

                  {editingId === h.id ? (
                    <div className="flex-1">
                      <textarea
                        autoFocus
                        rows={1}
                        value={editText}
                        onChange={e => { setEditText(e.target.value); autoResize(e.target); }}
                        onKeyDown={e => handleEditKeyDown(e, h.id)}
                        ref={el => autoResize(el)}
                        disabled={savingEdit}
                        className="w-full bg-transparent outline-none text-sm leading-relaxed rounded-lg px-3 py-2"
                        style={editBoxStyle}
                      />
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => saveEdit(h.id)}
                          disabled={savingEdit}
                          className="text-xs font-mono px-3 py-1 rounded-lg transition-all"
                          style={{
                            background: isDark ? 'rgba(0,217,126,0.12)' : 'rgba(0,160,100,0.1)',
                            color: accent,
                            border: `1px solid ${isDark ? 'rgba(0,217,126,0.3)' : 'rgba(0,160,100,0.25)'}`,
                          }}
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={savingEdit}
                          className="text-xs font-mono px-3 py-1 rounded-lg transition-all"
                          style={{ color: t.textMuted, border: `1px solid ${t.border}` }}
                        >
                          Cancel
                        </button>
                        <span className="text-[10px] font-mono" style={{ color: t.textFaint }}>
                          Enter to save · Shift+Enter for new line
                        </span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span
                        className="flex-1 text-sm leading-relaxed whitespace-pre-wrap"
                        style={{ color: t.textPrimary }}
                      >
                        {h.text}
                      </span>
                      <button
                        onClick={() => startEdit(h)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-xs shrink-0 mt-0.5"
                        style={{ color: t.textMuted }}
                        title="Edit"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => onDelete(h.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-xs shrink-0 mt-0.5"
                        style={{ color: t.textMuted }}
                        title="Remove"
                      >
                        ✕
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>

            <div
              className="flex items-start gap-3 rounded-xl px-4 py-3"
              style={{
                background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                border: `1px solid ${t.border}`,
              }}
            >
              <span style={{ color: accent, fontSize: 12, marginTop: 2 }}>+</span>
              <textarea
                ref={inputRef}
                rows={1}
                placeholder="Add a highlight… (Enter to add · Shift+Enter for new line)"
                value={input}
                onChange={e => { setInput(e.target.value); autoResize(e.target); }}
                onKeyDown={handleKeyDown}
                disabled={submitting}
                className="flex-1 bg-transparent outline-none text-sm font-mono placeholder:opacity-40 resize-none overflow-hidden"
                style={{ color: t.textPrimary }}
              />
              {input.trim() && (
                <button
                  onClick={handleAdd}
                  disabled={submitting}
                  className="text-xs font-mono px-3 py-1 rounded-lg transition-all shrink-0"
                  style={{
                    background: isDark ? 'rgba(0,217,126,0.12)' : 'rgba(0,160,100,0.1)',
                    color: accent,
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
                            className="flex-1 text-sm leading-relaxed whitespace-pre-wrap"
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
