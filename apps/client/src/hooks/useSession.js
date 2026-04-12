import { useEffect, useState } from 'react';
import socket from '../socket';

/**
 * Custom hook — manages socket subscriptions for a session room.
 *
 * Both Host and Participant need the same socket events:
 *   session_joined   → exposes the question object
 *   vote_update      → keeps results live
 *   session_closed   → calls onClose() to navigate home
 *   question_changed → updates question, resets results, calls onQuestionChanged()
 *
 * Extracting this into a hook means neither page owns the subscription
 * logic: they just call useSession() and receive { question, results }.
 *
 * Custom hooks are the React pattern for reusing stateful logic across
 * components. Unlike a utility function, a hook can call useState and
 * useEffect — it participates in the React lifecycle.
 *
 * Named handler variables are required so socket.off() can remove the
 * exact same function reference that was registered with socket.on().
 * Inline arrows would create new references each render, making
 * socket.off() a no-op and stacking duplicate handlers over time.
 */
export function useSession(code, onClose, onQuestionChanged) {
  const [question, setQuestion] = useState(null);
  const [results, setResults] = useState([]);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    function onSessionJoined({ question: q }) {
      setQuestion(q);
    }
    function onVoteUpdate({ results: r }) {
      setResults(r);
    }
    function onSessionClosed() {
      onClose();
    }
    function onQuestionChangedHandler({ question: q, hasMore: more }) {
      setQuestion(q);
      setResults([]);
      setHasMore(more);
      onQuestionChanged?.();
    }

    socket.on('session_joined', onSessionJoined);
    socket.on('vote_update', onVoteUpdate);
    socket.on('session_closed', onSessionClosed);
    socket.on('question_changed', onQuestionChangedHandler);
    socket.emit('join_session', code);

    return () => {
      socket.off('session_joined', onSessionJoined);
      socket.off('vote_update', onVoteUpdate);
      socket.off('session_closed', onSessionClosed);
      socket.off('question_changed', onQuestionChangedHandler);
    };
  }, [code, onClose, onQuestionChanged]);

  return { question, results, hasMore };
}
