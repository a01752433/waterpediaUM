import { Link, NavLink, Outlet } from "react-router-dom";
import { useApp } from "../state";

const links = [
  { to: "/", label: "Map", end: true },
  { to: "/compare", label: "Compare", end: false },
  { to: "/upload", label: "Upload & QA", end: false },
  { to: "/archive", label: "Archive & API", end: false },
];

export function Shell() {
  const { compareIds, message } = useApp();

  return (
    <div className="app">
      <header className="topbar">
        <Link className="brand" to="/">
          <span className="brand-mark" aria-hidden="true" />
          <span>
            <strong>waterpedia</strong>
            <em>UM</em>
          </span>
        </Link>
        <nav className="nav" aria-label="Primary">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className="nav-link">
              {link.label}
              {link.to === "/compare" && compareIds.length > 0 && (
                <span className="nav-count">{compareIds.length}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <p className="campus-chip">Universiti Malaya · Varsity Lake</p>
      </header>
      <Outlet />
      {message && (
        <div className="toast" role="status">
          {message}
        </div>
      )}
    </div>
  );
}
