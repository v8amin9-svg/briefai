import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Header from './components/Header';
import { FeaturedCard, ThumbnailCard, HeadlineCard, TOPIC_COLOR } from './components/NewsCard';
import PerspectivesCard from './components/PerspectivesCard';
import Timeline from './components/Timeline';
import Chat from './components/Chat';
import ArticleReader from './components/ArticleReader';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const AUTO_REFRESH_MS = 60 * 1000; // 1 minute (reads from backend cache, safe)

/* ── Helpers ── */
function SectionLabel({ title, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, paddingBottom: 8, borderBottom: `2px solid ${color || 'var(--brand-red)'}` }}>
      <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', color: color || 'var(--brand-red)' }}>{title}</span>
    </div>
  );
}

function Shimmer({ h = 20, w = '100%', mb = 8 }) {
  return <div className="shimmer" style={{ height: h, width: w, marginBottom: mb }} />;
}

function ErrorBlock({ message, onRetry }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 0', gap: 12 }}>
      <AlertCircle size={32} color="var(--brand-red)" />
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', maxWidth: 360 }}>{message}</p>
      <button onClick={onRetry} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 3, backgroundColor: 'var(--brand-red)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12, fontFamily: 'var(--font-body)' }}>
        <RefreshCw size={13} /> Try Again
      </button>
    </div>
  );
}

