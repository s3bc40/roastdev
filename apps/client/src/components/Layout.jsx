import NavBar from './NavBar';

/**
 * Shared page shell: NavBar on top, then whatever the page passes as children.
 *
 * Props:
 *   code      — session code shown in the nav (optional)
 *   showLive  — whether to show the live badge (optional)
 *   navAction — optional { label, onClick, className } forwarded to NavBar.
 *               Makes the logo a button and adds a labelled action button.
 *   children  — the page content rendered below the nav
 */
export default function Layout({ code, showLive, navAction, children }) {
  return (
    <div>
      <NavBar code={code} showLive={showLive} navAction={navAction} />
      {children}
    </div>
  );
}
