import { useState } from 'react';
import { LuCopy, LuCheck } from 'react-icons/lu';
import BadgeLive from './BadgeLive';

/**
 * Copy-to-clipboard button for the session code.
 * Shows a LuCheck for 2 s after a successful copy, then reverts.
 * Uses the Clipboard API (available in all modern browsers over HTTPS/localhost).
 */
function CopyCode({ code }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      className="copy-btn"
      onClick={handleCopy}
      aria-label={copied ? 'Code copied' : 'Copy session code'}
      title={copied ? 'Copied!' : 'Copy code'}
    >
      <span className="navbar-code">{code}</span>
      {copied ? (
        <LuCheck size={14} color="var(--rd-brand)" />
      ) : (
        <LuCopy size={14} />
      )}
    </button>
  );
}

/**
 * Top navigation bar shared across all pages.
 * Props:
 *   code      — session code; when provided renders a copy button
 *   showLive  — whether to display the live badge
 *   navAction — optional { label, onClick, className } — makes the logo a
 *               button and adds a labelled action button in the nav right
 */
export default function NavBar({ code, showLive, navAction }) {
  return (
    <nav className="navbar">
      {navAction ? (
        <button
          className="logo logo-btn"
          onClick={navAction.onClick}
          aria-label={navAction.label}
        >
          <span className="logo-w">Roast</span>
          <span className="logo-o">Dev</span>
        </button>
      ) : (
        <div className="logo">
          <span className="logo-w">Roast</span>
          <span className="logo-o">Dev</span>
        </div>
      )}

      <div className="navbar-right">
        {showLive && <BadgeLive />}
        {code && <CopyCode code={code} />}
        {navAction && (
          <button
            className={navAction.className ?? 'btn-ghost btn-sm'}
            onClick={navAction.onClick}
          >
            {navAction.label}
          </button>
        )}
      </div>
    </nav>
  );
}