/* ── Bias breakdown widget ── */
function BiasWidget({ articles }) {
  if (!articles.length) return null;
  const counts = { 'Left Wing': 0, 'Centre': 0, 'Neutral': 0, 'Right Wing': 0 };
  articles.forEach(a => { if (counts[a.political_leaning] !== undefined) counts[a.political_leaning]++; });
  const total = articles.length || 1;
  return (
    <div>
      <SectionLabel title="Bias Breakdown" color="var(--brand-red)" />
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>Today's article bias distribution:</div>
      {Object.entries(counts).map(([label, count]) => {
        const colors = { 'Left Wing': 'var(--blue)', 'Centre': 'var(--purple)', 'Neutral': '#888', 'Right Wing': 'var(--brand-red)' };
        const pct = Math.round((count / total) * 100);
        return (
          <div key={label} style={{ marginBottom: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
              <span style={{ color: colors[label], fontWeight: 600 }}>{label}</span>
              <span style={{ color: 'var(--text-muted)' }}>{pct}%</span>
            </div>
            <div style={{ height: 5, backgroundColor: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, backgroundColor: colors[label], borderRadius: 3, transition: 'width 0.6s ease' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Main App ── */
export default function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [activeTopic, setActiveTopic] = useState('All');
  const [news, setNews] = useState(null);
  const [perspectives, setPerspectives] = useState(null);
  const [mode, setMode] = useState('LIVE');
  const [cacheAge, setCacheAge] = useState(null);
  const [newsLoading, setNewsLoading] = useState(false);
  const [perspectivesLoading, setPerspectivesLoading] = useState(false);
  const [newsError, setNewsError] = useState(null);
  const [perspectivesError, setPerspectivesError] = useState(null);

  // Article Reader state: null = closed, { article, topic } = open
  const [articleToRead, setArticleToRead] = useState(null);
  const articleOpenRef = useRef(false);

  function openArticle(article, topic) {
    setArticleToRead({ article, topic });
    articleOpenRef.current = true;
    // Push a history entry so the browser back button closes the reader
    window.history.pushState({ briefAiArticle: true }, '');
  }
  function closeArticle() {
    setArticleToRead(null);
    articleOpenRef.current = false;
  }

  // Listen for browser back button and close the reader
  useEffect(() => {
    function handlePopState() {
      if (articleOpenRef.current) {
        setArticleToRead(null);
        articleOpenRef.current = false;
      }
    }
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const fetchNews = useCallback(async () => {
    setNewsLoading(true); setNewsError(null);
    try {
      const res = await axios.get(`${API}/api/news/analyzed`);
      setNews(res.data.data);
      setMode(res.data.mode || 'LIVE');
      setCacheAge(res.data.cacheAgeMinutes ?? null);
    } catch {
      setNewsError('Failed to fetch news. Check your API keys or enable DEMO_MODE.');
    } finally { setNewsLoading(false); }
  }, []);

  const fetchPerspectives = useCallback(async () => {
    setPerspectivesLoading(true); setPerspectivesError(null);
    try {
      const res = await axios.get(`${API}/api/perspectives`);
      setPerspectives(res.data.data);
    } catch { setPerspectivesError('Failed to fetch perspectives.'); }
    finally { setPerspectivesLoading(false); }
  }, []);

  useEffect(() => { fetchNews(); }, [fetchNews]);
  useEffect(() => {
    const id = setInterval(fetchNews, AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [fetchNews]);

  // Keep backend awake (Render free tier sleeps after 15 min)
  useEffect(() => {
    const ping = () => fetch(`${API}/`).catch(() => {});
    const id = setInterval(ping, 10 * 60 * 1000); // every 10 minutes
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (activeTab === 1 && !perspectives && !perspectivesLoading) fetchPerspectives();
  }, [activeTab, perspectives, perspectivesLoading, fetchPerspectives]);

  // Close article reader when switching tabs
  useEffect(() => { setArticleToRead(null); }, [activeTab]);

  // Flatten all articles
  const allArticles = news
    ? Object.entries(news).flatMap(([topic, arts]) => arts.map(a => ({ ...a, topic })))
        .sort((a, b) => (b.trending_score || 0) - (a.trending_score || 0))
    : [];

  // Filter by active topic (All = no filter)
  const filteredArticles = activeTopic === 'All'
    ? allArticles
    : allArticles.filter(a => a.topic === activeTopic);

  const filteredNews = activeTopic === 'All'
    ? news
    : news ? { [activeTopic]: news[activeTopic] || [] } : null;

  const breakingNews = allArticles.slice(0, 8).map(a => a.title);

  // Featured = highest trending from filtered set
  const featured = filteredArticles[0];
  const featuredTopic = featured?.topic;

  // Left column: latest headlines (all non-featured, text only)
  const headlines = filteredArticles.filter(a => a.title !== featured?.title).slice(0, 10);

  // Trending sidebar
  const trending = filteredArticles.slice(0, 6);

  return (
    <div style={{ backgroundColor: 'var(--bg-light)', minHeight: '100vh' }}>
      <Header
        activeTab={activeTab} setActiveTab={setActiveTab}
        activeTopic={activeTopic} setActiveTopic={setActiveTopic}
        mode={mode} cacheAge={cacheAge}
        onRefresh={fetchNews} loading={newsLoading}
        breakingNews={breakingNews}
      />

      <div className="main-content" style={{ maxWidth: 1280, margin: '0 auto', padding: '16px' }}>

        {/* ── ARTICLE READER (overlays current tab content) ── */}
        {articleToRead && (
          <ArticleReader
            article={articleToRead.article}
            topic={articleToRead.topic}
            onClose={closeArticle}
          />
        )}

        {/* ── TODAY'S BRIEF ── */}
        {!articleToRead && activeTab === 0 && (
          <div>
            {newsError && <ErrorBlock message={newsError} onRetry={fetchNews} />}

            {newsLoading && (
              <div className="layout-3col">
                <div>{[...Array(8)].map((_, i) => <div key={i} style={{ marginBottom: 14 }}><Shimmer h={10} w="50%" mb={4} /><Shimmer h={14} /><Shimmer h={14} w="80%" mb={0} /></div>)}</div>
                <div><Shimmer h={240} mb={12} /><Shimmer h={16} mb={8} /><Shimmer h={13} /><Shimmer h={13} w="70%" /></div>
                <div>{[...Array(5)].map((_, i) => <div key={i} style={{ marginBottom: 12 }}><Shimmer h={12} w="30%" mb={4} /><Shimmer h={14} /></div>)}</div>
              </div>
            )}

            {!newsLoading && news && (
              <div className="fade-up layout-3col">

                {/* LEFT: Just In headlines */}
                <div className="sidebar-panel" style={{ backgroundColor: 'var(--bg-white)', border: '1px solid var(--border)', borderRadius: 3, padding: '14px 14px', alignSelf: 'start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12, paddingBottom: 10, borderBottom: '2px solid var(--brand-red)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--brand-red)', display: 'inline-block', animation: 'pulse-dot 1.2s infinite', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--brand-red)' }}>Just In</span>
                  </div>
                  {headlines.map((a, i) => (
                    <HeadlineCard key={i} article={a} topic={a.topic} onOpen={openArticle} />
                  ))}
                </div>

                {/* CENTER: Featured + thumbnails */}
                <div style={{ backgroundColor: 'var(--bg-white)', border: '1px solid var(--border)', borderRadius: 3, padding: '14px 18px' }}>
                  {featured && <FeaturedCard article={featured} topic={featuredTopic} onOpen={openArticle} />}

                  {/* By topic sections */}
                  {Object.entries(filteredNews).map(([topic, articles]) => {
                    const color = TOPIC_COLOR[topic] || 'var(--brand-red)';
                    const filtered = articles.filter(a => a.title !== featured?.title);
                    if (!filtered.length) return null;
                    return (
                      <div key={topic} style={{ marginBottom: 16 }}>
                        <SectionLabel title={topic} color={color} />
                        {filtered.map((article, i) => (
                          <ThumbnailCard key={i} article={article} topic={topic} onOpen={openArticle} />
                        ))}
                      </div>
                    );
                  })}
                </div>

                {/* MOBILE ONLY: Trending strip shown below main content on small screens */}
                <div className="mobile-trending" style={{ backgroundColor: 'var(--bg-white)', border: '1px solid var(--border)', borderRadius: 3, padding: '14px' }}>
                  <SectionLabel title="Trending Now" color="var(--brand-red)" />
                  {trending.map((a, i) => (
                    <div key={i} onClick={() => openArticle(a, a.topic)}
                      style={{ display: 'flex', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--border)', alignItems: 'flex-start', cursor: 'pointer' }}>
                      <span style={{ fontWeight: 900, fontSize: 18, color: i < 3 ? 'var(--brand-red)' : '#e0e0e0', lineHeight: 1, minWidth: 22, flexShrink: 0 }}>{i + 1}</span>
                      <div>
                        <span style={{ fontSize: 9, fontWeight: 700, color: TOPIC_COLOR[a.topic] || '#999', textTransform: 'uppercase' }}>{a.topic}</span>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4, marginTop: 2 }}>{a.title}</p>
                        <span style={{ fontSize: 10, color: 'var(--brand-red)', fontWeight: 700 }}>🔥 {a.trending_score}/10</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* RIGHT: Trending + Bias + Perspectives teaser */}
                <div className="sidebar-panel" style={{ display: 'flex', flexDirection: 'column', gap: 16, alignSelf: 'start' }}>
                  {/* Trending */}
                  <div style={{ backgroundColor: 'var(--bg-white)', border: '1px solid var(--border)', borderRadius: 3, padding: '14px 14px' }}>
                    <SectionLabel title="Trending Now" color="var(--brand-red)" />
                    {trending.map((a, i) => (
                      <div key={i} onClick={() => openArticle(a, a.topic)}
                        style={{ display: 'flex', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--border)', alignItems: 'flex-start', cursor: 'pointer' }}>
                        <span style={{ fontWeight: 900, fontSize: 18, color: i < 3 ? 'var(--brand-red)' : '#e0e0e0', lineHeight: 1, minWidth: 22, flexShrink: 0 }}>{i + 1}</span>
                        <div>
                          <span style={{ fontSize: 9, fontWeight: 700, color: TOPIC_COLOR[a.topic] || '#999', textTransform: 'uppercase' }}>{a.topic}</span>
                          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4, marginTop: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {a.title}
                          </p>
                          <span style={{ fontSize: 10, color: 'var(--brand-red)', fontWeight: 700 }}>🔥 {a.trending_score}/10</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Bias breakdown */}
                  <div style={{ backgroundColor: 'var(--bg-white)', border: '1px solid var(--border)', borderRadius: 3, padding: '14px 14px' }}>
                    <BiasWidget articles={allArticles} />
                  </div>

                  {/* Perspectives teaser */}
                  <div style={{ backgroundColor: 'var(--bg-white)', border: '1px solid var(--border)', borderTop: '3px solid var(--purple)', borderRadius: 3, padding: '14px 14px', cursor: 'pointer' }}
                    onClick={() => setActiveTab(1)}>
                    <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--purple)', marginBottom: 8 }}>Perspectives</div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4, marginBottom: 8 }}>
                      Same story — 3 different angles from global sources
                    </p>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {['🇺🇸 US', '🇬🇧 Europe', '🌏 Asia'].map((r, i) => (
                        <span key={i} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 2, backgroundColor: 'var(--bg-light)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>{r}</span>
                      ))}
                    </div>
                    <div style={{ marginTop: 10, fontSize: 11, fontWeight: 700, color: 'var(--purple)' }}>View all perspectives →</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── PERSPECTIVES ── */}
        {!articleToRead && activeTab === 1 && (
          <div className="layout-2col">
            <div style={{ backgroundColor: 'var(--bg-white)', border: '1px solid var(--border)', borderRadius: 3, padding: '18px 20px' }}>
              <div style={{ marginBottom: 20, paddingBottom: 14, borderBottom: '2px solid var(--border)' }}>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 900, color: 'var(--text-primary)' }}>Same Story, Different Perspectives</h2>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 5 }}>How US, European and Asian sources cover the same event differently.</p>
              </div>
              {perspectivesLoading && <div>{[...Array(3)].map((_, i) => <Shimmer key={i} h={200} mb={16} />)}</div>}
              {perspectivesError && <ErrorBlock message={perspectivesError} onRetry={fetchPerspectives} />}
              {!perspectivesLoading && perspectives && (
                <div className="fade-up">
                  {Object.entries(perspectives).map(([topic, data]) => (
                    <PerspectivesCard key={topic} topic={topic} data={data} />
                  ))}
                </div>
              )}
            </div>
            <div className="sidebar-panel" style={{ backgroundColor: 'var(--bg-white)', border: '1px solid var(--border)', borderRadius: 3, padding: '14px' }}>
              <BiasWidget articles={allArticles} />
            </div>
          </div>
        )}

        {/* ── TIMELINE ── */}
        {!articleToRead && activeTab === 2 && (
          <div className="layout-2col">
            <div style={{ backgroundColor: 'var(--bg-white)', border: '1px solid var(--border)', borderRadius: 3, padding: '18px 20px' }}>
              <div style={{ marginBottom: 20, paddingBottom: 14, borderBottom: '2px solid var(--border)' }}>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 900, color: 'var(--text-primary)' }}>Story Evolution</h2>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 5 }}>Track how a story developed over the past 7 days.</p>
              </div>
              <Timeline />
            </div>
            <div className="sidebar-panel" style={{ backgroundColor: 'var(--bg-white)', border: '1px solid var(--border)', borderRadius: 3, padding: '14px' }}>
              <SectionLabel title="Trending Now" color="var(--brand-red)" />
              {trending.slice(0, 5).map((a, i) => (
                <div key={i} onClick={() => openArticle(a, a.topic)}
                  style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: TOPIC_COLOR[a.topic] || '#999', textTransform: 'uppercase' }}>{a.topic}</span>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4, marginTop: 2 }}>{a.title}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ASK THE NEWS ── */}
        {!articleToRead && activeTab === 3 && (
          <div style={{ backgroundColor: 'var(--bg-white)', border: '1px solid var(--border)', borderRadius: 3, padding: '24px' }}>
            <div style={{ marginBottom: 20, paddingBottom: 14, borderBottom: '2px solid var(--border)' }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 900, color: 'var(--text-primary)' }}>Ask The News</h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 5 }}>Answers from today's articles only — no hallucination, no outside knowledge.</p>
            </div>
            <Chat />
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{ marginTop: 32, borderTop: '1px solid var(--border)', padding: '16px', backgroundColor: 'var(--bg-white)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 900, color: 'var(--brand-red)' }}>Brief</span>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 900, color: 'var(--brand-dark)' }}>AI</span>
          </div>
          <div style={{ display: 'flex', gap: 20, fontSize: 11, color: 'var(--text-muted)' }}>
            <span>Powered by Claude AI + NY Times</span>
            <span>Updates every 30 minutes</span>
            <span>© {new Date().getFullYear()} BriefAI</span>
          </div>
        </div>
      </footer>

      <style>{`@keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(1.5)} }`}</style>
    </div>
  );
}
