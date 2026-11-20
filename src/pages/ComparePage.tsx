import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ClassMark, LineChart } from "../components/Charts";
import { FLOW_PATH, stationColor, stations } from "../data/mock";
import type { SamplePoint, Station } from "../data/types";
import { downloadText, formatDate } from "../lib/format";
import { useApp } from "../state";

type Metric = "wqi" | "do" | "nh3" | "cod";
type View = Metric | "all";

type MetricMeta = {
  label: string;
  full: string;
  unit: string;
  min: number;
  max: number;
  better: "higher" | "lower";
  thresholds: { value: number; label: string }[];
};

const METRIC_ORDER: Metric[] = ["wqi", "do", "nh3", "cod"];

const METRICS: Record<Metric, MetricMeta> = {
  wqi: {
    label: "WQI",
    full: "Water Quality Index",
    unit: "index",
    min: 30,
    max: 100,
    better: "higher",
    thresholds: [
      { value: 76.5, label: "Class II · 76.5" },
      { value: 51.9, label: "Class III · 51.9" },
    ],
  },
  do: {
    label: "DO",
    full: "Dissolved oxygen",
    unit: "mg/L",
    min: 0,
    max: 10,
    better: "higher",
    thresholds: [
      { value: 5, label: "Class II · 5 mg/L" },
      { value: 3, label: "Class III · 3 mg/L" },
    ],
  },
  nh3: {
    label: "NH₃-N",
    full: "Ammoniacal nitrogen",
    unit: "mg/L",
    min: 0,
    max: 1.5,
    better: "lower",
    thresholds: [
      { value: 0.3, label: "Class II · 0.3 mg/L" },
      { value: 0.9, label: "Class III · 0.9 mg/L" },
    ],
  },
  cod: {
    label: "COD",
    full: "Chemical oxygen demand",
    unit: "mg/L",
    min: 0,
    max: 90,
    better: "lower",
    thresholds: [
      { value: 25, label: "Class II · 25 mg/L" },
      { value: 50, label: "Class III · 50 mg/L" },
    ],
  },
};

const VIEW_OPTIONS: { key: View; label: string }[] = [
  ...METRIC_ORDER.map((metric) => ({ key: metric as View, label: METRICS[metric].label })),
  { key: "all", label: "All four" },
];

