import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const SUGGESTIONS = [
  'What is happening in AI this week?',
  'Latest war developments?',
  'How are global markets performing?',
  'What are the biggest political stories?',
];

export default function Chat() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Welcome to Ask The News. I answer questions using only today's loaded articles — grounded in real sources, no hallucination.", sources: [] },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function send(q) {
    if (!q.trim() || loading) return;
    setMessages((p) => [...p, { role: 'user', content: q }]);
    setInput('');
    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/ask`, { question: q });
      setMessages((p) => [...p, { role: 'assistant', content: res.data.answer, sources: res.data.sources || [] }]);
    } catch {
      setMessages((p) => [...p, { role: 'assistant', content: 'Connection error. Please try again.', sources: [] }]);
    } finally { setLoading(false); }
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 14, textAlign: 'center' }}>
        Ask anything about today's news — e.g. "What happened in Gaza this week?"
      </p>

      {/* Chat window */}
      <div style={{ border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ backgroundColor: 'var(--bg-white)', padding: '16px 18px', minHeight: 360, maxHeight: 460, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: 4 }}>
              {msg.role === 'assistant' && (
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', paddingLeft: 4 }}>BriefAI</span>
              )}
              <div style={{
                maxWidth: '80%',
                padding: '10px 14px',
                borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                backgroundColor: msg.role === 'user' ? 'var(--brand-red)' : 'var(--bg-light)',
                color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                fontSize: 13, lineHeight: 1.6,
                border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
              }}>
                {msg.content}
              </div>
              {msg.sources?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, paddingLeft: 4 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Sources:</span>
                  {msg.sources.slice(0, 4).map((s, j) => (
                    <span key={j} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 2, backgroundColor: 'var(--bg-light)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>{s}</span>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', paddingLeft: 4 }}>BriefAI</span>
              <div style={{ padding: '10px 16px', backgroundColor: 'var(--bg-light)', border: '1px solid var(--border)', borderRadius: '12px 12px 12px 2px', display: 'flex', gap: 5, alignItems: 'center' }}>
                {[0, 0.2, 0.4].map((d, i) => (
                  <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: 'var(--brand-red)', display: 'inline-block', animation: `blink 1s ${d}s infinite` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        <div style={{ backgroundColor: 'var(--bg-light)', borderTop: '1px solid var(--border)', padding: '8px 14px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {SUGGESTIONS.map((s, i) => (
            <button key={i} onClick={() => send(s)} disabled={loading}
              style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, backgroundColor: '#fff', color: 'var(--text-secondary)', border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--brand-red)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
              {s}
            </button>
          ))}
        </div>

        {/* Input */}
        <div style={{ borderTop: '1px solid var(--border)', padding: '10px 14px', backgroundColor: '#fff' }}>
          <form onSubmit={(e) => { e.preventDefault(); send(input); }} style={{ display: 'flex', gap: 8 }}>
            <input value={input} onChange={e => setInput(e.target.value)} disabled={loading}
              placeholder='e.g. "What happened in Gaza this week?"'
              style={{ flex: 1, padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 4, fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none', color: 'var(--text-primary)', backgroundColor: '#fff' }}
              onFocus={e => e.target.style.borderColor = 'var(--brand-red)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            <button type="submit" disabled={loading || !input.trim()}
              style={{ padding: '10px 18px', borderRadius: 4, backgroundColor: 'var(--brand-red)', color: '#fff', border: 'none', cursor: 'pointer', opacity: loading || !input.trim() ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 5, fontWeight: 700, fontSize: 12 }}>
              <Send size={14} /> Send
            </button>
          </form>
        </div>
      </div>

      <style>{`@keyframes blink { 0%,100%{opacity:.2} 50%{opacity:1} }`}</style>
    </div>
  );
}
