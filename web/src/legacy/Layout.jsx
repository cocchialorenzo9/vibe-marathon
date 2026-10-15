import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Brand from '../components/Brand';

// Stand-in for Docusaurus' @theme/Layout: these Season 01 pages were built
// for the personal site's light theme, so they keep it under a slim dark bar.
export default function Layout({ title, children }) {
  useEffect(() => {
    document.title = title;
  }, [title]);

  return (
    <div className="legacy">
      <header className="legacy-bar">
        <Link to="/" aria-label="Vibe Marathon home">
          <Brand />
        </Link>
        <Link to="/munich-2026" className="legacy-bar-link">
          Season 01 · Munich 2026
        </Link>
      </header>
      <main className="legacy-main">{children}</main>
    </div>
  );
}
