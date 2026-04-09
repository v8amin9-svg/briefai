import { useState, useEffect } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const TOPICS = [
  { key: 'ai-tech',  label: 'AI & Tech',            color: 'var(--topic-ai)' },
  { key: 'wars',     label: 'Wars & Conflicts',    color: 'var(--topic-wars)' },
  { key: 'politics', label: 'Politics',             color: 'var(--topic-politics)' },
  { key: 'business', label: 'Business & Economy',   color: 'var(--topic-business)' },
];

const SIG = {
  'High':   { bg: '#FFEBEE', color: 'var(--brand-red)',    border: '#FFCDD2' },
  'Medium': { bg: '#FFF3E0', color: '#FB8C00',             border: '#FFE0B2' },
  'Low':    { bg: '#E8F5E9', color: 'var(--topic-business)', border: '#C8E6C9' },
};

const TRAJ_STYLE = {
  'Escalating':    { bg: '#FFEBEE', color: 'var(--brand-red)' },
  'De-escalating': { bg: '#E8F5E9', color: 'var(--topic-business)' },
  'Stable':        { bg: '#E3F2FD', color: 'var(--blue)' },
  'Resolved':      { bg: '#F5F5F5', color: '#888' },
};

function SectionLabel({ title, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
      <div style={{ width: 3, height: 16, backgroundColor: color || 'var(--brand-red)', borderRadius: 2, flexShrink: 0 }} />
      <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{title}</span>
    </div>
  );
}

export default function Timeline() {
  const [selected, setSelected] = useState(TOPICS[0]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function load(topic) {
    setLoading(true); setError(null); setData(null);
    try {
      const res = await axios.get(`${API}/api/timeline?topic=${topic.key}`);
      setData(res.data.data);
    } catch { setError('Failed to load. Please try again.'); }
    finally { setLoading(false); }
  }

  // Auto-load whenever selected topic changes (including on first mount)
  useEffect(() => {
    load(selected);
  }, [selected]);

  return (
    <div>
      {/* Topic picker */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20, alignItems: 'center' }}>
        {TOPICS.map((t) => (
          <button key={t.key} onClick={() => setSelected(t)} style={{
            fontSize: 11, fontWeight: 700, padding: '6px 16px', borderRadius: 3,
            backgroundColor: selected.key === t.key ? t.color : '#fff',
            color: selected.key === t.key ? '#fff' : 'var(--text-secondary)',
            border: `1px solid ${selected.key === t.key ? t.color : 'var(--border)'}`,
            cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.5px',
            fontFamily: 'var(--font-body)', transition: 'all 0.15s',
          }}>
            {t.label}
          </button>
        ))}
        <button onClick={() => load(selected)} disabled={loading} style={{
          marginLeft: 'auto', fontSize: 11, fontWeight: 800,
          padding: '7px 20px', borderRadius: 3,
          backgroundColor: 'var(--brand-red)', color: '#fff', border: 'none',
          cursor: 'pointer', opacity: loading ? 0.6 : 1,
          textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'var(--font-body)',
        }}>
          {loading ? 'Loading...' : 'Reload'}
        </button>
      </div>

      {error && <p style={{ color: 'var(--brand-red)', textAlign: 'center', padding: 24 }}>{error}</p>}

      {loading && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
          <div style={{ display: 'inline-flex', gap: 6 }}>
            {[0, 0.15, 0.3].map((d, i) => (
              <span key={i} style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: selected.color, display: 'inline-block', animation: `blink 1s ${d}s infinite` }} />
            ))}
          </div>
          <p style={{ marginTop: 12, fontSize: 13 }}>Loading {selected.label} timeline…</p>
        </div>
      )}

      {!loading && data && (
        <div className="fade-up">
          <SectionLabel title={data.story_topic} color={selected.color} />

          {/* Timeline entries */}
          <div style={{ position: 'relative', paddingLeft: 32 }}>
            <div style={{ position: 'absolute', left: 12, top: 0, bottom: 0, width: 2, backgroundColor: 'var(--border)' }} />

            {data.timeline?.map((item, i) => {
              const s = SIG[item.significance] || SIG['Low'];
              return (
                <div key={i} style={{ position: 'relative', marginBottom: 24 }}>
                  {/* Circle */}
                  <div style={{
                    position: 'absolute', left: -32, top: 2,
                    width: 22, height: 22, borderRadius: '50%',
                    backgroundColor: s.bg, border: `2px solid ${s.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 800, color: s.color, zIndex: 1,
                  }}>{i + 1}</div>

                  {/* Content */}
                  <div style={{ borderLeft: `2px solid ${s.border}`, paddingLeft: 12, paddingBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: selected.color }}>{item.date}</span>
                      <span style={{ backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}`, fontSize: 9, padding: '2px 7px', borderRadius: 2, fontWeight: 700, textTransform: 'uppercase' }}>
                        {item.significance}
                      </span>
                    </div>
                    <h4 style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{item.headline}</h4>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>{item.development}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Status + trajectory */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
            <div style={{ border: '1px solid var(--border)', borderRadius: 3, padding: '12px 16px', backgroundColor: 'var(--bg-light)' }}>
              <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: 6 }}>Current Status</div>
              <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>{data.current_status}</p>
            </div>
            <div style={{ border: '1px solid var(--border)', borderRadius: 3, padding: '12px 16px', backgroundColor: TRAJ_STYLE[data.trajectory]?.bg || '#f5f5f5' }}>
              <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: 6 }}>Trajectory</div>
              <p style={{ fontSize: 16, fontWeight: 800, color: TRAJ_STYLE[data.trajectory]?.color || '#888' }}>{data.trajectory}</p>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes blink { 0%,100%{opacity:.2} 50%{opacity:1} }`}</style>
    </div>
  );
}
