import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
import './styles/components.css';
import App from './App';

/**
 * Entry point — mounts the React tree into <div id="root"> in index.html.
 *
 * StrictMode renders components twice in development to surface side effects
 * that depend on render order. It has no effect in production builds.
 * It's the reason you may see useEffect run twice in dev — intentional.
 */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
