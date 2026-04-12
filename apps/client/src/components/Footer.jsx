import { SiGithub } from 'react-icons/si';
import { LuGlobe } from 'react-icons/lu';

export default function Footer() {
  return (
    <footer className="footer">
      <a
        className="footer-link footer-icon-link"
        href="https://s3bc40.com"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="s3bc40 portfolio"
      >
        <LuGlobe size={14} />
        s3bc40
      </a>

      <span className="footer-sep" aria-hidden="true" />

      <a
        className="footer-link footer-icon-link"
        href="https://github.com/s3bc40/roastdev"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="RoastDev on GitHub"
      >
        <SiGithub size={14} />
        roastdev
      </a>
    </footer>
  );
}
