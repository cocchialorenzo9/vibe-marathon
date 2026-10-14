import { Link, useLocation, useNavigate } from "react-router-dom";
import Brand from "./Brand";
import { Code } from "./icons";

export const REPO_URL = "https://github.com/cocchialorenzo9/vibe-marathon";

const SECTIONS = [
  { id: "today", label: "Today" },
  { id: "plan", label: "Plan" },
  { id: "data", label: "Data" },
];

export function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function SiteNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // HashRouter owns the URL hash, so in-page anchors scroll by id instead.
  const goTo = (id: string) => {
    if (pathname === "/") scrollToSection(id);
    else navigate("/", { state: { section: id } });
  };

  return (
    <header className="nav">
      <nav aria-label="Main" className="container nav-inner">
        <Link to="/" aria-label="Vibe Marathon home">
          <Brand />
        </Link>
        <div className="nav-links">
          {SECTIONS.map((s) => (
            <button key={s.id} type="button" className="nav-link" onClick={() => goTo(s.id)}>
              {s.label}
            </button>
          ))}
          <Link
            className="nav-link"
            to="/munich-2026"
            aria-current={pathname.startsWith("/munich-2026") ? "page" : undefined}
          >
            Munich 2026
          </Link>
          <a className="btn-pill" href={REPO_URL}>
            <Code />
            Source
          </a>
        </div>
      </nav>
    </header>
  );
}
