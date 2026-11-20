import { useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, LocateFixed, Search, SlidersHorizontal } from "lucide-react";
import { ClassMark } from "../components/Charts";
import { CampusMap } from "../components/map/CampusMap";
import { StationDetail } from "../components/map/StationDetail";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import {
  FLOW_PATH,
  classDropped,
  doBelowClassII,
  stations,
} from "../data/mock";
import type { DataSource, NwqsClass, Station, WaterBody } from "../data/types";
import { formatDate, formatMonth } from "../lib/format";

type Range = "all" | "recent";

const CLASS_SWATCH: Record<NwqsClass, string> = {
  I: "#3b82f6",
  II: "#34d399",
  III: "#f5c451",
  IV: "#f08a3c",
  V: "#ef5350",
};

const BODY_SWATCH: Record<WaterBody, string> = {
  "UM Green Belt wetland": "#2dd4bf",
  "Varsity Lake": "#38bdf8",
};

const SOURCE_SWATCH: Record<DataSource, string> = {
  "Field sampling": "#a78bfa",
  "DOE secondary": "#fbbf24",
};

const fieldClass =
  "h-8 w-full rounded-full border border-white/15 bg-transparent px-3 text-xs text-white outline-none focus-visible:ring-2 focus-visible:ring-[#6d4dff]";

