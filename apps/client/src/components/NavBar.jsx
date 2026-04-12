import BadgeLive from './BadgeLive';

/**
 * Top navigation bar shared across all pages.
 * Props:
 *   code      — session code string (shown in monospace when provided)
 *   showLive  — whether to display the live badge
 *   navAction — optional { label, onClick, className } object.
 *               When provided:
 *                 • the logo becomes a button (same onClick) so users can
 *                   always trigger the action by clicking the brand mark
 *                 • a labelled button appears in the nav right
 *               This single prop replaces two separate onHome / custom-action
 *               props — one code path, one contract.
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
        {code && <span className="navbar-code">{code}</span>}
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
