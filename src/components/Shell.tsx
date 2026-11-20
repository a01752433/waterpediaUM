import { Droplets, Upload } from "lucide-react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useApp } from "../state";

const links = [
  { to: "/", label: "Map", end: true },
  { to: "/compare", label: "Compare", end: false },
  { to: "/upload", label: "Upload & QA", end: false },
  { to: "/archive", label: "Archive & API", end: false },
];

export function Shell() {
  const { compareIds, message, theme, toggleTheme } = useApp();
  const path = useLocation().pathname;
  const isMap = path === "/";
  const mapBar = isMap || path === "/upload" || path === "/profile";

  return (
    <div className={isMap ? "app map-shell" : "app"}>
      {mapBar ? (
        <MapBar />
      ) : (
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
        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          <span aria-hidden="true">{theme === "light" ? "☾" : "☀"}</span>
          <span>{theme === "light" ? "Dark" : "Light"}</span>
        </button>
      </header>
      )}
      <Outlet />
      {message && (
        <div className="toast" role="status">
          {message}
        </div>
      )}
    </div>
  );
}

function MapBar() {
  const onMap = useLocation().pathname === "/";

  return (
    <header className="sticky top-0 z-[600] flex h-20 shrink-0 items-center gap-3 overflow-hidden bg-[#0c1024] px-6 text-white [&_a]:text-white [&_a]:no-underline">
      <Link to="/" className="flex items-center gap-3 font-semibold tracking-tight" aria-label="Back to map">
        <span className="grid size-11 place-items-center rounded-2xl bg-[#6d4dff] shadow-[0_8px_20px_rgba(109,77,255,0.45)]">
          <Droplets className="size-5" />
        </span>
        <span className="text-2xl">waterpedia</span>
      </Link>
      <span className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-white/75 md:inline-flex">
        <span className="size-2 rounded-full bg-emerald-400" />
        Universiti Malaya waterbodies
      </span>
      {!onMap && (
        <Link
          to="/"
          className="inline-flex items-center rounded-full bg-[#6d4dff] px-5 py-2.5 text-base font-medium shadow-[0_8px_20px_rgba(109,77,255,0.35)]"
        >
          Map
        </Link>
      )}
      {onMap && (
        <Link
          to="/upload"
          className="inline-flex items-center gap-2 rounded-full bg-[#6d4dff] px-5 py-2.5 text-base font-medium shadow-[0_8px_20px_rgba(109,77,255,0.35)]"
        >
          <Upload className="size-4" />
          Upload samples
        </Link>
      )}
      <Link
        to="/profile"
        className="ml-auto flex h-12 items-center gap-2.5 rounded-full border border-white/10 bg-white/5 pr-4 pl-1.5"
        aria-label="Firdaus profile"
      >
        <span className="grid size-9 place-items-center rounded-full bg-[#6d4dff] text-sm font-semibold">FD</span>
        <span className="flex flex-col justify-center gap-0.5">
          <span className="text-base leading-none font-semibold">Firdaus</span>
          <span className="text-xs leading-none text-white/55">UM scientist</span>
        </span>
      </Link>
    </header>
  );
}
