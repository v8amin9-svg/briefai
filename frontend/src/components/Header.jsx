import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

const TABS = [
  { label: "Today's Brief", i: 0 },
  { label: 'Perspectives', i: 1 },
  { label: 'Timeline', i: 2 },
  { label: 'Ask The News', i: 3 },
];

const TOPIC_FILTERS = ['All', 'AI & Tech', 'Wars & Conflicts', 'Politics', 'Business & Economy'];

export default function Header({ activeTab, setActiveTab, mode, cacheAge, onRefresh, loading, breakingNews = [] }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [now, setNow] = useState('');
  const [nextRefresh, setNextRefresh] = useState(120);
  const inputRef = useRef(null);

  useEffect(() => {
    const tick = () => {
      setNow(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
      setNextRefresh((p) => (p <= 1 ? 120 : p - 1));
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => { if (searchOpen) inputRef.current?.focus(); }, [searchOpen]);

  // Build ticker text
  const tickerItems = [
    `🔴 LIVE BriefAI Feed`,
    `Last updated: ${cacheAge === 0 ? 'just now' : cacheAge != null ? `${cacheAge} min ago` : '—'}`,
    `4 topics covered`,
    `Next refresh in: ${nextRefresh} min`,
    ...(breakingNews.slice(0, 5)),
  ];

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 100, backgroundColor: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>

      {/* ── Main nav ── */}
      <div style={{ borderBottom: '1px solid var(--border)', backgroundColor: '#fff' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', height: 52, gap: 24 }}>

          {/* Logo */}
          <div onClick={() => setActiveTab(0)} style={{ cursor: 'pointer', flexShrink: 0, lineHeight: 1 }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 900, color: 'var(--brand-red)' }}>Brief</span>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 900, color: 'var(--brand-dark)' }}>AI</span>
          </div>

          <div style={{ width: 1, height: 24, backgroundColor: 'var(--border)', flexShrink: 0 }} />

          {/* Nav links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 0, flex: 1, overflowX: 'auto' }}>
            {TABS.map(({ label, i }) => (
              <button key={i} onClick={() => setActiveTab(i)} style={{
                fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700,
                padding: '6px 14px', whiteSpace: 'nowrap',
                color: activeTab === i ? 'var(--brand-red)' : 'var(--text-secondary)',
                backgroundColor: 'transparent', border: 'none', cursor: 'pointer',
                borderBottom: activeTab === i ? '2px solid var(--brand-red)' : '2px solid transparent',
                textTransform: 'uppercase', letterSpacing: '0.5px',
                transition: 'all 0.15s',
              }}
                onMouseEnter={e => { if (activeTab !== i) e.currentTarget.style.color = 'var(--brand-red)'; }}
                onMouseLeave={e => { if (activeTab !== i) e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                {label}
              </button>
            ))}
          </nav>

          {/* Right: search + mode + refresh */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            {searchOpen ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid var(--border)', borderRadius: 4, padding: '5px 10px', backgroundColor: 'var(--bg-light)' }}>
                <Search size={13} color="var(--text-muted)" />
                <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
                  placeholder="Search news..." onBlur={() => { setSearchOpen(false); setQuery(''); }}
                  style={{ background: 'none', border: 'none', fontSize: 12, outline: 'none', width: 150, fontFamily: 'var(--font-body)', color: 'var(--text-primary)' }} />
                <button onClick={() => { setSearchOpen(false); setQuery(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 1 }}>
                  <X size={12} />
                </button>
              </div>
            ) : (
              <button onClick={() => setSearchOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--brand-red)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                <Search size={16} />
              </button>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: mode === 'LIVE' ? '#2EAD4B' : '#7B2D8B', display: 'inline-block', animation: 'pulse-dot 1.5s infinite' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: mode === 'LIVE' ? '#2EAD4B' : '#7B2D8B', textTransform: 'uppercase' }}>{mode}</span>
            </div>

            <button onClick={onRefresh} disabled={loading} style={{
              fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 3,
              backgroundColor: 'var(--brand-red)', color: '#fff', border: 'none', cursor: 'pointer',
              opacity: loading ? 0.6 : 1, fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>
              {loading ? '...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Sub-nav topic filters ── */}
      <div className="header-subnav" style={{ backgroundColor: 'var(--bg-light)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto', height: 34 }}>
          {TOPIC_FILTERS.map((f, i) => (
            <button key={i} onClick={() => setActiveTab(0)} style={{
              fontSize: 11, fontWeight: 600, padding: '0 14px', height: '100%',
              color: i === 0 ? 'var(--brand-red)' : 'var(--text-secondary)',
              backgroundColor: 'transparent', border: 'none', cursor: 'pointer',
              borderRight: '1px solid var(--border)', whiteSpace: 'nowrap',
              fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.4px',
            }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--brand-red)'}
              onMouseLeave={e => { if (i !== 0) e.currentTarget.style.color = 'var(--text-secondary)'; }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── Live ticker ── */}
      <div style={{ backgroundColor: 'var(--bg-white)', borderBottom: '1px solid var(--border)', height: 30, display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        <div style={{ backgroundColor: 'var(--brand-red)', padding: '0 12px', height: '100%', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <span style={{ color: '#fff', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, whiteSpace: 'nowrap' }}>Live Feed</span>
        </div>
        <div style={{ overflow: 'hidden', flex: 1 }}>
          <div className="marquee-track" style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
            {tickerItems.map((t, i) => (
              <span key={i} style={{ marginRight: 40, color: i < 4 ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: i < 4 ? 600 : 400 }}>
                {i > 0 && i < 4 ? <span style={{ color: 'var(--text-muted)', marginRight: 40 }}>|</span> : null}
                {t}
              </span>
            ))}
            {tickerItems.map((t, i) => (
              <span key={`b${i}`} style={{ marginRight: 40, color: i < 4 ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: i < 4 ? 600 : 400 }}>
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      <style>{`@keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(1.5)} }`}</style>
    </header>
  );
}