export function MapPage() {
  const [query, setQuery] = useState("");
  const [range, setRange] = useState<Range>("all");
  const [body, setBody] = useState<"all" | WaterBody>("all");
  const [klass, setKlass] = useState<"all" | NwqsClass>("all");
  const [source, setSource] = useState<"all" | DataSource>("all");
  const [parameter, setParameter] = useState<"wqi" | "do" | "nh3n">("wqi");
  const [lowDo, setLowDo] = useState(false);
  const [hideGaps, setHideGaps] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>("GB-04");
  const [focus, setFocus] = useState<string[] | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [frameToken, setFrameToken] = useState(0);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [layers, setLayers] = useState({
    catchment: true,
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
      if (klass !== "all" && station.klass !== klass) return false;
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

  const selected = stations.find((station) => station.id === selectedId) ?? visible[0] ?? null;
  const matchedIds = useMemo(() => new Set(visible.map((station) => station.id)), [visible]);
  const filterColor =
    klass !== "all"
      ? CLASS_SWATCH[klass]
      : lowDo
        ? "#e3873a"
        : body !== "all"
          ? BODY_SWATCH[body]
          : source !== "all"
            ? SOURCE_SWATCH[source]
            : null;
  const attention = visible.filter(
    (station) => classDropped(station) || doBelowClassII(station) || !station.fresh || station.qaqc === "fail",
  );

  const applyView = (name: "campus" | "low-do" | "flow") => {
    setQuery("");
    setRange("all");
    setKlass("all");
    setSource("all");
    setHideGaps(false);
    if (name === "campus") {
      setBody("all");
      setLowDo(false);
      setFocus(null);
      setSelectedId("GB-04");
      setLayers((current) => ({ ...current, catchment: true }));
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
    setFrameToken((token) => token + 1);
  };

  return (
    <section className="relative h-[calc(100vh-5rem)] overflow-hidden">
      <CampusMap
        stations={stations}
        boundary={stations}
        selectedId={selected?.id ?? null}
        onSelect={setSelectedId}
        layers={layers}
        showFlow={focus !== null}
        frameToken={frameToken}
        detailOpen={detailsOpen}
        filterColor={filterColor}
        matchedIds={matchedIds}
      />

      <div className="pointer-events-none absolute inset-0 z-[500]">
        <div className="pointer-events-auto absolute top-4 left-4 w-[min(440px,calc(100%-2rem))]">
          <div className="flex h-16 items-center rounded-full border border-white/10 bg-[#12152cf2] pr-2 pl-5 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-md">
            <Search className="size-5 shrink-0 text-white/50" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search stations"
              aria-label="Station lookup"
              className="h-full min-w-0 flex-1 border-0 bg-transparent px-3 text-lg text-white outline-none placeholder:text-white/40"
            />
            <button
              type="button"
              onClick={() => setFiltersOpen((open) => !open)}
              aria-pressed={filtersOpen}
              className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-base font-medium ${
                filtersOpen
                  ? "border-[#8b7cff] bg-[#6d4dff]/20 text-white"
                  : "border-white/15 bg-transparent text-white/80 hover:border-white/30 hover:text-white"
              }`}
            >
              <SlidersHorizontal className="size-5" />
              Filters
            </button>
          </div>
          <p className="mt-2 px-4 text-sm text-white/60">
            {visible.length} stations{focus ? " · flow path" : ""}
            {lowDo ? " · DO < 5 mg/L" : ""}
          </p>
        </div>

        {(!detailsOpen || filtersOpen) && (
        <div className="map-scroll pointer-events-auto absolute top-32 bottom-16 left-4 flex w-[min(440px,calc(100%-2rem))] flex-col gap-3 overflow-auto pr-1">
          {filtersOpen && (
            <Card className="space-y-2 rounded-3xl p-3">
              <div className="flex flex-wrap gap-1.5">
                {(["I", "II", "III", "IV", "V"] as const).map((item) => (
                  <FilterChip
                    key={item}
                    pressed={klass === item}
                    color={CLASS_SWATCH[item]}
                    onClick={() => setKlass((current) => (current === item ? "all" : item))}
                  >
                    {item}
                  </FilterChip>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                <FilterChip pressed={lowDo} color="#e3873a" onClick={() => setLowDo((current) => !current)}>
                  Low DO
                </FilterChip>
                <FilterChip
                  pressed={body === "UM Green Belt wetland"}
                  color={BODY_SWATCH["UM Green Belt wetland"]}
                  onClick={() => setBody((current) => (current === "UM Green Belt wetland" ? "all" : "UM Green Belt wetland"))}
                >
                  Wetland
                </FilterChip>
                <FilterChip
                  pressed={body === "Varsity Lake"}
                  color={BODY_SWATCH["Varsity Lake"]}
                  onClick={() => setBody((current) => (current === "Varsity Lake" ? "all" : "Varsity Lake"))}
                >
                  Lake
                </FilterChip>
                <FilterChip
                  pressed={source === "Field sampling"}
                  color={SOURCE_SWATCH["Field sampling"]}
                  onClick={() => setSource((current) => (current === "Field sampling" ? "all" : "Field sampling"))}
                >
                  Field
                </FilterChip>
                <FilterChip
                  pressed={source === "DOE secondary"}
                  color={SOURCE_SWATCH["DOE secondary"]}
                  onClick={() => setSource((current) => (current === "DOE secondary" ? "all" : "DOE secondary"))}
                >
                  DOE
                </FilterChip>
                <FilterChip pressed={hideGaps} onClick={() => setHideGaps((current) => !current)}>
                  Hide gaps
                </FilterChip>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <select className={`${fieldClass} w-auto`} value={range} onChange={(event) => setRange(event.target.value as Range)} aria-label="Date range">
                  <option value="all">Sep 2025 – Nov 2026</option>
                  <option value="recent">Last 30 days</option>
                </select>
                {(
                  [
                    ["wqi", "WQI"],
                    ["do", "DO"],
                    ["nh3n", "NH₃-N"],
                  ] as const
                ).map(([key, label]) => (
                  <FilterChip key={key} pressed={parameter === key} onClick={() => setParameter(key)}>
                    {label}
                  </FilterChip>
                ))}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 border-t border-white/10 pt-2 text-xs">
                {(
                  [
                    ["catchment", "Catchment"],
                    ["land", "Land use"],
                    ["outlets", "Outlets"],
                    ["rain", "Rainfall"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 text-white/80">
                    <input
                      type="checkbox"
                      checked={layers[key]}
                      onChange={(event) => setLayers((current) => ({ ...current, [key]: event.target.checked }))}
                    />
                    {label}
                  </label>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5 border-t border-white/10 pt-2">
                <Button type="button" size="sm" variant="outline" onClick={() => applyView("campus")}>
                  Campus points
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => applyView("flow")}>
                  Wetland → lake
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => applyView("low-do")}>
                  Low DO
                </Button>
              </div>
            </Card>
          )}

          {!detailsOpen &&
            (selected ? (
              <StationCard station={selected} onOpenDetails={() => setDetailsOpen(true)} />
            ) : (
              <Card className="p-5 text-sm text-white/60">No stations match these filters.</Card>
            ))}

          {!detailsOpen && attention.length > 0 && (
            <Card className="rounded-3xl p-4">
              <p className="text-left text-lg font-semibold text-[#b7a6ff]">Needs a look · {attention.length}</p>
              <ul className="mt-3 flex list-none flex-col gap-2 pl-0">
                {attention.map((station) => (
                  <li key={station.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(station.id)}
                      className="flex w-full items-center gap-3 rounded-xl border-0 bg-[#12142b] px-3 py-3 text-left text-sm whitespace-nowrap hover:bg-[#241f45]"
                    >
                      <ClassMark value={station.klass} />
                      <strong>{station.id}</strong>
                      <span className="text-white/70">
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
            </Card>
          )}
        </div>
        )}

        {detailsOpen && selected && <StationDetail station={selected} onClose={() => setDetailsOpen(false)} />}

        {layers.rain && (
          <div
            className={`pointer-events-none absolute rounded-full bg-[#14172cf2] px-3 py-2 text-sm text-white/80 ${
              detailsOpen ? "top-24 left-4" : "top-4 right-4"
            }`}
          >
            18 mm · last 36 hours
          </div>
        )}

        <div className={`pointer-events-auto absolute ${detailsOpen ? "bottom-28 left-4" : "right-4 bottom-36"}`}>
          <button
            type="button"
            onClick={() => setFrameToken((token) => token + 1)}
            className="grid size-10 place-items-center rounded-xl border border-white/10 bg-[#16182e] text-white shadow-lg"
            aria-label="Frame sampling points"
          >
            <LocateFixed className="size-4" />
          </button>
        </div>

        <ul
          className={`pointer-events-none absolute bottom-4 flex flex-wrap gap-x-3 gap-y-1 rounded-full bg-[#14172ccc] px-3 py-2 text-xs text-white/75 ${
            detailsOpen
              ? "left-16 max-w-[calc(100%-420px-5rem)]"
              : "left-4 max-w-[calc(100%-7rem)] md:left-[640px] md:max-w-[calc(100%-640px-4.5rem)] xl:left-[760px] xl:max-w-[calc(100%-760px-4.5rem)]"
          }`}
        >
          {(["I", "II", "III", "IV", "V"] as const).map((item) => (
            <li key={item} className="inline-flex items-center gap-1.5">
              <i className={`swatch class-${item}`} /> Class {item}
            </li>
          ))}
          <li className="inline-flex items-center gap-1.5">
            <i className="swatch stale" /> No recent sample
          </li>
          <li className="inline-flex items-center gap-1.5">
            <i className="swatch alert" /> Class dropped
          </li>
        </ul>
      </div>
    </section>
  );
}

function FilterChip({
  pressed,
  onClick,
  color,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  color?: string;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium ${
        pressed ? "border-[#8b7cff] bg-[#6d4dff] text-white" : "border-white/15 bg-transparent text-white/75"
      }`}
    >
      {color ? <i className="size-2 rounded-full" style={{ background: color }} /> : null}
      {children}
    </button>
  );
}

function StationCard({ station, onOpenDetails }: { station: Station; onOpenDetails: () => void }) {
  const latest = station.series.at(-1);
  const previous = station.series.at(-2);
  const doDelta = latest && previous && previous.do !== 0 ? ((latest.do - previous.do) / previous.do) * 100 : null;
  const oxygenAlert = doBelowClassII(station) || classDropped(station) || station.trend === "worsening" || station.qaqc === "fail";
  const alertTitle = classDropped(station)
    ? `Class ${station.previousClass} dropped to ${station.klass}`
    : station.qaqc === "fail"
      ? "QA/QC failed on the latest sample"
      : station.trend === "worsening"
        ? "Water quality is decreasing"
        : "Dissolved oxygen is below Class II";
  const months = [station.series[0], station.series[Math.floor(station.series.length / 2)], station.series.at(-1)].filter(
    (point): point is NonNullable<typeof point> => Boolean(point),
  );

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm text-white/55">
            <span className={`size-2 rounded-full ${station.fresh ? "bg-emerald-400" : "bg-white/30"}`} />
            Station {station.id}
          </p>
          <h2 className="mt-1 text-3xl leading-none font-semibold tracking-tight">{station.name}</h2>
          <p className="mt-2 text-base text-white/55">{station.waterBody} · Kuala Lumpur</p>
        </div>
        <Badge variant={oxygenAlert ? "alert" : "calm"} className="px-4 py-2 text-base">
          {doBelowClassII(station) ? `Oxygen ${station.subindex.do}%` : `Class ${station.klass}`}
        </Badge>
      </div>

      {oxygenAlert && (
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[#e3873a]/45 bg-[#e3873a]/14 px-3 py-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#e3873a] text-[#2a1608]">
            <AlertTriangle className="size-4" strokeWidth={2.5} />
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <p className="m-0 text-base leading-tight font-semibold text-white">{alertTitle}</p>
            <p className="m-0 text-sm leading-snug text-white/75">{station.dragging}</p>
            <p className="m-0 text-sm leading-snug text-white/50">Last sample {formatDate(station.lastSample)}</p>
          </div>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Metric
          label="Oxygen levels"
          value={station.params.do.toFixed(1)}
          unit="mg/L"
          note={
            doDelta == null
              ? "Class II limit 5 mg/L"
              : Math.abs(doDelta) < 1
                ? "Steady vs last sample"
                : `${doDelta > 0 ? "▲" : "▼"} ${Math.abs(doDelta).toFixed(0)}% vs last sample`
          }
          good={station.params.do >= 5 && (doDelta == null || doDelta >= -1)}
        />
        <Metric
          label="pH level"
          value={station.params.ph.toFixed(1)}
          unit=""
          note={station.params.ph >= 6 && station.params.ph <= 9 ? "Neutral" : "Outside 6–9"}
          good={station.params.ph >= 6 && station.params.ph <= 9}
        />
        <Metric
          label="NH₃-N"
          value={station.params.nh3n.toFixed(2)}
          unit="mg/L"
          note={station.params.nh3n <= 0.3 ? "Within Class II" : "Above Class II"}
          good={station.params.nh3n <= 0.3}
        />
        <Metric
          label="COD"
          value={station.params.cod.toFixed(0)}
          unit="mg/L"
          note={station.params.cod <= 25 ? "Within Class II" : "Above Class II"}
          good={station.params.cod <= 25}
        />
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-[#101326] px-4 py-4">
        <div className="flex items-center justify-between">
          <p className="text-xl font-semibold text-white">WQI trend</p>
          <p className="text-sm text-white/40">Class {station.klass} · {station.wqi.toFixed(1)}</p>
        </div>
        <WqiTrend values={station.series.map((point) => point.wqi)} tone={station.trend} />
        <div className="flex justify-between text-sm text-white/40">
          {months.map((point) => (
            <span key={point.date}>{formatMonth(point.date)}</span>
          ))}
        </div>
      </div>

      <Button type="button" className="mt-4 h-14 w-full text-lg" onClick={onOpenDetails}>
        View more details <ArrowRight className="size-5" />
      </Button>
    </Card>
  );
}

function Metric({
  label,
  value,
  unit,
  note,
  good,
}: {
  label: string;
  value: string;
  unit: string;
  note: string;
  good: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[#6d4dff]/25 bg-[#12142b] px-4 py-3">
      <p className="text-base font-medium text-white/70">{label}</p>
      <p className="mt-1.5 text-2xl leading-none font-semibold tracking-tight">
        {value}
        {unit && <span className="ml-1 text-sm font-medium text-white/45">{unit}</span>}
      </p>
      <p className={`mt-2 text-xs ${good ? "text-emerald-300" : "text-[#f0a05a]"}`}>{note}</p>
    </div>
  );
}

function WqiTrend({ values, tone }: { values: number[]; tone: Station["trend"] }) {
  if (values.length < 2) return null;
  const width = 320;
  const height = 120;
  const min = Math.min(...values) - 2;
  const max = Math.max(...values) + 2;
  const span = max - min || 1;
  const xAt = (index: number) => (index / (values.length - 1)) * width;
  const yAt = (value: number) => height - ((value - min) / span) * (height - 18) - 8;
  const line = values.map((value, index) => `${index === 0 ? "M" : "L"}${xAt(index).toFixed(1)},${yAt(value).toFixed(1)}`).join(" ");
  const area = `${line} L${width.toFixed(1)},${height} L0,${height} Z`;
  const color = tone === "worsening" ? "#f0a05a" : tone === "improving" ? "#34d399" : "#93c5fd";

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mt-2 h-36 w-full" role="img" aria-label="WQI trend">
      <path d={area} fill={color} opacity="0.18" />
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={xAt(values.length - 1)} cy={yAt(values[values.length - 1])} r="4.5" fill={color} />
    </svg>
  );
}