function mean(values: number[]): number {
  if (values.length === 0) return Number.NaN;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values: number[]): number {
  if (values.length === 0) return Number.NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function metricValue(point: SamplePoint | undefined, metric: Metric): number | null {
  if (!point) return null;
  const value = metric === "wqi" ? point.wqi : metric === "do" ? point.do : metric === "nh3" ? point.nh3 : point.cod;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function formatNumber(value: number): string {
  return Number.isFinite(value) ? value.toFixed(1) : "—";
}

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthLabel(iso: string): string {
  const month = Number(iso.slice(5, 7)) - 1;
  return MONTH_LABELS[month] + " " + iso.slice(2, 4);
}

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
}

function saveBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

type StationStats = {
  station: Station;
  byDate: Map<string, SamplePoint>;
  values: number[];
  missing: string[];
  mean: number;
  median: number;
  min: number;
  max: number;
  monsoon: number;
  dry: number;
  transition: number;
};

function statsFor(station: Station, metric: Metric, timeline: string[]): StationStats {
  const byDate = new Map(station.series.map((point) => [point.date, point]));
  const values: number[] = [];
  timeline.forEach((date) => {
    const value = metricValue(byDate.get(date), metric);
    if (value != null) values.push(value);
  });
  const seasonMean = (season: SamplePoint["season"]) => {
    const seasonValues = station.series
      .filter((point) => point.season === season)
      .map((point) => metricValue(point, metric))
      .filter((value): value is number => value != null);
    return mean(seasonValues);
  };
  return {
    station,
    byDate,
    values,
    missing: timeline.filter((date) => !byDate.has(date)),
    mean: mean(values),
    median: median(values),
    min: values.length ? Math.min(...values) : Number.NaN,
    max: values.length ? Math.max(...values) : Number.NaN,
    monsoon: seasonMean("Monsoon"),
    dry: seasonMean("Dry"),
    transition: seasonMean("Transition"),
  };
}

export function ComparePage() {
  const { compareIds, toggleCompare, setCompare, toast } = useApp();
  const [view, setView] = useState<View>("all");
  const [searchParams, setSearchParams] = useSearchParams();
  const didInit = useRef(false);

  const chosen = useMemo(
    () =>
      compareIds
        .map((id) => stations.find((station) => station.id === id))
        .filter((station): station is Station => Boolean(station)),
    [compareIds],
  );

  // Open a shared link such as /compare?stations=GB-01,GB-04,VL-01 in the same order.
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    const raw = searchParams.get("stations");
    if (!raw) return;
    const ids = raw
      .split(",")
      .map((id) => id.trim())
      .filter((id) => stations.some((station) => station.id === id));
    if (ids.length > 0) setCompare(ids);
  }, [searchParams, setCompare]);

  // Keep the address bar in sync so the comparison can be bookmarked or shared.
  useEffect(() => {
    const next = compareIds.join(",");
    const current = searchParams.get("stations") ?? "";
    if (next === current) return;
    const params = new URLSearchParams(searchParams);
    if (next) params.set("stations", next);
    else params.delete("stations");
    setSearchParams(params, { replace: true });
  }, [compareIds, searchParams, setSearchParams]);

  const timeline = useMemo(() => {
    const dates = new Set<string>();
    chosen.forEach((station) => station.series.forEach((point) => dates.add(point.date)));
    return Array.from(dates).sort();
  }, [chosen]);

  const seriesMaps = useMemo(
    () =>
      new Map(
        chosen.map((station) => [station.id, new Map(station.series.map((point) => [point.date, point]))]),
      ),
    [chosen],
  );

  const labels = useMemo(() => timeline.map((date) => monthLabel(date)), [timeline]);

  const tableView: Metric = view === "all" ? "wqi" : view;
  const rows = useMemo(
    () => chosen.map((station) => statsFor(station, tableView, timeline)),
    [chosen, tableView, timeline],
  );

  const coverage = useMemo(
    () =>
      chosen.map((station) => {
        const dates = new Set(station.series.map((point) => point.date));
        return { station, dates, missing: timeline.filter((date) => !dates.has(date)) };
      }),
    [chosen, timeline],
  );

  const buildLines = (metric: Metric) =>
    chosen.map((station) => {
      const byDate = seriesMaps.get(station.id);
      return {
        id: station.id,
        label: station.id,
        color: stationColor[station.id],
        values: timeline.map((date) => metricValue(byDate?.get(date), metric)),
      };
    });

  const coverageColumns = "150px repeat(" + Math.max(timeline.length, 1) + ", minmax(0, 1fr)) 68px";

  const copyLink = async () => {
    const ids = compareIds.join(",");
    const url = window.location.origin + "/compare" + (ids ? "?stations=" + ids : "");
    try {
      await navigator.clipboard.writeText(url);
      toast("Share link copied. It reopens this exact comparison.");
      return;
    } catch {
      // Clipboard API can be blocked outside a secure context; fall back to the old selection trick.
    }
    const area = document.createElement("textarea");
    area.value = url;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "-1000px";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch {
      copied = false;
    }
    area.remove();
    toast(copied ? "Share link copied. It reopens this exact comparison." : "Share this link: " + url);
  };

  const downloadCsv = () => {
    const header = [
      "station_id",
      "station_name",
      "station_role",
      "water_body",
      "metric",
      "unit",
      "shared_dates",
      "n_samples",
      "first_date",
      "last_date",
      "mean",
      "median",
      "min",
      "max",
      "monsoon_mean",
      "dry_mean",
      "transition_mean",
      "missing_dates",
      "completeness_pct",
      "nwqs_class",
    ];
    const lines: string[] = [header.join(",")];
    chosen.forEach((station) => {
      METRIC_ORDER.forEach((metric) => {
        const stats = statsFor(station, metric, timeline);
        lines.push(
          [
            station.id,
            station.name,
            station.role,
            station.waterBody,
            METRICS[metric].label,
            METRICS[metric].unit,
            timeline.length,
            stats.values.length,
            timeline[0] ?? "",
            timeline[timeline.length - 1] ?? "",
            formatNumber(stats.mean),
            formatNumber(stats.median),
            formatNumber(stats.min),
            formatNumber(stats.max),
            formatNumber(stats.monsoon),
            formatNumber(stats.dry),
            formatNumber(stats.transition),
            stats.missing.map((date) => formatDate(date)).join(" "),
            station.completeness,
            station.klass,
          ]
            .map(csvCell)
            .join(","),
        );
      });
    });
    downloadText("waterpedia-comparison.csv", "\uFEFF" + lines.join("\n"), "text/csv;charset=utf-8");
    toast("Comparison table downloaded: " + chosen.length + " stations × 4 parameters.");
  };

  const downloadPng = async () => {
    const host = document.getElementById("compare-chart");
    if (!host) return;
    const svgs = Array.from(host.querySelectorAll<SVGSVGElement>("svg.chart"));
    if (svgs.length === 0) return;

    const width = 1180;
    const headerHeight = 48;
    const headingHeight = 22;
    const gap = 12;
    const exportMetrics = view === "all" ? METRIC_ORDER : [view];
    const titles = exportMetrics.map(
      (metric) =>
        METRICS[metric].label +
        " (" +
        METRICS[metric].unit +
        ") · " +
        (METRICS[metric].better === "higher" ? "higher is better" : "lower is better"),
    );

    const panels = svgs.map((svg) => {
      const box = svg.viewBox.baseVal;
      return { svg, width: box.width, height: box.height };
    });
    const totalHeight =
      headerHeight + panels.reduce((sum, panel) => sum + headingHeight + panel.height + gap, 0) - gap + 8;

    let y = headerHeight;
    let body = "";
    panels.forEach((panel, index) => {
      const title = titles[index] ?? "";
      body +=
        '<text x="10" y="' +
        (y + 15) +
        '" font-family="Segoe UI, Arial, sans-serif" font-size="12" font-weight="600" fill="#14221f">' +
        escapeXml(title) +
        "</text>";
      y += headingHeight;
      body += '<g transform="translate(0 ' + y + ')">' + panel.svg.innerHTML + "</g>";
      y += panel.height + gap;
    });

    const subtitle =
      chosen.map((station) => station.id).join(" · ") +
      " — " +
      timeline.length +
      " sampling dates, " +
      formatDate(timeline[0]) +
      " to " +
      formatDate(timeline[timeline.length - 1]);

    const styleLines = [
      ".chart-grid{stroke:#e7dfd0}",
      ".chart-tick{fill:#5d6b66;font-size:11px;font-family:'Segoe UI',Arial,sans-serif}",
      ".chart-threshold{stroke:#b4332a;stroke-dasharray:4 4}",
      ".chart-threshold-label{fill:#b4332a;font-size:11px;font-family:'Segoe UI',Arial,sans-serif;paint-order:stroke;stroke:#fffdf8;stroke-width:3px;stroke-linejoin:round}",
    ];

    const svgLines = [
      '<svg xmlns="http://www.w3.org/2000/svg" width="' +
        width +
        '" height="' +
        totalHeight +
        '" viewBox="0 0 ' +
        width +
        " " +
        totalHeight +
        '">',
      '<rect width="100%" height="100%" fill="#fffdf8"/>',
      "<style>" + styleLines.join("\n") + "</style>",
      '<text x="10" y="22" font-family="Segoe UI, Arial, sans-serif" font-size="15" font-weight="600" fill="#14221f">waterpedia UM · multi-point comparison</text>',
      '<text x="10" y="38" font-family="Segoe UI, Arial, sans-serif" font-size="10.5" fill="#5d6b66">' +
        escapeXml(subtitle) +
        "</text>",
      body,
      "</svg>",
    ];
    const svgText = svgLines.join("\n");

    try {
      const svgBlob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);
      const image = new Image();
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("svg render failed"));
        image.src = url;
      });
      const scale = 2;
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(totalHeight * scale);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("canvas unavailable");
      context.fillStyle = "#fffdf8";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.scale(scale, scale);
      context.drawImage(image, 0, 0, width, totalHeight);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        if (!blob) return;
        saveBlob("waterpedia-comparison.png", blob);
        toast("Chart exported as a 2× PNG for reports and slides.");
      }, "image/png");
    } catch {
      toast("The chart could not be exported. Try a screenshot instead.");
    }
  };

  const loadFlowPath = () => {
    setCompare(FLOW_PATH);
    setView("all");
    toast("Flow path loaded: " + FLOW_PATH.length + " points, upstream wetland to downstream lake.");
  };

  const loadWaterBody = (body: Station["waterBody"]) => {
    setCompare(stations.filter((station) => station.waterBody === body).map((station) => station.id));
  };

  const wetland = stations.filter((station) => station.waterBody === "UM Green Belt wetland");
  const lake = stations.filter((station) => station.waterBody === "Varsity Lake");
  const lastIndex = chosen.length - 1;

  return (
    <section className="page">
      <div className="page-intro">
        <div>
          <p className="eyebrow">Page 3 · multi-point &amp; flow-path comparison</p>
          <h1>Compare stations</h1>
          <p className="lede">
            Follow water from the Green Belt wetland into Varsity Lake, or line up any campus points on one shared
            timeline. Every chart, season average, and export below uses the same selected stations.
          </p>
        </div>
        <div className="compare-actions">
          <button type="button" className="btn" onClick={copyLink} disabled={chosen.length === 0}>
            Copy share link
          </button>
          <button type="button" className="btn primary" onClick={loadFlowPath}>
            Load flow path
          </button>
        </div>
      </div>

      <article className="card selector-card">
        <header className="card-head">
          <div>
            <p className="eyebrow">Multi-station selector</p>
            <h2>Flow path &amp; sample points</h2>
          </div>
          <div className="preset-row">
            <button type="button" className="btn" onClick={() => loadWaterBody("UM Green Belt wetland")}>
              Wetland only
            </button>
            <button type="button" className="btn" onClick={() => loadWaterBody("Varsity Lake")}>
              Lake only
            </button>
            <button type="button" className="btn" onClick={() => setCompare([])} disabled={chosen.length === 0}>
              Clear
            </button>
          </div>
        </header>

        {chosen.length > 0 ? (
          <ol className="flow-lane" aria-label="Selected points in comparison order">
            {chosen.map((station, index) => (
              <li className="flow-item" key={station.id}>
                {index > 0 && (
                  <span className="flow-arrow" aria-hidden="true">
                    →
                  </span>
                )}
                <span className="flow-step" style={{ borderColor: stationColor[station.id] + "66" }}>
                  <span className="flow-index">{index + 1}</span>
                  <button
                    type="button"
                    onClick={() => toggleCompare(station.id)}
                    aria-label={"Remove " + station.id + " from the comparison"}
                    title="Remove from comparison"
                  >
                    <i style={{ background: stationColor[station.id] }} />
                    <b>{station.id}</b>
                    <small>{station.role}</small>
                    <span className="flow-remove" aria-hidden="true">
                      ×
                    </span>
                  </button>
                  {index === 0 && <em className="flow-tag">upstream</em>}
                  {index === lastIndex && index > 0 && <em className="flow-tag">downstream</em>}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="hint">No points selected yet. Pick two or more below, or load the flow-path preset.</p>
        )}

        <div className="picker-grid">
          <section className="picker-group">
            <header>
              <h3>UM Green Belt wetland</h3>
              <span>Upstream · treatment cells</span>
            </header>
            <div className="chip-row">
              {wetland.map((station) => {
                const on = compareIds.includes(station.id);
                return (
                  <button
                    key={station.id}
                    type="button"
                    className={"chip" + (on ? " is-on" : "")}
                    aria-pressed={on}
                    onClick={() => toggleCompare(station.id)}
                    title={
                      station.name +
                      " · NWQS Class " +
                      station.klass +
                      " · " +
                      station.completeness +
                      "% complete"
                    }
                  >
                    <i style={{ background: stationColor[station.id] }} />
                    {station.id}
                    <small>{station.short}</small>
                  </button>
                );
              })}
            </div>
          </section>
          <section className="picker-group">
            <header>
              <h3>Varsity Lake</h3>
              <span>Downstream · lake basins</span>
            </header>
            <div className="chip-row">
              {lake.map((station) => {
                const on = compareIds.includes(station.id);
                return (
                  <button
                    key={station.id}
                    type="button"
                    className={"chip" + (on ? " is-on" : "")}
                    aria-pressed={on}
                    onClick={() => toggleCompare(station.id)}
                    title={
                      station.name +
                      " · NWQS Class " +
                      station.klass +
                      " · " +
                      station.completeness +
                      "% complete"
                    }
                  >
                    <i style={{ background: stationColor[station.id] }} />
                    {station.id}
                    <small>{station.short}</small>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
        <p className="hint">
          The flow preset orders points from the wetland inlet to the south basin. Click a point again to remove it;
          the order of the selected points is preserved in the charts, the table, and the exports.
        </p>
      </article>

      {chosen.length < 2 ? (
        <div className="card empty-card">
          <h2>Pick at least two stations</h2>
          <p>
            A comparison needs two or more points. Use the chips above, or load the flow-path preset to jump straight
            to the wetland-to-lake sequence.
          </p>
          <div className="card-actions">
            <button type="button" className="btn primary" onClick={loadFlowPath}>
              Load flow path · {FLOW_PATH.length} points
            </button>
            <button type="button" className="btn" onClick={() => setCompare(["GB-01", "VL-01"])}>
              Compare inlet → lake inlet
            </button>
          </div>
        </div>
      ) : (
        <>
          <article className="card">
            <header className="card-head">
              <div>
                <p className="eyebrow">
                  {chosen.length} stations · {timeline.length} sampling dates · one timeline
                </p>
                <h2>Synchronised overlay</h2>
              </div>
              <div className="segmented" role="group" aria-label="Parameter shown in the overlay">
                {VIEW_OPTIONS.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    aria-pressed={view === option.key}
                    onClick={() => setView(option.key)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </header>

            <div id="compare-chart" className="chart-stack">
              {(view === "all" ? METRIC_ORDER : [view]).map((metric) => (
                <section className="metric-panel" key={metric}>
                  <div className="metric-head">
                    <strong>
                      {METRICS[metric].label} <span>· {METRICS[metric].full}</span>
                    </strong>
                    <span>
                      {METRICS[metric].unit} ·{" "}
                      {METRICS[metric].better === "higher" ? "higher is better" : "lower is better"}
                    </span>
                  </div>
                  <LineChart
                    labels={labels}
                    lines={buildLines(metric)}
                    min={METRICS[metric].min}
                    max={METRICS[metric].max}
                    thresholds={METRICS[metric].thresholds}
                    width={1180}
                    height={view === "all" ? 168 : 300}
                  />
                </section>
              ))}
            </div>

            <ul className="inline-legend">
              {chosen.map((station) => (
                <li key={station.id}>
                  <i style={{ background: stationColor[station.id] }} />
                  <Link className="legend-id" to={"/station/" + station.id}>
                    {station.id}
                  </Link>
                  <span className="legend-name">{station.name}</span>
                </li>
              ))}
            </ul>
            <p className="chart-note">
              Dashed red lines are DOE NWQS Class II and Class III limits, so a crossing shows exactly where water
              quality degrades. Units differ between parameters, so each panel keeps its own y-axis while sharing the
              same x-axis and dates.
            </p>

            <div className="card-actions">
              <button type="button" className="btn" onClick={downloadPng}>
                Download chart PNG · 2×
              </button>
              <button type="button" className="btn" onClick={downloadCsv}>
                Download comparison CSV
              </button>
              <span className="hint">
                PNG is publication-ready; the CSV opens in Excel with one row per station and parameter.
              </span>
            </div>
          </article>

          <article className="card">
            <header className="card-head">
              <div>
                <p className="eyebrow">Data completeness alignment</p>
                <h2>Shared sampling window</h2>
              </div>
              <p className="window-pill">
                {formatDate(timeline[0])} → {formatDate(timeline[timeline.length - 1])}
              </p>
            </header>

            <div className="coverage-scroll">
              <div className="coverage-row cov-head" style={{ gridTemplateColumns: coverageColumns }}>
                <span>Point</span>
                {timeline.map((date) => (
                  <span key={date}>{monthLabel(date)}</span>
                ))}
                <span>Samples</span>
              </div>
              {coverage.map(({ station, dates, missing }) => (
                <div className="coverage-row" key={station.id} style={{ gridTemplateColumns: coverageColumns }}>
                  <span className="cov-name">
                    {station.id}
                    <small>{station.completeness}% complete</small>
                  </span>
                  {timeline.map((date) =>
                    dates.has(date) ? (
                      <span
                        key={date}
                        className="cov-cell"
                        style={{ background: stationColor[station.id] }}
                        title={station.id + " · " + formatDate(date) + " · sampled"}
                      />
                    ) : (
                      <span
                        key={date}
                        className="cov-cell is-empty"
                        title={station.id + " · " + formatDate(date) + " · no sample"}
                      />
                    ),
                  )}
                  <span className="cov-count">
                    {timeline.length - missing.length}/{timeline.length}
                  </span>
                </div>
              ))}
            </div>

            <p className="cov-legend">
              <span>
                <i style={{ background: "var(--lagoon)" }} /> Sampled on that date
              </span>
              <span>
                <i style={{ background: "var(--card)", border: "1px dashed var(--line)" }} /> No sample · excluded from
                means
              </span>
            </p>

            <ul className="gap-list">
              {coverage
                .filter((item) => item.missing.length > 0)
                .map((item) => (
                  <li key={item.station.id}>
                    <strong>{item.station.id}</strong>
                    <span>
                      has no sample on {item.missing.map((date) => formatDate(date)).join(", ")} — {item.missing.length}{" "}
                      of {timeline.length} dates are excluded from its means and season averages.
                    </span>
                  </li>
                ))}
              {coverage.every((item) => item.missing.length === 0) && (
                <li>
                  <strong>Aligned</strong>
                  <span>Every selected point has a sample on all {timeline.length} shared dates.</span>
                </li>
              )}
            </ul>

            <p className="flag-note">
              BOD is not overlaid: BOD was not measured in November 2025 at any point, so it is left out of this
              comparison rather than compared on unequal footing. WQI, DO, NH₃-N and COD each have a value on all{" "}
              {timeline.length} dates for {coverage.filter((item) => item.missing.length === 0).length} of the{" "}
              {chosen.length} points.
            </p>
          </article>

          <article className="card card-flush">
            <header className="card-head">
              <div>
                <p className="eyebrow">Side-by-side statistics · {METRICS[tableView].label}</p>
                <h2>{METRICS[tableView].label} seasonal matrix</h2>
              </div>
              <p className="hint">
                Monsoon Nov–Mar · Dry Jun–Sep · Transition Apr–May &amp; Oct
                {view === "all" ? " · switch the overlay to change the parameter" : ""}
              </p>
            </header>
            <div className="table-scroll">
              <table className="compare-table">
                <thead>
                  <tr>
                    <th>Station</th>
                    <th>Class</th>
                    <th>n</th>
                    <th>Mean</th>
                    <th>Median</th>
                    <th>Min</th>
                    <th>Max</th>
                    <th>Monsoon</th>
                    <th>Dry</th>
                    <th>Transition</th>
                    <th>Δ upstream</th>
                    <th>Complete</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => {
                    const upstream = rows[0]?.mean ?? Number.NaN;
                    const delta = row.mean - upstream;
                    const good = METRICS[tableView].better === "higher" ? delta > 0 : delta < 0;
                    return (
                      <tr key={row.station.id}>
                        <td>
                          <Link to={"/station/" + row.station.id}>{row.station.id}</Link>
                          <small>{row.station.name}</small>
                        </td>
                        <td>
                          <ClassMark value={row.station.klass} />
                        </td>
                        <td className="num">{row.values.length}</td>
                        <td className="num">{formatNumber(row.mean)}</td>
                        <td className="num">{formatNumber(row.median)}</td>
                        <td className="num">{formatNumber(row.min)}</td>
                        <td className="num">{formatNumber(row.max)}</td>
                        <td className="num">{formatNumber(row.monsoon)}</td>
                        <td className="num">{formatNumber(row.dry)}</td>
                        <td className="num">{formatNumber(row.transition)}</td>
                        <td className={"num " + (index === 0 ? "" : good ? "delta-good" : "delta-bad")}>
                          {index === 0 ? <small>baseline</small> : (delta >= 0 ? "+" : "") + delta.toFixed(1)}
                        </td>
                        <td className="num">{row.station.completeness}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="table-note">
              Means and season averages use only dates where that point has a measurement, so a point with missing
              months is never padded with zeros. Δ upstream compares each mean with the first point in the sequence —
              useful for reading the flow path from the wetland to the lake.
            </p>
          </article>
        </>
      )}
    </section>
  );
}
