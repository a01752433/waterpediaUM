import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ClassMark, LineChart } from "../components/Charts";
import { stationById, stationColor } from "../data/mock";
import { copyText, formatDate, formatMonth } from "../lib/format";
import { useApp } from "../state";

const core = [
  { key: "do", label: "DO", unit: "mg/L", limit: "Class II limit 5 mg/L" },
  { key: "bod", label: "BOD", unit: "mg/L", limit: "5-day incubation" },
  { key: "cod", label: "COD", unit: "mg/L", limit: "Closed reflux" },
  { key: "nh3n", label: "NH₃-N", unit: "mg/L", limit: "Nessler method" },
  { key: "tss", label: "TSS", unit: "mg/L", limit: "Gravimetric" },
  { key: "ph", label: "pH", unit: "", limit: "Field probe" },
] as const;

type Horizon = "48h" | "7d" | "season";
type Extra = "nutrients" | "metals" | "pending";

export function StationPage() {
  const { id = "" } = useParams();
  const station = stationById(id);
  const { toast, toggleCompare, compareIds } = useApp();
  const [horizon, setHorizon] = useState<Horizon>("48h");
  const [extra, setExtra] = useState<Extra>("nutrients");
  const [metadataOpen, setMetadataOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [rules, setRules] = useState({ classDrop: true, lowDo: true, digest: true });

  const chart = useMemo(() => {
    if (!station) return null;
    const labels = station.series.map((point) => formatMonth(point.date));
    const observed = station.series.map((point) => point.wqi);
    if (horizon === "season") return { labels, observed, predicted: [] as (number | null)[] };
    const steps = horizon === "48h" ? 2 : 4;
    const last = observed.at(-1) ?? station.wqi;
    const future = Array.from({ length: steps }, (_, index) => Math.round((last - (index + 1) * 1.1) * 10) / 10);
    return {
      labels: [...labels, ...future.map((_, index) => (horizon === "48h" ? `+${(index + 1) * 24}h` : `+${index + 1}d`))],
      observed: [...observed, ...future.map(() => null)],
      predicted: [...observed.map((value, index) => (index === observed.length - 1 ? value : null)), ...future],
    };
  }, [horizon, station]);

  if (!station || !chart) {
    return (
      <section className="page">
        <p className="empty">That station is not in the campus set.</p>
        <Link to="/">Back to the map</Link>
      </section>
    );
  }

  const monsoon = station.series.filter((point) => point.season === "Monsoon");
  const dry = station.series.filter((point) => point.season === "Dry");
  const avg = (values: number[]) => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0);
  const anomalies = station.series.filter((point, index) => {
    const previous = station.series[index - 1];
    return previous != null && previous.do - point.do > 1.2;
  });

  const share = async () => {
    await copyText(window.location.href);
    toast("Shareable station link copied");
  };

  return (
    <section className="page station-page">
      <div className="page-intro">
        <Link className="back" to="/">
          Map
        </Link>
        <div>
          <p className="eyebrow">{station.role}</p>
          <h1>
            {station.id} · {station.name}
          </h1>
          <p className="lede">{station.dragging}. Surface samples only. Depth profiling is not part of this study.</p>
        </div>
        <div className="hero-stats">
          <ClassMark value={station.klass} />
          <p>
            <strong>{station.wqi.toFixed(1)}</strong>
            <span>DOE WQI</span>
          </p>
          <p>
            <strong className={`trend trend-${station.trend}`}>{station.trend}</strong>
            <span>since previous class {station.previousClass}</span>
          </p>
        </div>
      </div>

      <div className="param-grid">
        {core.map((item) => {
          const reading = station.params[item.key];
          const score = station.subindex[item.key];
          const warn = item.key === "do" && typeof reading === "number" && reading < 5;
          return (
            <article key={item.key} className={`param-card ${warn ? "is-warn" : ""}`}>
              <header>
                <h2>{item.label}</h2>
                <span>{item.limit}</span>
              </header>
              <p className="param-value">
                {reading == null ? "—" : reading}
                <small>{item.unit}</small>
              </p>
              <div className="subindex">
                <span style={{ width: `${score ?? 0}%` }} />
              </div>
              <p className="meta-line">{score == null ? "Sub-index blocked" : `Sub-index ${score}`}</p>
            </article>
          );
        })}
      </div>

      <div className="segmented compact extra-tabs">
        {(
          [
            ["nutrients", "Nutrients"],
            ["pending", "Temp"],
            ["metals", "Metals"],
          ] as const
        ).map(([key, label]) => (
          <button key={key} type="button" aria-pressed={extra === key} onClick={() => setExtra(key)}>
            {label}
          </button>
        ))}
      </div>
      <div className="extra-panel">
        {extra === "nutrients" && (
          <ul className="stat-row">
            <li>Total phosphorus <strong>{station.params.tp ?? "—"} mg/L</strong></li>
            <li>Nitrate <strong>{station.params.nitrate ?? "—"} mg/L</strong></li>
            <li>Phosphate <strong>{station.params.phosphate ?? "—"} mg/L</strong></li>
            <li>Chlorophyll-a <strong>{station.params.chla ?? "—"} µg/L</strong></li>
          </ul>
        )}
        {extra === "pending" && (
          <p>Temperature and turbidity are not in the current dataset. They are planned for the next field round and will appear here.</p>
        )}
        {extra === "metals" && (
          <p>{station.params.metals ?? "No metals screen for this point. Metals are collected at the laboratory effluent only."}</p>
        )}
      </div>

      <div className="split">
        <article className="card">
          <header className="card-head">
            <div>
              <p className="eyebrow">Forecast</p>
              <h2>Observed and predicted WQI</h2>
            </div>
            <div className="segmented compact">
              {(
                [
                  ["48h", "48h"],
                  ["7d", "7d"],
                  ["season", "Season"],
                ] as const
              ).map(([key, label]) => (
                <button key={key} type="button" aria-pressed={horizon === key} onClick={() => setHorizon(key)}>
                  {label}
                </button>
              ))}
            </div>
          </header>
          {horizon === "season" ? (
            <div className="season-pair">
              <p>
                <span>Monsoon mean WQI</span>
                <strong>{avg(monsoon.map((point) => point.wqi)).toFixed(1)}</strong>
                <small>{monsoon.length} samples · Nov–Mar</small>
              </p>
              <p>
                <span>Dry mean WQI</span>
                <strong>{avg(dry.map((point) => point.wqi)).toFixed(1)}</strong>
                <small>{dry.length} samples · Jun–Sep</small>
              </p>
            </div>
          ) : (
            <LineChart
              labels={chart.labels}
              min={30}
              max={100}
              thresholds={[
                { value: 76.5, label: "Class II · 76.5" },
                { value: 51.9, label: "Class III · 51.9" },
              ]}
              lines={[
                { id: "obs", label: "Observed", color: stationColor[station.id], values: chart.observed },
                { id: "pred", label: "Predicted", color: "#0A3D3A", values: chart.predicted, dashed: true },
              ]}
            />
          )}
          <ul className="trust-row">
            <li>
              Confidence <strong>{Math.round(station.confidence * 100)}%</strong>
            </li>
            <li>
              Recall, polluted classes <strong>{Math.round(station.recallPolluted * 100)}%</strong>
            </li>
            <li>Validation on held-out field samples, n=28. No synthetic rows.</li>
          </ul>
          {anomalies.length > 0 && (
            <p className="flag-note">
              Anomaly: DO fell by more than 1.2 mg/L on {anomalies.map((point) => formatDate(point.date)).join(", ")}.
            </p>
          )}
        </article>

        <article className="card">
          <p className="eyebrow">Why this forecast</p>
          <h2>Feature influence</h2>
          <ul className="shap">
            {station.shap.map((item) => (
              <li key={item.name}>
                <span>{item.name}</span>
                <span className="shap-track">
                  <span style={{ width: `${item.weight * 100}%` }} />
                </span>
                <strong>{Math.round(item.weight * 100)}%</strong>
              </li>
            ))}
          </ul>
          <p className="meta-line">Illustrative SHAP-style weights for this design view.</p>
          <h3>DO against NH₃-N</h3>
          <Scatter points={station.series.map((point) => ({ x: point.nh3, y: point.do }))} />
          <p className="meta-line">Temperature versus chlorophyll-a will replace this once those readings exist.</p>
        </article>
      </div>

      <div className="action-bar">
        <button type="button" className="btn" onClick={() => setMetadataOpen(true)}>
          Sampling & methods
        </button>
        <button type="button" className="btn" onClick={() => void share()}>
          Copy share link
        </button>
        <button type="button" className="btn" onClick={() => setReportOpen(true)}>
          Executive report
        </button>
        <button type="button" className="btn primary" onClick={() => toggleCompare(station.id)}>
          {compareIds.includes(station.id) ? "Remove from compare" : "Add to compare"}
        </button>
      </div>

      <article className="card alerts">
        <header className="card-head">
          <div>
            <p className="eyebrow">Alerts</p>
            <h2>Tell campus management, without a flood of mail</h2>
          </div>
        </header>
        <label className="check">
          <input
            type="checkbox"
            checked={rules.classDrop}
            onChange={(event) => setRules((current) => ({ ...current, classDrop: event.target.checked }))}
          />
          <span>Email when this station drops an NWQS class</span>
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={rules.lowDo}
            onChange={(event) => setRules((current) => ({ ...current, lowDo: event.target.checked }))}
          />
          <span>Email when DO falls below 5 mg/L or NH₃-N / COD spike</span>
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={rules.digest}
            onChange={(event) => setRules((current) => ({ ...current, digest: event.target.checked }))}
          />
          <span>Send one daily digest instead of instant messages</span>
        </label>
      </article>

      {metadataOpen && (
        <div className="modal-back" role="presentation" onClick={() => setMetadataOpen(false)}>
          <aside className="drawer" role="dialog" aria-label="Sampling metadata" onClick={(event) => event.stopPropagation()}>
            <header>
              <h2>Audit trail</h2>
              <button type="button" onClick={() => setMetadataOpen(false)}>
                Close
              </button>
            </header>
            <dl>
              <div>
                <dt>Coordinates</dt>
                <dd>{station.coords}</dd>
              </div>
              <div>
                <dt>Sampled</dt>
                <dd>{formatDate(station.lastSample)} · {station.method}</dd>
              </div>
              <div>
                <dt>Replicates</dt>
                <dd>{station.replicates} · merged before WQI</dd>
              </div>
              <div>
                <dt>Collector</dt>
                <dd>{station.collector}</dd>
              </div>
              <div>
                <dt>Instruments</dt>
                <dd>{station.instruments}</dd>
              </div>
              <div>
                <dt>Lab methods</dt>
                <dd>{station.labMethods}</dd>
              </div>
              <div>
                <dt>Rainfall, prior 48 h</dt>
                <dd>{station.rainfallMm} mm</dd>
              </div>
              <div>
                <dt>QA/QC</dt>
                <dd>{station.qaqc === "pass" ? "Passed" : station.qaqc === "fail" ? "Failed" : "Gap in the record"}</dd>
              </div>
              <div>
                <dt>Visibility</dt>
                <dd>{station.sensitive ? "Restricted" : station.embargo ? "Embargoed until publication" : "Shareable inside the project"}</dd>
              </div>
            </dl>
          </aside>
        </div>
      )}

      {reportOpen && (
        <div className="modal-back" role="presentation" onClick={() => setReportOpen(false)}>
          <article className="report" role="dialog" aria-label="Executive report preview" onClick={(event) => event.stopPropagation()}>
            <p className="eyebrow">Campus briefing · one page</p>
            <h2>
              {station.name} is Class {station.klass}
            </h2>
            <p>
              WQI {station.wqi.toFixed(1)}. {station.dragging}. Latest sample {formatDate(station.lastSample)}, after {station.rainfallMm} mm of rain.
            </p>
            <p>The figure a facilities manager needs: dissolved oxygen {station.params.do} mg/L against the Class II line at 5 mg/L.</p>
            <button type="button" className="btn" onClick={() => setReportOpen(false)}>
              Close preview
            </button>
          </article>
        </div>
      )}
    </section>
  );
}

function Scatter({ points }: { points: { x: number; y: number }[] }) {
  const width = 280;
  const height = 160;
  const pad = 16;
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return (
    <svg className="scatter" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Scatter of dissolved oxygen against ammoniacal nitrogen">
      {points.map((point, index) => {
        const x = pad + ((point.x - minX) / (maxX - minX || 1)) * (width - pad * 2);
        const y = height - pad - ((point.y - minY) / (maxY - minY || 1)) * (height - pad * 2);
        return <circle key={index} cx={x} cy={y} r="4" fill="#0F6E67" />;
      })}
    </svg>
  );
}
