import { useState } from 'react';
import confetti from 'canvas-confetti';
import Layout from '../components/Layout';
import ResultBar from '../components/ResultBar';
import { useSession } from '../hooks/useSession';
import { BAR_COLORS, calcPct } from '../utils';
import socket from '../socket';

/**
 * Participant page — two phases driven by the `phase` state string:
 *
 *   'voting'  — answer grid + submit button
 *   'waiting' — vote confirmed card + live results
 *
 * Why a string instead of a boolean (e.g. hasVoted)?
 * A string phase is self-documenting and extensible — if a third state
 * ('closed') is needed later, no refactor required.
 *
 * canvas-confetti is called directly in handleSubmit — it's a one-shot
 * side effect triggered by a user action, not by the render cycle,
 * so no useEffect is needed.
 */
export default function Participant({ code, onClose }) {
  const { question, results } = useSession(code, onClose);
  const [selectedId, setSelectedId] = useState(null);
  const [phase, setPhase] = useState('voting');

  function handleSubmit() {
    socket.emit('submit_vote', { code, answerId: selectedId });
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#E17000', '#F88101', '#F8A800'],
    });
    setPhase('waiting');
  }

  function handleChange() {
    // Keep selectedId so the previously chosen answer stays highlighted
    setPhase('voting');
  }

  const selectedAnswer = question?.answers.find((a) => a.id === selectedId);

  if (!question) {
    return (
      <Layout
      code={code}
      showLive
      navAction={{ label: '← Leave', onClick: onClose }}
    >
        <div className="page-content">
          <p style={{ color: 'var(--rd-muted)', fontSize: '14px' }}>
            Joining session…
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      code={code}
      showLive
      navAction={{ label: '← Leave', onClick: onClose }}
    >
      <div className="page-content">
        {phase === 'voting' ? (
          /* ── Voting phase ── */
          <div className="participant-grid">
            <div>
              <div className="card" style={{ marginBottom: '16px' }}>
                <div className="section-label">Question</div>
                <div
                  style={{
                    fontSize: '22px',
                    fontWeight: 500,
                    color: 'var(--rd-text)',
                    lineHeight: 1.4,
                  }}
                >
                  {question.text}
                </div>
              </div>

              <div className="answers-grid">
                {question.answers.map((answer) => (
                  <div
                    key={answer.id}
                    className={`answer-opt${selectedId === answer.id ? ' selected' : ''}`}
                    onClick={() => setSelectedId(answer.id)}
                  >
                    <div className="radio">
                      <div className="radio-inner" />
                    </div>
                    <span className="answer-opt-text">{answer.text}</span>
                  </div>
                ))}
              </div>

              <button
                className="btn-primary"
                style={{ width: '100%', marginTop: '16px', padding: '14px' }}
                onClick={handleSubmit}
                disabled={!selectedId}
              >
                Submit vote
              </button>
            </div>

            <div className="card" style={{ alignSelf: 'start' }}>
              <div className="section-label">How it works</div>
              <p
                style={{
                  fontSize: '13px',
                  color: 'var(--rd-muted)',
                  lineHeight: 1.7,
                }}
              >
                Select your answer and submit. Results appear live once
                you&apos;ve voted — and you can change your mind until the host
                closes the question.
              </p>
            </div>
          </div>
        ) : (
          /* ── Waiting phase ── */
          <div className="participant-grid">
            <div>
              <div className="waiting-card">
                <div className="waiting-icon">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle
                      cx="10"
                      cy="10"
                      r="8"
                      stroke="#E17000"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M10 6v4l2.5 2.5"
                      stroke="#E17000"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <div
                  style={{
                    fontSize: '15px',
                    fontWeight: 500,
                    color: 'var(--rd-text)',
                    marginBottom: '4px',
                  }}
                >
                  Vote submitted
                </div>
                <div style={{ fontSize: '13px', color: 'var(--rd-muted)' }}>
                  Waiting for others…
                </div>

                {selectedAnswer && (
                  <div className="voted-pill">
                    <div className="voted-pill-dot" />
                    <span style={{ fontSize: '13px', color: 'var(--rd-text)' }}>
                      {selectedAnswer.text}
                    </span>
                  </div>
                )}

                <div className="waiting-dot-row">
                  <div className="wdot" />
                  <div className="wdot" />
                  <div className="wdot" />
                </div>

                <button className="btn-change" onClick={handleChange}>
                  Change my answer
                </button>
              </div>
            </div>

            <div className="card" style={{ alignSelf: 'start' }}>
              <div className="section-label">Live results</div>
              {question.answers.map((answer, i) => (
                <ResultBar
                  key={answer.id}
                  label={answer.text}
                  pct={calcPct(results, answer.id)}
                  color={BAR_COLORS[i] ?? BAR_COLORS[BAR_COLORS.length - 1]}
                />
              ))}
              <p
                style={{
                  fontSize: '11px',
                  color: 'var(--rd-muted)',
                  marginTop: '16px',
                }}
              >
                Updates live as others vote
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
