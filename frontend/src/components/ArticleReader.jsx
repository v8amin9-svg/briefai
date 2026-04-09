import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ArrowLeft } from 'lucide-react';
import { TOPIC_COLOR, TOPIC_BG, TOPIC_EMOJI } from './NewsCard';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function proxyImg(url) {
  if (!url) return null;
  return `${API}/image?url=${encodeURIComponent(url)}`;
}

const LEANING_STYLE = {
  'Left Wing':  { bg: 'var(--blue)',        color: '#fff' },
  'Right Wing': { bg: 'var(--brand-red)',   color: '#fff' },
  'Centre':     { bg: 'var(--purple)',      color: '#fff' },
  'Neutral':    { bg: '#888',               color: '#fff' },
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

export default function ArticleReader({ article, topic, onClose }) {
  const [imgErr, setImgErr] = useState(false);
  const [text, setText] = useState(null);
  const [loadingText, setLoadingText] = useState(true);
  const [textError, setTextError] = useState(null);
  const scrollRef = useRef(null);

  const color = TOPIC_COLOR[topic] || 'var(--brand-red)';

  // Scroll the overlay to top when article changes
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [article]);

  // Fetch full article text
  useEffect(() => {
    if (!article?.url) {
      setLoadingText(false);
      setTextError('No article URL available.');
      return;
    }
    setLoadingText(true);
    setTextError(null);
    setText(null);

    axios.get(`${API}/api/article?url=${encodeURIComponent(article.url)}`)
      .then(res => setText(res.data.text || ''))
      .catch(() => setTextError('Could not load the full article text. The source may require a subscription or block automated access.'))
      .finally(() => setLoadingText(false));
  }, [article]);

  return (
    /* Full-page overlay — sits above everything including the sticky header */
    <div
      ref={scrollRef}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 500,
        backgroundColor: 'var(--bg-light)',
        overflowY: 'auto',
      }}
    >
      {/* ── Sticky top bar with back button ── */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        backgroundColor: '#fff',
        borderBottom: '1px solid var(--border)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        padding: '0 20px',
        height: 48,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <button
          onClick={onClose}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-secondary)', fontSize: 13, fontWeight: 700,
            fontFamily: 'var(--font-body)', padding: '6px 0',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--brand-red)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
        >
          <ArrowLeft size={16} /> Back to news
        </button>

        <div style={{ width: 1, height: 20, backgroundColor: 'var(--border)' }} />

        {/* Breadcrumb: topic */}
        <span style={{ fontSize: 11, fontWeight: 700, color: color, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          {topic}
        </span>

        {/* Logo on the right */}
        <div style={{ marginLeft: 'auto' }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 900, color: 'var(--brand-red)' }}>Brief</span>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 900, color: 'var(--brand-dark)' }}>AI</span>
        </div>
      </div>

      {/* ── Article content ── */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px 60px' }}>
        <div style={{ backgroundColor: 'var(--bg-white)', border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden' }}>

          {/* Hero image */}
          <div style={{ height: 300, backgroundColor: '#f0f0f0', position: 'relative', overflow: 'hidden' }}>
            {article.image && !imgErr ? (
              <img src={proxyImg(article.image)} alt="" onError={() => setImgErr(true)}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', background: TOPIC_BG[topic], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 80, opacity: 0.12 }}>{TOPIC_EMOJI[topic]}</span>
              </div>
            )}
            <span style={{
              position: 'absolute', top: 14, left: 14,
              backgroundColor: color, color: '#fff',
              fontSize: 10, fontWeight: 800, padding: '4px 10px',
              borderRadius: 2, textTransform: 'uppercase', letterSpacing: 1,
            }}>{topic}</span>
          </div>

          <div style={{ padding: '24px 28px' }}>

            {/* Meta */}
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, fontStyle: 'italic' }}>
              {article.source}{article.publishedAt ? ` · ${timeAgo(article.publishedAt)}` : ''}
            </div>

            {/* Title */}
            <h1 style={{
              fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 900,
              color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: 16,
            }}>
              {article.title}
            </h1>

            {/* Tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
              {article.political_leaning && (
                <span style={{ ...LEANING_STYLE[article.political_leaning], fontSize: 10, padding: '3px 10px', borderRadius: 20, fontWeight: 700 }}>
                  {article.political_leaning}
                </span>
              )}
              {article.region_focus && (
                <span style={{ backgroundColor: '#f5f5f5', color: '#555', fontSize: 10, padding: '3px 10px', borderRadius: 20, border: '1px solid var(--border)' }}>
                  📍 {article.region_focus}
                </span>
              )}
              {article.tone && (
                <span style={{ ...TONE_STYLE[article.tone], fontSize: 10, padding: '3px 10px', borderRadius: 20, fontWeight: 700 }}>
                  ⚡ {article.tone}
                </span>
              )}
              {article.trending_score && (
                <span style={{ backgroundColor: '#fff3e0', color: '#e65100', fontSize: 10, padding: '3px 10px', borderRadius: 20, border: '1px solid #ffcc80', fontWeight: 700 }}>
                  🔥 Trending {article.trending_score}/10
                </span>
              )}
            </div>

            {/* AI Summary — highlighted box */}
            {article.summary && (
              <div style={{
                backgroundColor: '#FFFDE7', border: '1px solid #F9E100',
                borderLeft: '4px solid #F9A825', borderRadius: 3,
                padding: '14px 18px', marginBottom: 24,
              }}>
                <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#7B5800', marginBottom: 6 }}>
                  AI Summary
                </div>
                <p style={{ fontSize: 14, color: '#4a3800', lineHeight: 1.6, margin: 0 }}>
                  {article.summary}
                </p>
              </div>
            )}

            <div style={{ borderTop: '2px solid var(--border)', marginBottom: 24 }} />

            {/* Full article text */}
            <div style={{ fontSize: 15, color: 'var(--text-primary)', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}>
              {loadingText && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="shimmer" style={{ height: 14, width: i % 3 === 2 ? '70%' : '100%', borderRadius: 3 }} />
                  ))}
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', marginTop: 8 }}>
                    Fetching article content…
                  </p>
                </div>
              )}

              {textError && (
                <div style={{ backgroundColor: '#FFF3E0', border: '1px solid #FFE0B2', borderRadius: 3, padding: '14px 18px', color: '#7B4800' }}>
                  <strong style={{ fontSize: 12 }}>Full text unavailable</strong>
                  <p style={{ fontSize: 13, marginTop: 4, marginBottom: 0 }}>{textError}</p>
                </div>
              )}

              {!loadingText && text && text.split('\n\n').filter(Boolean).map((para, i) => (
                <p key={i} style={{ marginBottom: 20 }}>{para.trim()}</p>
              ))}

              {!loadingText && !textError && (!text || text.trim() === '') && (
                <div style={{ backgroundColor: '#f5f5f5', border: '1px solid var(--border)', borderRadius: 3, padding: '14px 18px', color: 'var(--text-muted)' }}>
                  <p style={{ fontSize: 13, margin: 0 }}>No article text could be extracted. This article may be behind a paywall or require JavaScript to load.</p>
                </div>
              )}
            </div>

            {/* View Original Source — tiny, at very bottom only */}
            {article.url && (
              <div style={{ marginTop: 36, paddingTop: 16, borderTop: '1px solid var(--border)', textAlign: 'right' }}>
                <a href={article.url} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 11, color: 'var(--text-muted)', textDecoration: 'none' }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--brand-red)'; e.currentTarget.style.textDecoration = 'underline'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.textDecoration = 'none'; }}>
                  View Original Source ↗
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
