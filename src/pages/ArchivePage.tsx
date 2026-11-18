import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ClassMark } from "../components/Charts";
import { DATASET_VERSION, MODEL_VERSION, archiveRows, bibtex, citation, pythonSnippet, stationById } from "../data/mock";
import type { QaStatus } from "../data/types";
import { copyText, downloadText, formatDate } from "../lib/format";
import { useApp } from "../state";

type Reading = "all" | "Lab" | "Probe";
type Visibility = "all" | "Public" | "Embargo" | "Restricted";

export function ArchivePage() {
  const { toast } = useApp();
  const [qa, setQa] = useState<"all" | QaStatus>("all");
  const [reading, setReading] = useState<Reading>("all");
  const [visibility, setVisibility] = useState<Visibility>("all");
  const [completeOnly, setCompleteOnly] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const rows = useMemo(
    () =>
      archiveRows.filter((row) => {
        if (qa !== "all" && row.qa !== qa) return false;
        if (reading !== "all" && row.reading !== reading) return false;
        if (visibility !== "all" && row.visibility !== visibility) return false;
        if (completeOnly && row.completeness < 90) return false;
        return true;
      }),
    [completeOnly, qa, reading, visibility],
  );

  const exportCsv = () => {
    const header = ["date", "station_id", "WQI", "NWQS_class", "pH", "DO_mg_L", "BOD_mg_L", "COD_mg_L", "NH3N_mg_L", "TSS_mg_L", "reading", "qa_qc", "visibility"];
    const body = rows.map((row) =>
      [row.date, row.stationId, row.wqi, row.klass, row.ph, row.do, row.bod ?? "", row.cod, row.nh3n, row.tss, row.reading, row.qa, row.visibility].join(","),
    );
    downloadText("waterpedia-archive.csv", [header.join(","), ...body].join("\n"), "text/csv");
  };

  const exportBundleNote = () => {
    const note = [
      `waterpedia UM research bundle`,
      `dataset ${DATASET_VERSION}`,
      `model ${MODEL_VERSION}`,
      `downloaded ${new Date().toISOString()}`,
      ``,
      `Contents in the full product:`,
      `1. Tidy time-series CSV`,
      `2. Station and lab-methods metadata`,
      `3. QA/QC audit log`,
      `4. This summary`,
      ``,
      citation,
    ].join("\n");
    downloadText("waterpedia-bundle-summary.txt", note, "text/plain");
  };

  return (
    <section className="page archive-page">
      <div className="page-intro">
        <div>
          <p className="eyebrow">Archive</p>
          <h1>Records, citations, API</h1>
          <p className="lede">
            Query the campus record, keep embargoed rows out of a public export, and copy a Python snippet that already applies the QA filter.
          </p>
        </div>
        <p className="version-pill">
          Data {DATASET_VERSION}
          <span>Model {MODEL_VERSION}</span>
        </p>
      </div>

      <div className="filter-bar">
        <label className="field">
          <span>QA/QC</span>
          <select value={qa} onChange={(event) => setQa(event.target.value as "all" | QaStatus)}>
            <option value="all">Any status</option>
            <option value="Verified">Verified</option>
            <option value="Suspect">Suspect</option>
            <option value="Missing">Missing</option>
          </select>
        </label>
        <label className="field">
          <span>Reading</span>
          <select value={reading} onChange={(event) => setReading(event.target.value as Reading)}>
            <option value="all">Lab and probe</option>
            <option value="Lab">Lab</option>
            <option value="Probe">Probe</option>
          </select>
        </label>
        <label className="field">
          <span>Visibility</span>
          <select value={visibility} onChange={(event) => setVisibility(event.target.value as Visibility)}>
            <option value="all">All</option>
            <option value="Public">Public</option>
            <option value="Embargo">Embargo</option>
            <option value="Restricted">Restricted</option>
          </select>
        </label>
        <label className="check">
          <input type="checkbox" checked={completeOnly} onChange={(event) => setCompleteOnly(event.target.checked)} />
          <span>Completeness 90% or better</span>
        </label>
        <div className="bar-actions">
          <button type="button" className="btn" onClick={exportCsv}>
            Tidy CSV
          </button>
          <button type="button" className="btn" onClick={() => toast("Excel and GeoJSON use the same filtered rows in the full product")}>
            Excel / GeoJSON
          </button>
          <button type="button" className="btn" onClick={exportBundleNote}>
            Research bundle
          </button>
        </div>
      </div>

      <div className="archive-layout">
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Station</th>
                <th>Class</th>
                <th>WQI</th>
                <th>DO</th>
                <th>BOD</th>
                <th>COD</th>
                <th>NH₃-N</th>
                <th>Reading</th>
                <th>QA</th>
                <th>Access</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const station = stationById(row.stationId);
                return (
                  <tr key={row.id}>
                    <td>{formatDate(row.date)}</td>
                    <td>
                      <Link to={`/station/${row.stationId}`}>{row.stationId}</Link>
                      <small>{station?.name}</small>
                    </td>
                    <td>
                      <ClassMark value={row.klass} />
                    </td>
                    <td className="num">{row.wqi.toFixed(1)}</td>
                    <td className="num">{row.do.toFixed(1)}</td>
                    <td className="num">{row.bod ?? "—"}</td>
                    <td className="num">{row.cod.toFixed(0)}</td>
                    <td className="num">{row.nh3n.toFixed(2)}</td>
                    <td>{row.reading}</td>
                    <td>{row.qa}</td>
                    <td>{row.visibility}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && <p className="empty">Nothing in the archive matches this filter.</p>}
          <p className="meta-line">{rows.length} rows in view · units are in the column names of the CSV</p>
        </div>

        <aside className="stack">
          <article className="card">
            <p className="eyebrow">Citation</p>
            <h2>Data availability</h2>
            <p className="citation">{citation}</p>
            <div className="card-actions">
              <button
                type="button"
                className="btn"
                onClick={() => {
                  void copyText(citation).then(() => toast("Data availability statement copied"));
                }}
              >
                Copy statement
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  void copyText(bibtex).then(() => toast("BibTeX copied"));
                }}
              >
                BibTeX
              </button>
            </div>
            <p className="meta-line">DOI shown here is a placeholder for the design.</p>
          </article>

          <article className="card">
            <p className="eyebrow">Python / REST</p>
            <h2>Pull the filtered set</h2>
            <p className="key-row">
              <code>{showKey ? "wpum_live_7f3a91c2k" : "wpum_live_•••••••2k"}</code>
              <button type="button" className="btn" onClick={() => setShowKey((current) => !current)}>
                {showKey ? "Hide" : "Show"}
              </button>
            </p>
            <pre className="snippet">{pythonSnippet}</pre>
            <button
              type="button"
              className="btn"
              onClick={() => {
                void copyText(pythonSnippet).then(() => toast("Python snippet copied"));
              }}
            >
              Copy snippet
            </button>
          </article>
        </aside>
      </div>
    </section>
  );
}
