import { useState } from "react";
import { uploadPreview } from "../data/mock";
import type { QaStatus, UploadRow } from "../data/types";
import { useApp } from "../state";

const flagOptions: Array<UploadRow["flag"]> = ["Verified", "Suspect", "Missing", "Merge"];

export function UploadPage() {
  const { toast } = useApp();
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<UploadRow[]>([]);
  const [embargo, setEmbargo] = useState(true);
  const [restrict, setRestrict] = useState(true);
  const [approved, setApproved] = useState(false);
  const [license, setLicense] = useState("Campus internal");

  const loadSample = () => {
    setFileName("varsity-lake-field-log-nov-2026.xlsx");
    setRows(uploadPreview);
  };

  const onFile = (file: File | undefined) => {
    if (!file) return;
    setFileName(file.name);
    setRows(uploadPreview);
    toast("Showing the sample review so the QA screen stays visible");
  };

  const ready = rows.filter((row) => row.flag === "Verified").length;
  const blocked = rows.filter((row) => row.flag === "Missing").length;

  return (
    <section className="page upload-page">
      <div className="page-intro">
        <div>
          <p className="eyebrow">Ingestion</p>
          <h1>Upload, clean, score</h1>
          <p className="lede">
            Field logs and lab sheets come in messy. This screen merges triplicates, fixes units, and refuses to invent a WQI when one of the six DOE parameters is missing.
          </p>
        </div>
      </div>

      <div className="split upload-split">
        <div>
          <label
            className="dropzone"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              onFile(event.dataTransfer.files[0]);
            }}
          >
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(event) => onFile(event.target.files?.[0])}
            />
            <strong>Drop a CSV or Excel file</strong>
            <span>{fileName ?? "or browse. A sample campus batch is ready if you want to see the review."}</span>
          </label>
          <button type="button" className="btn" onClick={loadSample}>
            Load sample field log
          </button>

          <form className="card meta-form" onSubmit={(event) => event.preventDefault()}>
            <p className="eyebrow">Required with every batch</p>
            <h2>Methods and governance</h2>
            <label className="field">
              <span>Collector</span>
              <input defaultValue="A. Rahman" />
            </label>
            <label className="field">
              <span>Sampling method</span>
              <input defaultValue="Surface grab, triplicate" />
            </label>
            <label className="field">
              <span>Instrument and calibration</span>
              <input defaultValue="YSI ProDSS · 1 Nov 2026" />
            </label>
            <label className="field">
              <span>Lab methods</span>
              <input defaultValue="5-day BOD, closed reflux COD, Nessler NH₃-N" />
            </label>
            <label className="field">
              <span>Rainfall in the previous 48 h (mm)</span>
              <input defaultValue="18" />
            </label>
            <label className="field">
              <span>Data license</span>
              <select value={license} onChange={(event) => setLicense(event.target.value)}>
                <option>Campus internal</option>
                <option>CC BY 4.0 after embargo</option>
                <option>Restricted research</option>
              </select>
            </label>
            <label className="check">
              <input type="checkbox" checked={embargo} onChange={(event) => setEmbargo(event.target.checked)} />
              <span>Embargo until the thesis or paper is published</span>
            </label>
            <label className="check">
              <input type="checkbox" checked={restrict} onChange={(event) => setRestrict(event.target.checked)} />
              <span>Restrict sensitive points, including lab effluent</span>
            </label>
            <label className="check">
              <input type="checkbox" checked={approved} onChange={(event) => setApproved(event.target.checked)} />
              <span>Supervisor has approved this batch</span>
            </label>
          </form>
        </div>

        <article className="card review">
          <header className="card-head">
            <div>
              <p className="eyebrow">Pre-save review</p>
              <h2>{rows.length === 0 ? "Nothing to score yet" : `${rows.length} rows in this batch`}</h2>
            </div>
          </header>
          {rows.length === 0 ? (
            <p className="empty">Load the sample log to see merged triplicates, a missing BOD, and a suspect spike.</p>
          ) : (
            <>
              <ul className="trust-row">
                <li>
                  Ready <strong>{ready}</strong>
                </li>
                <li>
                  WQI blocked <strong>{blocked}</strong>
                </li>
                <li>Units harmonised to mg/L. Station code VL03 mapped to VL-03.</li>
              </ul>
              <div className="table-card flat">
                <table>
                  <thead>
                    <tr>
                      <th>Station</th>
                      <th>Date</th>
                      <th>DO</th>
                      <th>BOD</th>
                      <th>COD</th>
                      <th>WQI</th>
                      <th>Flag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id} className={`flag-${row.flag.toLowerCase()}`}>
                        <td>{row.stationId}</td>
                        <td>{row.date}</td>
                        <td className="num">{row.do}</td>
                        <td className="num">{row.bod || "—"}</td>
                        <td className="num">{row.cod}</td>
                        <td className="num">
                          {row.wqi}
                          <small>{row.klass}</small>
                        </td>
                        <td>
                          <select
                            value={row.flag}
                            onChange={(event) => {
                              const flag = event.target.value as QaStatus | "Merge";
                              setRows((current) => current.map((item) => (item.id === row.id ? { ...item, flag } : item)));
                            }}
                          >
                            {flagOptions.map((option) => (
                              <option key={option}>{option}</option>
                            ))}
                          </select>
                          <small>{row.note}</small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                type="button"
                className="btn primary"
                onClick={() =>
                  toast(
                    approved
                      ? "Design preview — this batch is not written to a database yet"
                      : "Add supervisor approval before saving",
                  )
                }
              >
                Save reviewed rows
              </button>
            </>
          )}
        </article>
      </div>
    </section>
  );
}
