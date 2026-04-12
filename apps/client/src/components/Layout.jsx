import NavBar from './NavBar';
import Footer from './Footer';

/**
 * Shared page shell: NavBar on top, Footer at the bottom, page content
 * in between. min-height: 100dvh on the wrapper ensures the footer is
 * always pushed to the bottom even on short pages.
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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <NavBar code={code} showLive={showLive} navAction={navAction} />
      {children}
      <Footer />
    </div>
  );
}
