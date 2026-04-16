'use client';

interface Props {
  theme: 'dark' | 'light';
  onToggle: () => void;
}

export default function ThemeToggle({ theme, onToggle }: Props) {
  const isDark = theme === 'dark';

  return (
    <button
      onClick={onToggle}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className="relative flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-200 active:scale-95"
      style={{
        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
      }}
    >
      {/* Sun icon */}
      <svg
        width="14" height="14" viewBox="0 0 24 24" fill="none"
        style={{ opacity: isDark ? 0.3 : 1, transition: 'opacity 0.2s' }}
        stroke={isDark ? '#fff' : '#F59E0B'} strokeWidth="2" strokeLinecap="round"
      >
        <circle cx="12" cy="12" r="5"/>
        <line x1="12" y1="1" x2="12" y2="3"/>
        <line x1="12" y1="21" x2="12" y2="23"/>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
        <line x1="1" y1="12" x2="3" y2="12"/>
        <line x1="21" y1="12" x2="23" y2="12"/>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
      </svg>

      {/* Track */}
      <div
        className="relative w-9 h-5 rounded-full transition-colors duration-300"
        style={{ background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' }}
      >
        {/* Knob */}
        <div
          className="absolute top-0.5 w-4 h-4 rounded-full shadow transition-all duration-300"
          style={{
            left: isDark ? '1.2rem' : '0.12rem',
            background: isDark ? '#E8EAF0' : '#0F1117',
          }}
        />
      </div>

      {/* Moon icon */}
      <svg
        width="13" height="13" viewBox="0 0 24 24" fill="none"
        style={{ opacity: isDark ? 1 : 0.3, transition: 'opacity 0.2s' }}
        stroke={isDark ? '#E8EAF0' : '#000'} strokeWidth="2" strokeLinecap="round"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      </svg>
    </button>
  );
}
