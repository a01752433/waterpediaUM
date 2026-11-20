import { useState } from "react";
import { ChevronDown, Download, X } from "lucide-react";
import type { Station } from "../../data/types";
import { downloadText, formatDate, formatMonth } from "../../lib/format";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

type Horizon = "48h" | "7d" | "season";

const CORE = [
  { key: "ph", label: "pH", unit: "" },
  { key: "do", label: "DO", unit: "mg/L" },
  { key: "bod", label: "BOD", unit: "mg/L" },
  { key: "cod", label: "COD", unit: "mg/L" },
  { key: "nh3n", label: "NH₃-N", unit: "mg/L" },
  { key: "tss", label: "TSS", unit: "mg/L" },
] as const;

function csvCell(value: string | number | null) {
  if (value == null) return "";
  const text = String(value);
  if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function downloadStation(station: Station) {
  const latest = [
    ["station_id", station.id],
    ["name", station.name],
    ["water_body", station.waterBody],
    ["nwqs_class", station.klass],
    ["previous_class", station.previousClass],
    ["wqi", station.wqi],
    ["last_sample", station.lastSample],
    ["ph", station.params.ph],
    ["do_mg_l", station.params.do],
    ["bod_mg_l", station.params.bod],
    ["cod_mg_l", station.params.cod],
    ["nh3n_mg_l", station.params.nh3n],
    ["tss_mg_l", station.params.tss],
    ["total_phosphorus_mg_l", station.params.tp],
    ["nitrate_mg_l", station.params.nitrate],
    ["phosphate_mg_l", station.params.phosphate],
    ["chlorophyll_a_ug_l", station.params.chla],
    ["metals", station.params.metals],
  ];
  const seriesHeader = ["date", "season", "wqi", "do_mg_l", "bod_mg_l", "cod_mg_l", "nh3n_mg_l"];
  const series = station.series.map((point) =>
    [point.date, point.season, point.wqi, point.do, point.bod, point.cod, point.nh3].map(csvCell).join(","),
  );
  const body = [
    "field,value",
    ...latest.map(([field, value]) => `${csvCell(field)},${csvCell(value)}`),
    "",
    seriesHeader.join(","),
    ...series,
  ].join("\n");
  downloadText(`${station.id}-samples.csv`, body, "text/csv");
}

export function StationDetail({ station, onClose }: { station: Station; onClose: () => void }) {
  const [horizon, setHorizon] = useState<Horizon>("48h");
  const [parametersOpen, setParametersOpen] = useState(false);
  const oxygenLow = station.params.do < 5;
  const nh3High = station.params.nh3n > 0.3;
  const monsoon = station.series.filter((point) => point.season === "Monsoon");
  const dry = station.series.filter((point) => point.season === "Dry");
  const avg = (points: { wqi: number }[]) =>
    points.length ? points.reduce((sum, point) => sum + point.wqi, 0) / points.length : 0;

  return (
    <aside className="pointer-events-auto absolute inset-y-0 right-0 flex w-[min(420px,100%)] flex-col border-l border-white/10 bg-[#0c1020]/95 shadow-[0_0_40px_rgba(0,0,0,0.45)] backdrop-blur-md">
      <div className="map-scroll flex-1 overflow-auto px-5 py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="m-0 text-3xl leading-none font-semibold tracking-tight text-white">{station.name}</h2>
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white/80">Station {station.id}</span>
            </div>
            <p className="m-0 mt-2 text-sm text-white/55">
              {station.waterBody} · Kuala Lumpur
            </p>
            <p className="m-0 mt-1 text-sm leading-snug text-white/70">{station.dragging}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="grid size-9 shrink-0 place-items-center rounded-full border border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
          <Badge variant={oxygenLow ? "alert" : "calm"} className="px-3 py-1.5 text-sm">
            {oxygenLow ? `Oxygen alert (${station.subindex.do}%)` : `Class ${station.klass}`}
          </Badge>
          <Button type="button" className="h-10 px-4" onClick={() => downloadStation(station)}>
            <Download className="size-4" /> Download
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <Tile label="DOE WQI" value={station.wqi.toFixed(1)} note={`Class ${station.klass}`} good={station.klass === "I" || station.klass === "II"} />
          <Tile
            label="Dissolved O₂"
            value={station.params.do.toFixed(1)}
            unit="mg/L"
            note={oxygenLow ? "Below Class II · 5 mg/L" : "Class II limit 5 mg/L"}
            good={!oxygenLow}
          />
          <Tile
            label="NH₃-N"
            value={station.params.nh3n.toFixed(2)}
            unit="mg/L"
            note={nh3High ? "Above Class II" : "Within Class II"}
            good={!nh3High}
          />
        </div>

        <button
          type="button"
          aria-expanded={parametersOpen}
          onClick={() => setParametersOpen((open) => !open)}
          className="mt-4 flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#12142b] px-4 py-3 text-left text-sm text-white/85"
        >
          <span>View all parameters</span>
          <ChevronDown className={`size-4 shrink-0 transition-transform ${parametersOpen ? "rotate-180" : ""}`} />
        </button>

        {parametersOpen && (
          <div className="mt-2 space-y-3 rounded-2xl border border-white/10 bg-[#101326] px-4 py-4">
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {CORE.map((item) => {
                const reading = station.params[item.key];
                const score = station.subindex[item.key];
                return (
                  <li key={item.key}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="text-white/70">{item.label}</span>
                      <span className="font-semibold text-white">
                        {reading == null ? "—" : reading}
                        {reading != null && item.unit ? <span className="ml-1 text-xs font-medium text-white/45">{item.unit}</span> : null}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-[#8b7cff]" style={{ width: `${score ?? 0}%` }} />
                    </div>
                    <p className="m-0 mt-1 text-xs text-white/45">{score == null ? "Sub-index blocked" : `Sub-index ${score}`}</p>
                  </li>
                );
              })}
            </ul>
            <div className="border-t border-white/10 pt-3">
              <p className="m-0 text-xs font-medium tracking-wide text-white/45 uppercase">Nutrients and chlorophyll-a</p>
              <ul className="m-0 mt-2 flex list-none flex-col gap-1.5 p-0 text-sm text-white/75">
                <li className="flex justify-between"><span>Total phosphorus</span><span>{station.params.tp ?? "—"} mg/L</span></li>
                <li className="flex justify-between"><span>Nitrate</span><span>{station.params.nitrate ?? "—"} mg/L</span></li>
                <li className="flex justify-between"><span>Phosphate</span><span>{station.params.phosphate ?? "—"} mg/L</span></li>
                <li className="flex justify-between"><span>Chlorophyll-a</span><span>{station.params.chla ?? "—"} µg/L</span></li>
              </ul>
            </div>
            <p className="m-0 text-sm leading-snug text-white/55">Temperature and turbidity are not in this dataset.</p>
            <p className="m-0 text-sm leading-snug text-white/55">
              {station.params.metals ?? "Metals are recorded at the lab effluent only."}
            </p>
            <p className="m-0 text-xs text-white/40">Surface samples · {formatDate(station.lastSample)}</p>
          </div>
        )}

        <div className="mt-4 rounded-2xl border border-white/10 bg-[#101326] px-4 py-4">
          <p className="m-0 text-lg font-semibold text-white">Observed WQI</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(
              [
                ["48h", "48h"],
                ["7d", "7d"],
                ["season", "Season"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                aria-pressed={horizon === key}
                onClick={() => setHorizon(key)}
                className={`inline-flex h-7 items-center rounded-full border px-2.5 text-xs font-medium ${
                  horizon === key
                    ? "border-[#8b7cff] bg-[#6d4dff] text-white"
                    : "border-white/15 bg-transparent text-white/70"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {horizon === "season" ? (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <SeasonMean label="Monsoon mean WQI" value={avg(monsoon)} count={monsoon.length} when="Nov–Mar" />
              <SeasonMean label="Dry mean WQI" value={avg(dry)} count={dry.length} when="Jun–Sep" />
            </div>
          ) : (
            <ObservedWqi values={station.series.map((point) => point.wqi)} dates={station.series.map((point) => point.date)} />
          )}

          <p className="m-0 mt-3 text-sm leading-snug text-white/60">
            {horizon === "season" ? "Monsoon and dry means from measured samples." : "Measured samples. A forecast needs continuous data."}
          </p>
          <p className="m-0 mt-1 text-xs text-white/45">
            Confidence {Math.round(station.confidence * 100)}% · polluted-class recall {Math.round(station.recallPolluted * 100)}%
          </p>
        </div>
      </div>
    </aside>
  );
}

function Tile({
  label,
  value,
  unit,
  note,
  good,
}: {
  label: string;
  value: string;
  unit?: string;
  note: string;
  good: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#12142b] px-2.5 py-3">
      <p className="m-0 text-[11px] leading-tight font-medium text-white/55">{label}</p>
      <p className="m-0 mt-1.5 text-xl leading-none font-semibold text-white">
        {value}
        {unit ? <span className="ml-0.5 text-[10px] font-medium text-white/45">{unit}</span> : null}
      </p>
      <p className={`m-0 mt-2 text-[11px] leading-tight ${good ? "text-emerald-300" : "text-[#f0a05a]"}`}>{note}</p>
    </div>
  );
}

function SeasonMean({ label, value, count, when }: { label: string; value: number; count: number; when: string }) {
  return (
    <div className="rounded-xl bg-[#12142b] px-3 py-3">
      <p className="m-0 text-xs text-white/50">{label}</p>
      <p className="m-0 mt-1 text-2xl font-semibold text-white">{count ? value.toFixed(1) : "—"}</p>
      <p className="m-0 mt-1 text-xs text-white/40">
        {count} samples · {when}
      </p>
    </div>
  );
}

function ObservedWqi({ values, dates }: { values: number[]; dates: string[] }) {
  if (values.length < 2) return null;
  const width = 360;
  const height = 148;
  const pad = 16;
  const min = Math.min(48, ...values);
  const max = Math.max(90, ...values);
  const span = max - min || 1;
  const xAt = (index: number) => pad + (index / (values.length - 1)) * (width - pad * 2);
  const yAt = (value: number) => pad + ((max - value) / span) * (height - pad * 2);
  const line = values.map((value, index) => `${index === 0 ? "M" : "L"}${xAt(index).toFixed(1)},${yAt(value).toFixed(1)}`).join(" ");
  const ticks = [
    { value: 76.5, label: "Class II" },
    { value: 51.9, label: "Class III" },
  ];
  const marks = [0, Math.floor(values.length / 2), values.length - 1];

  return (
    <div className="mt-3">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-36 w-full" role="img" aria-label="Observed WQI">
        {ticks.map((tick) => (
          <g key={tick.label}>
            <line x1={pad} x2={width - pad} y1={yAt(tick.value)} y2={yAt(tick.value)} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4" />
            <text x={width - pad} y={yAt(tick.value) - 4} textAnchor="end" fill="rgba(255,255,255,0.45)" fontSize="10">
              {tick.label}
            </text>
          </g>
        ))}
        <path d={line} fill="none" stroke="#8b7cff" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={xAt(values.length - 1)} cy={yAt(values[values.length - 1])} r="4" fill="#c4b5fd" />
      </svg>
      <div className="flex justify-between text-xs text-white/40">
        {marks.map((index) => (
          <span key={dates[index]}>{formatMonth(dates[index])}</span>
        ))}
      </div>
    </div>
  );
}
