import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ClassMark, LineChart } from "../components/Charts";
import { FLOW_PATH, stationColor, stations } from "../data/mock";
import type { Station } from "../data/types";
import { downloadText, formatMonth } from "../lib/format";
import { useApp } from "../state";

type Metric = "wqi" | "do" | "nh3" | "cod";

const metricMeta: Record<Metric, { label: string; min: number; max: number; thresholds: { value: number; label: string }[] }> = {
  wqi: {
    label: "WQI",
    min: 30,
    max: 100,
    thresholds: [
      { value: 76.5, label: "Class II" },
      { value: 51.9, label: "Class III" },
    ],
  },
  do: { label: "DO mg/L", min: 0, max: 10, thresholds: [{ value: 5, label: "5 mg/L" }] },
  nh3: { label: "NH₃-N mg/L", min: 0, max: 2, thresholds: [] },
  cod: { label: "COD mg/L", min: 0, max: 90, thresholds: [] },
};

function mean(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function metricValue(station: Station, metric: Metric, index: number) {
  const point = station.series[index];
  if (!point) return null;
  if (metric === "wqi") return point.wqi;
  if (metric === "do") return point.do;
  if (metric === "nh3") return point.nh3;
  return point.cod;
}

export function ComparePage() {
  const { compareIds, toggleCompare, setCompare } = useApp();
  const [metric, setMetric] = useState<Metric>("do");
  const chosen = stations.filter((station) => compareIds.includes(station.id));
  const labels = useMemo(() => {
    const longest = chosen.reduce((best, station) => (station.series.length > best.length ? station.series : best), chosen[0]?.series ?? []);
    return longest.map((point) => formatMonth(point.date));
  }, [chosen]);

  const lines = chosen.map((station) => ({
    id: station.id,
    label: station.id,
    color: stationColor[station.id],
    values: labels.map((_, index) => metricValue(station, metric, index)),
  }));

  const downloadTable = () => {
    const header = ["station_id", "mean", "median", "min", "max", "monsoon_mean", "dry_mean", "completeness_pct"];
    const rows = chosen.map((station) => {
      const values = station.series.map((point) =>
        metric === "wqi" ? point.wqi : metric === "do" ? point.do : metric === "nh3" ? point.nh3 : point.cod,
      );
      const sorted = [...values].sort((a, b) => a - b);
      const median = sorted.length === 0 ? 0 : sorted[Math.floor(sorted.length / 2)];
      const season = (name: "Monsoon" | "Dry") =>
        mean(
          station.series
            .filter((point) => point.season === name)
            .map((point) => (metric === "wqi" ? point.wqi : metric === "do" ? point.do : metric === "nh3" ? point.nh3 : point.cod)),
        );
      return [station.id, mean(values).toFixed(2), median.toFixed(2), Math.min(...values).toFixed(2), Math.max(...values).toFixed(2), season("Monsoon").toFixed(2), season("Dry").toFixed(2), String(station.completeness)];
    });
    downloadText("waterpedia-comparison.csv", [header.join(","), ...rows.map((row) => row.join(","))].join("\n"), "text/csv");
  };

  const downloadChart = () => {
    const svg = document.querySelector("#compare-chart svg");
    if (!svg) return;
    downloadText("waterpedia-comparison.svg", svg.outerHTML, "image/svg+xml");
  };

  return (
    <section className="page">
      <div className="page-intro">
        <div>
          <p className="eyebrow">Page 3 · flow path</p>
          <h1>Compare stations</h1>
          <p className="lede">
            Follow water from the Green Belt wetland into Varsity Lake, or line up any campus points on one timeline.
          </p>
        </div>
        <button type="button" className="btn primary" onClick={() => setCompare(FLOW_PATH)}>
          Load flow path
        </button>
      </div>

      <div className="chip-row" aria-label="Stations in this comparison">
        {stations.map((station) => {
          const on = compareIds.includes(station.id);
          return (
            <button key={station.id} type="button" className={`chip ${on ? "is-on" : ""}`} onClick={() => toggleCompare(station.id)}>
              <i style={{ background: stationColor[station.id] }} />
              {station.id}
              <small>{station.short}</small>
            </button>
          );
        })}
      </div>

      {chosen.length < 2 ? (
        <div className="card empty-card">
          <h2>Pick at least two stations</h2>
          <p>Or load the flow-path preset. It orders points from the wetland inlet to the south basin.</p>
        </div>
      ) : (
        <>
          <article className="card">
            <header className="card-head">
              <div>
                <p className="eyebrow">{chosen.length} stations · shared timeline</p>
                <h1>{metricMeta[metric].label}</h1>
              </div>
              <div className="segmented compact">
                {(Object.keys(metricMeta) as Metric[]).map((key) => (
                  <button key={key} type="button" aria-pressed={metric === key} onClick={() => setMetric(key)}>
                    {metricMeta[key].label}
                  </button>
                ))}
              </div>
            </header>
            <div id="compare-chart">
              <LineChart
                labels={labels}
                lines={lines}
                min={metricMeta[metric].min}
                max={metricMeta[metric].max}
                thresholds={metricMeta[metric].thresholds}
              />
            </div>
            <ul className="inline-legend">
              {chosen.map((station) => (
                <li key={station.id}>
                  <i style={{ background: stationColor[station.id] }} />
                  <Link to={`/station/${station.id}`}>{station.id}</Link>
                  {station.name}
                </li>
              ))}
            </ul>
            <p className="flag-note">November 2025 is kept in the WQI view, but BOD was not measured that month, so BOD comparisons should leave it out.</p>
            <div className="card-actions">
              <button type="button" className="btn" onClick={downloadChart}>
                Download chart SVG
              </button>
              <button type="button" className="btn" onClick={downloadTable}>
                Download comparison CSV
              </button>
            </div>
          </article>

          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>Station</th>
                  <th>Class</th>
                  <th>Mean</th>
                  <th>Median</th>
                  <th>Min</th>
                  <th>Max</th>
                  <th>Monsoon</th>
                  <th>Dry</th>
                  <th>Complete</th>
                </tr>
              </thead>
              <tbody>
                {chosen.map((station) => {
                  const values = station.series.map((point) =>
                    metric === "wqi" ? point.wqi : metric === "do" ? point.do : metric === "nh3" ? point.nh3 : point.cod,
                  );
                  const sorted = [...values].sort((a, b) => a - b);
                  const season = (name: "Monsoon" | "Dry") =>
                    mean(
                      station.series
                        .filter((point) => point.season === name)
                        .map((point) => (metric === "wqi" ? point.wqi : metric === "do" ? point.do : metric === "nh3" ? point.nh3 : point.cod)),
                    );
                  return (
                    <tr key={station.id}>
                      <td>
                        <Link to={`/station/${station.id}`}>{station.id}</Link>
                        <small>{station.name}</small>
                      </td>
                      <td>
                        <ClassMark value={station.klass} />
                      </td>
                      <td className="num">{mean(values).toFixed(1)}</td>
                      <td className="num">{sorted[Math.floor(sorted.length / 2)].toFixed(1)}</td>
                      <td className="num">{Math.min(...values).toFixed(1)}</td>
                      <td className="num">{Math.max(...values).toFixed(1)}</td>
                      <td className="num">{season("Monsoon").toFixed(1)}</td>
                      <td className="num">{season("Dry").toFixed(1)}</td>
                      <td className="num">{station.completeness}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
