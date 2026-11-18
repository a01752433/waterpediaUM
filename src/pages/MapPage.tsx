import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ClassMark, Sparkline } from "../components/Charts";
import {
  FLOW_PATH,
  classDropped,
  classRank,
  doBelowClassII,
  stations,
} from "../data/mock";
import type { DataSource, NwqsClass, WaterBody } from "../data/types";
import { formatDate } from "../lib/format";
import { useApp } from "../state";

type Range = "all" | "recent";
type ClassFilter = "all" | NwqsClass | "poor";

export function MapPage() {
  const { compareIds, toggleCompare } = useApp();
  const [query, setQuery] = useState("");
  const [range, setRange] = useState<Range>("all");
  const [body, setBody] = useState<"all" | WaterBody>("all");
  const [klass, setKlass] = useState<ClassFilter>("all");
  const [source, setSource] = useState<"all" | DataSource>("all");
  const [parameter, setParameter] = useState<"wqi" | "do" | "nh3n">("wqi");
  const [lowDo, setLowDo] = useState(false);
  const [hideGaps, setHideGaps] = useState(false);
  const [view, setView] = useState<"map" | "table">("map");
  const [selectedId, setSelectedId] = useState<string | null>("GB-04");
  const [focus, setFocus] = useState<string[] | null>(null);
  const [layers, setLayers] = useState({
    catchment: false,
    land: true,
    outlets: true,
    rain: false,
  });

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = stations.filter((station) => {
      if (focus && !focus.includes(station.id)) return false;
      if (needle && !`${station.id} ${station.name} ${station.waterBody}`.toLowerCase().includes(needle)) {
        return false;
      }
      if (range === "recent" && station.lastSample < "2026-10-19") return false;
      if (body !== "all" && station.waterBody !== body) return false;
      if (klass === "poor" && classRank[station.klass] < 3) return false;
      if (klass !== "all" && klass !== "poor" && station.klass !== klass) return false;
      if (source !== "all" && station.source !== source) return false;
      if (lowDo && !doBelowClassII(station)) return false;
      if (hideGaps && (station.qaqc !== "pass" || station.completeness < 85)) return false;
      return true;
    });
    return list.sort((a, b) => {
      if (parameter === "do") return a.params.do - b.params.do;
      if (parameter === "nh3n") return b.params.nh3n - a.params.nh3n;
      return a.wqi - b.wqi;
    });
  }, [body, focus, hideGaps, klass, lowDo, parameter, query, range, source]);

  const selected = visible.find((station) => station.id === selectedId) ?? visible[0] ?? null;
  const attention = visible.filter(
    (station) => classDropped(station) || doBelowClassII(station) || !station.fresh || station.qaqc === "fail",
  );

  const applyView = (name: "campus" | "low-do" | "flow") => {
    setQuery("");
    setRange("all");
    setKlass("all");
    setSource("all");
    setHideGaps(false);
    setView("map");
    if (name === "campus") {
      setBody("all");
      setLowDo(false);
      setFocus(null);
      setSelectedId("GB-04");
    }
    if (name === "low-do") {
      setBody("all");
      setLowDo(true);
      setFocus(null);
      setParameter("do");
      setSelectedId("GB-04");
    }
    if (name === "flow") {
      setBody("all");
      setLowDo(false);
      setFocus(FLOW_PATH);
      setSelectedId("GB-04");
    }
  };

  return (
    <section className="workspace">
      <aside className="panel filters">
        <div className="panel-head">
          <p className="eyebrow">Triage</p>
          <h1>Map overview</h1>
        </div>
        <label className="field">
          <span>Station lookup</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ID or name, e.g. GB-04"
          />
        </label>
        <label className="field">
          <span>Date range</span>
          <select value={range} onChange={(event) => setRange(event.target.value as Range)}>
            <option value="all">Full record · Sep 2025 – Nov 2026</option>
            <option value="recent">Last 30 days</option>
          </select>
        </label>
        <label className="field">
          <span>Water body</span>
          <select value={body} onChange={(event) => setBody(event.target.value as "all" | WaterBody)}>
            <option value="all">Wetland and lake</option>
            <option value="UM Green Belt wetland">UM Green Belt wetland</option>
            <option value="Varsity Lake">Varsity Lake</option>
          </select>
        </label>
        <label className="field">
          <span>NWQS class</span>
          <select value={klass} onChange={(event) => setKlass(event.target.value as ClassFilter)}>
            <option value="all">All classes</option>
            <option value="poor">Class III or worse</option>
            <option value="I">Class I</option>
            <option value="II">Class II</option>
            <option value="III">Class III</option>
            <option value="IV">Class IV</option>
            <option value="V">Class V</option>
          </select>
        </label>
        <label className="field">
          <span>Sort problems by</span>
          <select value={parameter} onChange={(event) => setParameter(event.target.value as "wqi" | "do" | "nh3n")}>
            <option value="wqi">Lowest WQI</option>
            <option value="do">Lowest dissolved oxygen</option>
            <option value="nh3n">Highest NH₃-N</option>
          </select>
        </label>
        <label className="field">
          <span>Data source</span>
          <select value={source} onChange={(event) => setSource(event.target.value as "all" | DataSource)}>
            <option value="all">Field and secondary</option>
            <option value="Field sampling">My field sampling</option>
            <option value="DOE secondary">DOE / secondary</option>
          </select>
        </label>
        <div className="toggle-stack">
          <label className="check">
            <input type="checkbox" checked={lowDo} onChange={(event) => setLowDo(event.target.checked)} />
            <span>DO below 5 mg/L in the last 30 days</span>
          </label>
          <label className="check">
            <input type="checkbox" checked={hideGaps} onChange={(event) => setHideGaps(event.target.checked)} />
            <span>Hide gaps and failed QA/QC</span>
          </label>
        </div>
        <div className="layer-box">
          <p>Map layers</p>
          {(
            [
              ["catchment", "Catchment boundary"],
              ["land", "Land use and labs"],
              ["outlets", "Discharge outlets"],
              ["rain", "Rainfall, last 36 h"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="check">
              <input
                type="checkbox"
                checked={layers[key]}
                onChange={(event) => setLayers((current) => ({ ...current, [key]: event.target.checked }))}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
        <div className="saved">
          <p>Saved views</p>
          <button type="button" onClick={() => applyView("campus")}>
            Campus sampling points
          </button>
          <button type="button" onClick={() => applyView("flow")}>
            Wetland → lake flow path
          </button>
          <button type="button" onClick={() => applyView("low-do")}>
            Low DO watch
          </button>
        </div>
      </aside>

      <div className="stage-wrap">
        <div className="stage-bar">
          <p>
            {visible.length} stations
            {focus ? " · flow path" : ""}
            {lowDo ? " · DO < 5 mg/L" : ""}
          </p>
          <div className="segmented" role="tablist" aria-label="Map or table">
            <button type="button" aria-pressed={view === "map"} onClick={() => setView("map")}>
              Map
            </button>
            <button type="button" aria-pressed={view === "table"} onClick={() => setView("table")}>
              Table
            </button>
          </div>
        </div>

        {view === "map" ? (
          <div className="map-frame">
            <div className="map-stage">
              <svg className="map-art" viewBox="0 0 1000 680" preserveAspectRatio="none" role="img" aria-label="Schematic of the UM Green Belt wetland flowing into Varsity Lake">
                <rect width="1000" height="680" fill="#e5efe6" />
                <path d="M0 0 H1000 V680 H0 Z" fill="url(#papergrain)" />
                <defs>
                  <pattern id="papergrain" width="8" height="8" patternUnits="userSpaceOnUse">
                    <rect width="8" height="8" fill="#e7f0e6" />
                    <circle cx="1" cy="2" r="0.6" fill="#d5e2d4" />
                  </pattern>
                  <linearGradient id="lakeFill" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#d7efea" />
                    <stop offset="100%" stopColor="#7ebeb4" />
                  </linearGradient>
                  <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                    <path d="M0 0 L8 4 L0 8 Z" fill="#0A3D3A" />
                  </marker>
                </defs>
                {layers.catchment && (
                  <ellipse cx="500" cy="360" rx="460" ry="280" fill="none" stroke="#0A3D3A" strokeDasharray="7 6" strokeWidth="1.5" opacity="0.55" />
                )}
                <path
                  d="M70 160 C160 80 280 130 290 250 C300 370 230 500 140 530 C50 540 10 420 30 300 C42 210 30 190 70 160 Z"
                  fill="#c9dcb4"
                />
                <ellipse cx="150" cy="230" rx="62" ry="34" fill="url(#lakeFill)" />
                <ellipse cx="120" cy="330" rx="54" ry="30" fill="url(#lakeFill)" />
                <ellipse cx="175" cy="410" rx="48" ry="26" fill="url(#lakeFill)" />
                <path
                  d="M250 360 C340 400 400 360 470 330"
                  fill="none"
                  stroke="#6eaea4"
                  strokeWidth="16"
                  strokeLinecap="round"
                />
                <path
                  d="M250 360 C340 400 400 360 470 330"
                  fill="none"
                  stroke="#0A3D3A"
                  strokeWidth="1.5"
                  markerEnd="url(#arrow)"
                />
                <path
                  d="M470 210 C570 120 790 115 890 220 C990 320 960 500 840 555 C700 610 540 545 470 430 C410 340 400 270 470 210 Z"
                  fill="url(#lakeFill)"
                  stroke="#0F6E67"
                  strokeWidth="2"
                />
                <g opacity={layers.land ? 1 : 0.18}>
                  <rect x="800" y="62" width="78" height="40" rx="3" fill="#efe6d4" stroke="#8d7b62" />
                  <rect x="886" y="74" width="62" height="48" rx="3" fill="#efe6d4" stroke="#8d7b62" />
                  <rect x="824" y="112" width="96" height="30" rx="3" fill="#efe6d4" stroke="#8d7b62" />
                  <text x="838" y="86" className="map-label">
                    Labs
                  </text>
                  <text x="92" y="150" className="map-label">
                    Green belt
                  </text>
                  <text x="690" y="300" className="map-label map-label-water">
                    Varsity Lake
                  </text>
                </g>
                {layers.outlets && (
                  <g>
                    <path d="M820 214 l10 16 h-20 z" fill="#B4332A" />
                    <text x="836" y="232" className="map-label">
                      Lab discharge
                    </text>
                  </g>
                )}
                {layers.rain && (
                  <g>
                    <rect x="620" y="24" width="250" height="36" rx="8" fill="#0A3D3A" />
                    <text x="638" y="47" fill="#f4f1ea" fontSize="14" fontFamily="IBM Plex Sans, sans-serif">
                      18 mm · last 36 hours
                    </text>
                  </g>
                )}
                <text x="28" y="652" className="map-caption">
                  N · schematic of the sampling flow, not a survey map
                </text>
              </svg>
              {visible.map((station) => (
                <button
                  key={station.id}
                  type="button"
                  className={`pin ${selected?.id === station.id ? "is-selected" : ""} ${station.fresh ? "" : "is-stale"}`}
                  style={{ left: `${station.x}%`, top: `${station.y}%` }}
                  data-class={station.klass}
                  onClick={() => setSelectedId(station.id)}
                >
                  <span className="pin-dot" />
                  {classDropped(station) && <span className="pin-alert" title="Class dropped" />}
                  <span className="pin-id">{station.id}</span>
                </button>
              ))}
            </div>
            <ul className="legend">
              {(["I", "II", "III", "IV", "V"] as const).map((item) => (
                <li key={item}>
                  <i className={`swatch class-${item}`} /> Class {item}
                </li>
              ))}
              <li>
                <i className="swatch stale" /> No recent sample
              </li>
              <li>
                <i className="swatch alert" /> Class dropped
              </li>
            </ul>
          </div>
        ) : (
          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>Station</th>
                  <th>Water body</th>
                  <th>Class</th>
                  <th>WQI</th>
                  <th>DO mg/L</th>
                  <th>Last sample</th>
                  <th>QA</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((station) => (
                  <tr key={station.id} onClick={() => setSelectedId(station.id)} className={selected?.id === station.id ? "is-selected" : ""}>
                    <td>
                      <Link to={`/station/${station.id}`}>{station.id}</Link>
                      <small>{station.name}</small>
                    </td>
                    <td>{station.waterBody}</td>
                    <td>
                      <ClassMark value={station.klass} />
                    </td>
                    <td className="num">{station.wqi.toFixed(1)}</td>
                    <td className="num">{station.params.do.toFixed(1)}</td>
                    <td>{formatDate(station.lastSample)}</td>
                    <td>{station.qaqc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {visible.length === 0 && <p className="empty">No stations match these filters.</p>}
          </div>
        )}
      </div>

      <aside className="panel triage">
        {selected ? (
          <article className="summary-card">
            <header>
              <div>
                <p className="eyebrow">{selected.waterBody}</p>
                <h2>
                  {selected.id}
                  <span>{selected.name}</span>
                </h2>
              </div>
              <ClassMark value={selected.klass} />
            </header>
            <p className="wqi-line">
              <strong>{selected.wqi.toFixed(1)}</strong>
              <span>WQI</span>
              <em className={`trend trend-${selected.trend}`}>{selected.trend}</em>
            </p>
            <p className="dragging">{selected.dragging}</p>
            <Sparkline values={selected.series.map((point) => point.wqi)} />
            <p className="meta-line">Last sample {formatDate(selected.lastSample)} · {selected.completeness}% complete</p>
            {selected.sensitive && <p className="flag-note">Restricted point · lab effluent</p>}
            {!selected.fresh && <p className="flag-note">No sample since {formatDate(selected.lastSample)}</p>}
            <div className="card-actions">
              <Link className="btn primary" to={`/station/${selected.id}`}>
                View station
              </Link>
              <label className="check">
                <input
                  type="checkbox"
                  checked={compareIds.includes(selected.id)}
                  onChange={() => toggleCompare(selected.id)}
                />
                <span>Compare</span>
              </label>
            </div>
          </article>
        ) : (
          <p className="empty">No stations match these filters.</p>
        )}

        <div className="attention">
          <p className="eyebrow">Needs a look · {attention.length}</p>
          <ul>
            {attention.map((station) => (
              <li key={station.id}>
                <button type="button" onClick={() => setSelectedId(station.id)}>
                  <ClassMark value={station.klass} />
                  <span>
                    <strong>{station.id}</strong>
                    {classDropped(station)
                      ? `Class ${station.previousClass} → ${station.klass}`
                      : !station.fresh
                        ? "No recent sample"
                        : station.qaqc === "fail"
                          ? "QA/QC failed"
                          : `DO ${station.params.do.toFixed(1)} mg/L`}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </section>
  );
}
