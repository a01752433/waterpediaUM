import { useMemo, useState } from "react";
import { CloudUpload, Download, FileSpreadsheet, RefreshCw, X } from "lucide-react";
import { stations, uploadPreview } from "../data/mock";
import type { QaStatus, UploadRow, WaterBody } from "../data/types";
import { downloadText, formatDate } from "../lib/format";
import { useApp } from "../state";

const flagOptions: Array<UploadRow["flag"]> = ["Verified", "Suspect", "Missing", "Merge"];
const methods = ["Surface grab", "Field probe", "Lab assay"] as const;

const inputClass =
  "mt-1 h-10 w-full rounded-xl border border-[#e4e1ef] bg-white px-3 text-sm text-[#1e2433] outline-none focus-visible:ring-2 focus-visible:ring-[#6d4dff]";

export function UploadPage() {
  const { toast } = useApp();
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<UploadRow[]>([]);
  const [embargo, setEmbargo] = useState(true);
  const [restrict, setRestrict] = useState(true);
  const [approved, setApproved] = useState(false);
  const [body, setBody] = useState<WaterBody>("UM Green Belt wetland");
  const [stationId, setStationId] = useState("GB-04");
  const [method, setMethod] = useState<(typeof methods)[number]>("Surface grab");

  const bodyStations = stations.filter((station) => station.waterBody === body);
  const station = stations.find((item) => item.id === stationId) ?? bodyStations[0];
  const ready = rows.filter((row) => row.flag === "Verified").length;
  const blocked = rows.filter((row) => row.flag === "Missing").length;
  const merges = rows.filter((row) => row.flag === "Merge").length;
  const progress = rows.length ? Math.round((ready / rows.length) * 100) : 0;
  const sampleDate = useMemo(() => {
    const dates = rows.map((row) => row.date).filter(Boolean).sort();
    if (!dates.length) return null;
    const first = dates[0];
    const last = dates[dates.length - 1];
    return first === last ? formatDate(first) : `${formatDate(first)} – ${formatDate(last)}`;
  }, [rows]);

  const loadRows = (name: string) => {
    setFileName(name);
    setRows(uploadPreview);
    const first = stations.find((item) => item.id === uploadPreview[0]?.stationId);
    if (first) {
      setBody(first.waterBody);
      setStationId(first.id);
    }
  };

  const onFile = (file: File | undefined) => {
    if (!file) return;
    loadRows(file.name);
    toast("Showing the sample review so the QA screen stays visible");
  };

  const downloadTemplate = () => {
    const header = "station_id,date,ph,do_mg_l,bod_mg_l,cod_mg_l,nh3n_mg_l,tss_mg_l";
    downloadText("waterpedia-sample-template.csv", `${header}\n`, "text/csv");
  };

  const chooseBody = (next: WaterBody) => {
    setBody(next);
    const first = stations.find((item) => item.waterBody === next);
    if (first) setStationId(first.id);
  };

  return (
    <section className="min-h-[calc(100vh-4.5rem)] bg-[#f4f2fb] px-5 py-6 text-[#1e2433] md:px-8">
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-4">
        <header className="rounded-3xl bg-gradient-to-r from-[#241456] to-[#3a2380] px-6 py-6 text-white shadow-[0_16px_40px_rgba(36,20,86,0.25)] md:px-8">
          <div className="flex flex-wrap items-center gap-2 text-sm font-medium tracking-wide text-white/70 uppercase">
            <span>Campus water-quality ingest</span>
            <span className="rounded-full bg-white/15 px-3 py-1 text-sm tracking-normal text-white normal-case">Sample batch</span>
          </div>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-3xl">
              <h1 className="m-0 text-2xl font-semibold tracking-tight">Sample ingestion</h1>
              <p className="m-0 mt-2 max-w-2xl text-sm leading-snug text-white/75">
                Field and lab sheets for Varsity Lake and the Green Belt. WQI needs all six DOE inputs.
              </p>
            </div>
            <button
              type="button"
              onClick={downloadTemplate}
              className="inline-flex h-12 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 text-base font-medium text-white hover:bg-white/15"
            >
              <Download className="size-4" />
              Download template (.csv)
            </button>
          </div>
        </header>

        <div className="grid items-start gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="flex flex-col gap-4">
            <article className="rounded-3xl border border-white bg-white p-5 shadow-[0_10px_30px_rgba(36,20,86,0.06)]">
              <div className="flex items-center justify-between gap-3">
                <h2 className="m-0 flex items-center gap-2 text-base font-semibold">
                  <FileSpreadsheet className="size-4 text-[#6d4dff]" />
                  Data stream
                </h2>
                <span className="rounded-full bg-[#efeaff] px-3 py-1 text-sm font-medium text-[#6d4dff]">Automated QC</span>
              </div>

              <label
                className="mt-4 flex cursor-pointer flex-col items-center rounded-2xl border border-dashed border-[#d9d4ea] bg-[#faf9ff] px-6 py-10 text-center"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  onFile(event.dataTransfer.files[0]);
                }}
              >
                <input className="sr-only" type="file" accept=".csv,.xlsx,.xls" onChange={(event) => onFile(event.target.files?.[0])} />
                <span className="grid size-12 place-items-center rounded-full bg-[#efeaff] text-[#6d4dff]">
                  <CloudUpload className="size-5" />
                </span>
                <span className="mt-3 text-base font-semibold">Drop a CSV or Excel file</span>
                <span className="mt-1 text-sm text-[#6d6780]">or browse. The campus batch is ready to review.</span>
                <span className="mt-4 flex flex-wrap justify-center gap-2">
                  {["Field probe", "Lab sheet", "Excel log"].map((label) => (
                    <span key={label} className="rounded-full bg-white px-3.5 py-1.5 text-sm text-[#5c5672] shadow-sm">
                      {label}
                    </span>
                  ))}
                </span>
              </label>

              <button type="button" onClick={() => loadRows("varsity-lake-field-log-nov-2026.xlsx")} className="mt-3 border-0 bg-transparent p-0 text-base font-medium text-[#6d4dff]">
                Load sample field log
              </button>

              {fileName && (
                <div className="mt-4 rounded-2xl bg-[#f6f4fb] px-4 py-3">
                  <div className="flex items-start gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#6d4dff] text-white">
                      <FileSpreadsheet className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="m-0 truncate text-base font-semibold">{fileName}</p>
                      <p className="m-0 mt-0.5 text-sm text-[#6d6780]">
                        {rows.length} rows · triplicates merged before WQI
                      </p>
                    </div>
                    <button type="button" aria-label="Clear file" onClick={() => { setFileName(null); setRows([]); }} className="border-0 bg-transparent p-0 text-[#8b849c]">
                      <X className="size-4" />
                    </button>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#e4dff3]">
                    <div className="h-full rounded-full bg-[#6d4dff]" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="m-0 mt-1 text-right text-sm text-[#6d6780]">{progress}% verified</p>
                </div>
              )}
            </article>

            <article className="rounded-3xl border border-white bg-white p-5 shadow-[0_10px_30px_rgba(36,20,86,0.06)]">
              <h2 className="m-0 text-base font-semibold">Auto-validation summary</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <Summary label="Valid rows" value={String(ready)} />
                <Summary label="WQI blocked" value={String(blocked)} tone={blocked ? "warn" : "ok"} />
                <Summary label="Triplicates to merge" value={String(merges)} />
              </div>
            </article>

            {rows.length > 0 && (
              <article className="rounded-3xl border border-white bg-white p-5 shadow-[0_10px_30px_rgba(36,20,86,0.06)]">
                <h2 className="m-0 text-base font-semibold">Batch flags</h2>
                <ul className="m-0 mt-3 flex list-none flex-col gap-2 p-0">
                  {rows.map((row) => (
                    <li key={row.id} className="rounded-2xl bg-[#f6f4fb] px-3 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="m-0 text-base font-semibold">
                          {row.stationId}
                          <span className="ml-2 font-normal text-[#6d6780]">{formatDate(row.date)}</span>
                        </p>
                        <select
                          className="h-9 rounded-full border border-[#e4e1ef] bg-white px-3 text-sm"
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
                      </div>
                      <p className="m-0 mt-1 text-sm leading-snug text-[#6d6780]">{row.note}</p>
                    </li>
                  ))}
                </ul>
              </article>
            )}
          </div>

          <article className="rounded-3xl border border-white bg-white p-5 shadow-[0_10px_30px_rgba(36,20,86,0.06)]">
            <div className="flex items-center justify-between gap-3">
              <h2 className="m-0 text-base font-semibold">Station and sample metadata</h2>
              <RefreshCw className="size-4 text-[#8b849c]" />
            </div>

            <label className="mt-4 block text-sm font-medium text-[#4c4660]">
              Water body
              <select className={inputClass} value={body} onChange={(event) => chooseBody(event.target.value as WaterBody)}>
                <option value="UM Green Belt wetland">UM Green Belt wetland</option>
                <option value="Varsity Lake">Varsity Lake</option>
              </select>
            </label>

            <label className="mt-4 block text-sm font-medium text-[#4c4660]">
              Sampling station
              <select className={inputClass} value={station?.id ?? ""} onChange={(event) => setStationId(event.target.value)}>
                {bodyStations.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.id} · {item.name}
                  </option>
                ))}
              </select>
            </label>
            <p className="m-0 mt-1.5 text-sm text-[#6d6780]">{station ? station.coords : ""}</p>

            <p className="m-0 mt-4 text-sm font-medium text-[#4c4660]">Sampling method</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {methods.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={method === item}
                  onClick={() => setMethod(item)}
                  className={`h-9 rounded-full px-3 text-sm font-medium ${
                    method === item ? "bg-[#6d4dff] text-white" : "bg-[#f4f2fb] text-[#4c4660]"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            <label className="mt-4 block text-sm font-medium text-[#4c4660]">
              Sample date
              <input className={inputClass} readOnly value={sampleDate ?? "Load a file"} />
            </label>

            <p className="m-0 mt-4 text-sm font-medium text-[#4c4660]">QA review</p>
            <div className="mt-2 grid gap-2">
              <QaChoice
                pressed={!approved}
                title="Preliminary"
                detail="Review only. Missing inputs block WQI."
                onClick={() => setApproved(false)}
              />
              <QaChoice
                pressed={approved}
                title="Supervisor approved"
                detail="Needed before this preview can be confirmed."
                onClick={() => setApproved(true)}
              />
            </div>

            <label className="mt-3 flex items-start gap-2 text-sm text-[#3c3650]">
              <input type="checkbox" checked={embargo} onChange={(event) => setEmbargo(event.target.checked)} />
              Embargo until publication
            </label>
            <label className="mt-2 flex items-start gap-2 text-sm text-[#3c3650]">
              <input type="checkbox" checked={restrict} onChange={(event) => setRestrict(event.target.checked)} />
              Restrict the lab-effluent point
            </label>

            <p className="m-0 mt-4 rounded-2xl bg-[#fff7ee] px-3 py-2.5 text-sm leading-snug text-[#8a5a2a]">
              Surface samples only.
            </p>
            <button
              type="button"
              className="mt-4 h-11 w-full rounded-full bg-[#6d4dff] text-base font-medium text-white"
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
          </article>
        </div>
      </div>
    </section>
  );
}

function Summary({ label, value, tone = "ok" }: { label: string; value: string; tone?: "ok" | "warn" }) {
  return (
    <div className="rounded-2xl bg-[#f6f4fb] px-4 py-3">
      <p className="m-0 text-sm font-medium tracking-wide text-[#6d6780] uppercase">{label}</p>
      <p className={`m-0 mt-1 text-2xl font-semibold ${tone === "warn" ? "text-[#e3873a]" : "text-[#1e2433]"}`}>{value}</p>
    </div>
  );
}

function QaChoice({
  pressed,
  title,
  detail,
  onClick,
}: {
  pressed: boolean;
  title: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`rounded-2xl border px-3 py-3 text-left ${pressed ? "border-[#6d4dff] bg-[#f7f4ff]" : "border-[#e4e1ef] bg-white"}`}
    >
      <span className="block text-sm font-semibold">{title}</span>
      <span className="mt-0.5 block text-xs leading-snug text-[#6d6780]">{detail}</span>
    </button>
  );
}
