import { useState } from 'react';
import Layout from '../components/Layout';
import socket from '../socket';

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001';

/**
 * Home page — two actions:
 *   Join roast: validates the code via GET /sessions/:code before connecting.
 *   Host a session: creates a new session via POST /sessions.
 *
 * Why validate via REST before socket.connect()?
 * It gives a clear synchronous error ("session not found" / "session closed")
 * without ever opening a WebSocket to a dead session.
 */
export default function Home({ onJoin, onHost }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleJoin(e) {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${SERVER_URL}/sessions/${trimmed}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message ?? 'Session not found.');
        return;
      }
      const session = await res.json();
      if (session.status === 'closed') {
        setError('This session is already closed.');
        return;
      }
      socket.connect();
      onJoin({ code: trimmed });
    } catch {
      setError('Could not reach the server. Is it running?');
    } finally {
      setLoading(false);
    }
  }

  async function handleHost() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${SERVER_URL}/sessions`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to create session');
      const session = await res.json();
      socket.connect();
      onHost({ code: session.code });
    } catch {
      setError('Could not create a session. Is the server running?');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <div className="home-wrap">
        <div className="home-hero">
          <div className="hero-title">
            <span style={{ color: 'var(--rd-text)' }}>Roast</span>
            <span style={{ color: 'var(--rd-brand2)' }}>Dev</span>
          </div>
          <div
            style={{
              fontSize: '16px',
              color: 'var(--rd-muted)',
              marginTop: '10px',
            }}
          >
            where devs get roasted — one hot take at a time
          </div>
        </div>

        <div className="home-card">
          <div className="card">
            <form onSubmit={handleJoin}>
              <div className="input-label">Session code</div>
              <input
                className="code-input"
                placeholder="_ _ _ _ _ _"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={8}
                autoComplete="off"
                spellCheck={false}
              />
              {error && (
                <p
                  style={{
                    color: 'var(--rd-brand)',
                    fontSize: '13px',
                    marginTop: '8px',
                  }}
                >
                  {error}
                </p>
              )}
              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%', marginTop: '14px' }}
                disabled={loading}
              >
                {loading ? 'Joining…' : 'Join roast'}
              </button>
            </form>

            <div className="or-divider">
              <div className="or-line" />
              <div className="or-text">or</div>
              <div className="or-line" />
            </div>

            <button
              type="button"
              className="btn-ghost"
              style={{ width: '100%' }}
              onClick={handleHost}
              disabled={loading}
            >
              Host a session
            </button>
          </div>

          <p
            style={{
              textAlign: 'center',
              marginTop: '12px',
              fontSize: '12px',
              color: 'var(--rd-muted)',
            }}
          >
            No account needed. Just a code.
          </p>
        </div>
      </div>
    </Layout>
  );
}
