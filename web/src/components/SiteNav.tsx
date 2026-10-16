import { Link, useLocation, useNavigate } from "react-router-dom";
import Brand from "./Brand";
import { Code } from "./icons";

export const REPO_URL = "https://github.com/cocchialorenzo9/vibe-marathon";

// Landing-page sections (scroll) and routes, in nav order.
const ITEMS = [
  { section: "today", label: "Today" },
  { to: "/program", label: "Program" },
  { to: "/drills", label: "Drills" },
  { section: "data", label: "Data" },
  { to: "/munich-2026", label: "Munich 2026" },
] as const;

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
          {ITEMS.map((item) =>
            "section" in item ? (
              <button key={item.label} type="button" className="nav-link" onClick={() => goTo(item.section)}>
                {item.label}
              </button>
            ) : (
              <Link
                key={item.label}
                className="nav-link"
                to={item.to}
                aria-current={pathname.startsWith(item.to) ? "page" : undefined}
              >
                {item.label}
              </Link>
            ),
          )}
          <a className="btn-pill" href={REPO_URL}>
            <Code />
            Source
          </a>
        </div>
      </nav>
    </header>
  );
}
