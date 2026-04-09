import { TOPIC_COLOR } from './NewsCard';

const BIAS_COLOR = {
  'Left':    'var(--blue)',
  'Right':   'var(--brand-red)',
  'Centre':  'var(--purple)',
  'Neutral': '#888',
};

function SectionLabel({ title, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <div style={{ width: 3, height: 16, backgroundColor: color || 'var(--brand-red)', borderRadius: 2, flexShrink: 0 }} />
      <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-primary)' }}>{title}</span>
    </div>
  );
}

export default function PerspectivesCard({ topic, data }) {
  const color = TOPIC_COLOR[topic] || 'var(--brand-red)';

  if (!data) return (
    <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
      No perspectives data available.
    </div>
  );

  return (
    <div style={{ marginBottom: 24, borderBottom: '2px solid var(--border)', paddingBottom: 24 }}>
      <SectionLabel title={`${topic} — Same Story, 3 Perspectives`} color={color} />

      {data.story_title && (
        <p style={{ fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14, lineHeight: 1.4 }}>
          {data.story_title}
        </p>
      )}

      {/* 3 perspective cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 14 }}>
        {data.perspectives?.map((p, i) => {
          const bc = BIAS_COLOR[p.bias] || '#888';
          return (
            <div key={i} style={{
              border: '1px solid var(--border)', borderTop: `3px solid ${bc}`,
              borderRadius: 3, padding: '12px 14px', backgroundColor: 'var(--bg-white)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{p.region}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.source}</div>
                </div>
                <span style={{ backgroundColor: bc, color: '#fff', fontSize: 9, padding: '2px 8px', borderRadius: 2, fontWeight: 700 }}>{p.bias}</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55 }}>{p.angle}</p>
            </div>
          );
        })}
      </div>

      {/* Key difference */}
      {data.key_difference && (
        <div style={{ backgroundColor: '#FFF9C4', border: '1px solid #F9E100', borderRadius: 3, padding: '10px 14px', display: 'flex', gap: 8 }}>
          <span style={{ fontWeight: 800, fontSize: 11, color: '#856404', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>Key Difference:</span>
          <span style={{ fontSize: 12, color: '#5a4a00', lineHeight: 1.5 }}>{data.key_difference}</span>
        </div>
      )}
    </div>
  );
}
