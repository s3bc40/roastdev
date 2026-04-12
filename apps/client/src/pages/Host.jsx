import { useState } from 'react';
import { LuPower, LuShare2 } from 'react-icons/lu';
import Layout from '../components/Layout';
import ConfirmModal from '../components/ConfirmModal';
import ResultBar from '../components/ResultBar';
import { useSession } from '../hooks/useSession';
import { BAR_COLORS, calcPct } from '../utils';

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001';

export default function Host({ code, onClose }) {
  const { question, results } = useSession(code, onClose);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleClose() {
    await fetch(`${SERVER_URL}/sessions/${code}/close`, { method: 'PATCH' });
  }

  const navAction = {
    label: 'Close session',
    onClick: () => setShowConfirm(true),
    className: 'btn-danger-outline btn-sm',
  };

  return (
    <>
      <Layout code={code} showLive navAction={navAction}>
        <div className="page-content">
          {!question ? (
            <p style={{ color: 'var(--rd-muted)', fontSize: '14px' }}>
              Loading question…
            </p>
          ) : (
            <div className="host-grid">
              {/* Left column — current question + results */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <div className="card">
                  <div className="section-label">Current question</div>
                  <div
                    style={{
                      fontSize: '18px',
                      fontWeight: 500,
                      color: 'var(--rd-text)',
                      lineHeight: 1.4,
                      marginBottom: '20px',
                    }}
                  >
                    {question.text}
                  </div>

                  {question.answers.map((answer, i) => (
                    <ResultBar
                      key={answer.id}
                      label={answer.text}
                      pct={calcPct(results, answer.id)}
                      color={BAR_COLORS[i] ?? BAR_COLORS[BAR_COLORS.length - 1]}
                    />
                  ))}
                </div>

                <div className="action-row">
                  <button
                    className="btn-danger-outline btn-icon"
                    onClick={() => setShowConfirm(true)}
                  >
                    <LuPower size={14} />
                    Close session
                  </button>
                </div>
              </div>

              {/* Right column — hint card */}
              <div className="card" style={{ alignSelf: 'start' }}>
                <div className="section-label">
                  <LuShare2
                    size={11}
                    style={{
                      display: 'inline',
                      marginRight: '5px',
                      verticalAlign: 'middle',
                    }}
                  />
                  Share with participants
                </div>
                <p
                  style={{
                    fontSize: '13px',
                    color: 'var(--rd-muted)',
                    lineHeight: 1.7,
                  }}
                >
                  Share the code{' '}
                  <strong
                    style={{
                      color: 'var(--rd-text)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {code}
                  </strong>{' '}
                  with your audience. Results update live as participants vote.
                  Close the session when you&apos;re ready to move on.
                </p>
              </div>
            </div>
          )}
        </div>
      </Layout>

      {showConfirm && (
        <ConfirmModal
          title="Close this session?"
          message="This will end the session for all participants and cannot be undone."
          confirmLabel="Close session"
          onConfirm={handleClose}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}
