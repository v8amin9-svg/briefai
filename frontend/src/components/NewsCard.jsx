import { useState } from 'react';
import { Share2 } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function proxyImg(url) {
  if (!url) return null;
  return `${API}/image?url=${encodeURIComponent(url)}`;
}

export const TOPIC_COLOR = {
  'AI & Tech': 'var(--topic-ai)',
  'Wars & Conflicts': 'var(--topic-wars)',
  'Politics': 'var(--topic-politics)',
  'Business & Economy': 'var(--topic-business)',
};

export const TOPIC_BG = {
  'AI & Tech': 'linear-gradient(135deg,#1A73E8,#0d47a1)',
  'Wars & Conflicts': 'linear-gradient(135deg,#E63C26,#7f0000)',
  'Politics': 'linear-gradient(135deg,#5f35b5,#2d1b69)',
  'Business & Economy': 'linear-gradient(135deg,#188038,#0a3d1f)',
};

export const TOPIC_EMOJI = {
  'AI & Tech': '🤖', 'Wars & Conflicts': '⚔️', 'Politics': '🏛️', 'Business & Economy': '📈',
};

const LEANING_STYLE = {
  'Left Wing':  { bg: 'var(--blue)',   color: '#fff' },
  'Right Wing': { bg: 'var(--brand-red)', color: '#fff' },
  'Centre':     { bg: 'var(--purple)', color: '#fff' },
  'Neutral':    { bg: '#888',          color: '#fff' },
};
const TONE_STYLE = {
  'Alarming':      { bg: '#E63C26', color: '#fff' },
  'Promotional':   { bg: '#FB8C00', color: '#fff' },
  'Investigative': { bg: '#00897B', color: '#fff' },
  'Neutral':       { bg: '#888',    color: '#fff' },
};

function timeAgo(d) {
  if (!d) return '';
  const m = Math.floor((Date.now() - new Date(d)) / 60000);
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.floor(m / 60)}h ago`;
  return `${Math.floor(m / 1440)}d ago`;
}

function CategoryPill({ topic }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color: TOPIC_COLOR[topic] || '#999', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
      {topic}
    </span>
  );
}

function TrendingScore({ score }) {
  const color = score >= 8 ? 'var(--brand-red)' : score >= 5 ? '#FB8C00' : '#aaa';
  return <span style={{ fontSize: 11, color, fontWeight: 700 }}>🔥 {score}/10</span>;
}

function ShareBtn({ article }) {
  const [copied, setCopied] = useState(false);
  function share(e) {
    e.preventDefault(); e.stopPropagation();
    navigator.clipboard?.writeText(article.url || window.location.href);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  }
  return (
    <button onClick={share} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 3, padding: 0 }}>
      <Share2 size={11} />{copied && ' Copied!'}
    </button>
  );
}

/* ── FEATURED: large image + full details ── */
export function FeaturedCard({ article, topic, onOpen }) {
  const [imgErr, setImgErr] = useState(false);
  const [hovered, setHovered] = useState(false);
  const color = TOPIC_COLOR[topic] || 'var(--brand-red)';

  function handleOpen(e) {
    e.preventDefault();
    if (onOpen) onOpen(article, topic);
  }

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
      {/* Image — clicking opens internal reader */}
      <div onClick={handleOpen} style={{ height: 240, borderRadius: 4, overflow: 'hidden', position: 'relative', backgroundColor: '#f0f0f0', marginBottom: 10, cursor: 'pointer' }}>
        {article.image && !imgErr ? (
          <img src={proxyImg(article.image)} alt="" onError={() => setImgErr(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: TOPIC_BG[topic], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 60, opacity: 0.15 }}>{TOPIC_EMOJI[topic]}</span>
          </div>
        )}
        <span style={{ position: 'absolute', top: 10, left: 10, backgroundColor: color, color: '#fff', fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 2, textTransform: 'uppercase', letterSpacing: 1 }}>
          {topic}
        </span>
        <TrendingScore score={article.trending_score} />
      </div>

      {/* Title */}
      <h3 onClick={handleOpen}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--brand-red)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-primary)'}
        style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.35, marginBottom: 8, cursor: 'pointer', transition: 'color 0.15s' }}>
        {article.title}
      </h3>

      {article.summary && (
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {article.summary}
        </p>
      )}

      {/* Bias tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
        {article.political_leaning && (
          <span style={{ ...LEANING_STYLE[article.political_leaning], fontSize: 9, padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>{article.political_leaning}</span>
        )}
        {article.region_focus && (
          <span style={{ backgroundColor: '#f5f5f5', color: '#555', fontSize: 9, padding: '2px 8px', borderRadius: 20, border: '1px solid var(--border)' }}>📍 {article.region_focus}</span>
        )}
        {article.tone && (
          <span style={{ ...TONE_STYLE[article.tone], fontSize: 9, padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>⚡ {article.tone}</span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>{article.source} · {timeAgo(article.publishedAt)}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ShareBtn article={article} />
          <button onClick={handleOpen} style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand-red)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
            Read More →
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── THUMBNAIL: small image left + headline right ── */
export function ThumbnailCard({ article, topic, onOpen }) {
  const [imgErr, setImgErr] = useState(false);
  const [hovered, setHovered] = useState(false);

  function handleOpen() {
    if (onOpen) onOpen(article, topic);
  }

  return (
    <div onClick={handleOpen} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', gap: 10, padding: '12px 0',
        borderBottom: '1px solid var(--border)', cursor: 'pointer',
        borderLeft: hovered ? `3px solid ${TOPIC_COLOR[topic] || 'var(--brand-red)'}` : '3px solid transparent',
        paddingLeft: hovered ? 8 : 0,
        backgroundColor: hovered ? '#fafafa' : 'transparent',
        transition: 'all 0.15s',
      }}>
      <div style={{ width: 100, height: 70, borderRadius: 3, overflow: 'hidden', flexShrink: 0, backgroundColor: '#f0f0f0' }}>
        {article.image && !imgErr ? (
          <img src={proxyImg(article.image)} alt="" onError={() => setImgErr(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: TOPIC_BG[topic], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 22, opacity: 0.2 }}>{TOPIC_EMOJI[topic]}</span>
          </div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <CategoryPill topic={topic} />
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600,
          color: hovered ? 'var(--brand-red)' : 'var(--text-primary)',
          margin: '4px 0 5px', lineHeight: 1.4, transition: 'color 0.15s',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {article.title}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>{article.source} · {timeAgo(article.publishedAt)}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingScore score={article.trending_score} />
            <ShareBtn article={article} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── HEADLINE ONLY: left column, text only ── */
export function HeadlineCard({ article, topic, onOpen }) {
  const [hovered, setHovered] = useState(false);

  function handleOpen() {
    if (onOpen) onOpen(article, topic);
  }

  return (
    <div onClick={handleOpen} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
      <CategoryPill topic={topic} />
      <p style={{
        fontSize: 13, fontWeight: 600, lineHeight: 1.45, marginTop: 4, marginBottom: 4,
        color: hovered ? 'var(--brand-red)' : 'var(--text-primary)',
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        transition: 'color 0.15s',
      }}>
        {article.title}
      </p>
      <span style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' }}>{article.source} · {timeAgo(article.publishedAt)}</span>
    </div>
  );
}

export default function NewsCard({ article, topic, onOpen }) {
  return <ThumbnailCard article={article} topic={topic} onOpen={onOpen} />;
}
