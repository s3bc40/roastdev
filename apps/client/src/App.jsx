import { useState } from 'react';
import Home from './pages/Home';
import Host from './pages/Host';
import Participant from './pages/Participant';

/**
 * App — state-based router.
 *
 * Three pages, no URL sharing needed, so React Router adds overhead without
 * benefit. A `page` string + `sessionData` object is the full routing layer.
 *
 * sessionData shape: { code: string }
 *   Set by Home before navigating so Host/Participant receive the session code
 *   as a prop without any extra fetch.
 */
export default function App() {
  const [page, setPage] = useState('home'); // 'home' | 'host' | 'participant'
  const [sessionData, setSessionData] = useState(null);

  function goHome() {
    setSessionData(null);
    setPage('home');
  }

  if (page === 'host') {
    return <Host code={sessionData.code} onClose={goHome} />;
  }

  if (page === 'participant') {
    return <Participant code={sessionData.code} onClose={goHome} />;
  }

  return (
    <Home
      onJoin={(data) => {
        setSessionData(data);
        setPage('participant');
      }}
      onHost={(data) => {
        setSessionData(data);
        setPage('host');
      }}
    />
  );
}
