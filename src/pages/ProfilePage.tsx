import { useMemo, useState } from "react";
import { HistoryMap } from "../components/map/HistoryMap";
import { stations } from "../data/mock";
import type { NwqsClass } from "../data/types";
import { formatDate } from "../lib/format";

type Sample = {
  date: string;
  stationId: string;
  stationName: string;
  waterBody: string;
  coords: string;
  wqi: number;
  do: number;
  bod: number | null;
  cod: number;
  nh3: number;
};

const CLASS_COLOR: Record<NwqsClass, string> = {
  I: "#3b82f6",
  II: "#34d399",
  III: "#f5c451",
  IV: "#f08a3c",
  V: "#ef5350",
};

const samples: Sample[] = stations
  .flatMap((station) =>
    station.series.map((point) => ({
      date: point.date,
      stationId: station.id,
      stationName: station.name,
      waterBody: station.waterBody,
      coords: station.coords,
      wqi: point.wqi,
      do: point.do,
      bod: point.bod,
      cod: point.cod,
      nh3: point.nh3,
    })),
  )
  .sort((a, b) => b.date.localeCompare(a.date) || a.stationId.localeCompare(b.stationId));

function monthKey(iso: string) {
  return iso.slice(0, 7);
}

function monthLabel(key: string) {
  return new Date(`${key}-01T00:00:00`).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

function mean(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function wqiClass(wqi: number): NwqsClass {
  if (wqi >= 92.7) return "I";
  if (wqi >= 76.5) return "II";
  if (wqi >= 51.9) return "III";
  if (wqi >= 31) return "IV";
  return "V";
}

export function ProfilePage() {
  const reports = useMemo(() => {
    const groups = new Map<string, Sample[]>();
    for (const sample of samples) {
      const key = monthKey(sample.date);
      groups.set(key, [...(groups.get(key) ?? []), sample]);
    }
    return [...groups.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, rows]) => {
        const lowest = [...rows].sort((a, b) => a.do - b.do)[0];
        return {
          key,
          label: monthLabel(key),
          count: rows.length,
          wqi: mean(rows.map((row) => row.wqi)),
          oxygen: mean(rows.map((row) => row.do)),
          lowest,
          missingBod: rows.some((row) => row.bod == null),
        };
      });
  }, []);

  const [month, setMonth] = useState(reports[0]?.key ?? "");
  const [selectedId, setSelectedId] = useState<string | null>(reports[0]?.lowest.stationId ?? null);
  const monthSamples = samples.filter((sample) => monthKey(sample.date) === month);
  const report = reports.find((item) => item.key === month);

  const pins = stations.map((station) => {
    const sample = monthSamples.find((item) => item.stationId === station.id);
    return { id: station.id, coords: station.coords, klass: sample ? wqiClass(sample.wqi) : null };
  });

  const chooseMonth = (key: string) => {
    setMonth(key);
    const rows = samples.filter((sample) => monthKey(sample.date) === key);
    const lowest = [...rows].sort((a, b) => a.do - b.do)[0];
    setSelectedId(lowest?.stationId ?? null);
  };

  return (
    <section className="min-h-[calc(100vh-5rem)] bg-[#f4f2fb] px-5 py-5 text-[#1e2433] md:px-8">
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-4">
        <header className="flex flex-wrap items-center gap-4 rounded-3xl bg-white px-5 py-4 shadow-[0_10px_30px_rgba(36,20,86,0.06)]">
          <span className="grid size-12 place-items-center rounded-full bg-[#6d4dff] text-base font-semibold text-white">FD</span>
          <div>
            <h1 className="m-0 text-2xl font-semibold tracking-tight">Firdaus</h1>
            <p className="m-0 mt-0.5 text-sm text-[#6d6780]">UM scientist · Sep 2025 – Nov 2026</p>
          </div>
          <p className="m-0 ml-auto text-sm text-[#4c4660]">
            <strong className="text-xl font-semibold text-[#1e2433]">{samples.length}</strong> samples
          </p>
        </header>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {reports.map((item) => (
            <button
              key={item.key}
              type="button"
              aria-pressed={month === item.key}
              onClick={() => chooseMonth(item.key)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium ${
                month === item.key ? "border-[#6d4dff] bg-[#6d4dff] text-white" : "border-[#e4e1ef] bg-white text-[#4c4660]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {report && (
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Mean WQI" value={report.wqi.toFixed(1)} />
            <Stat label="Mean DO" value={`${report.oxygen.toFixed(1)} mg/L`} />
            <Stat label="Lowest DO" value={`${report.lowest.do.toFixed(1)} · ${report.lowest.stationId}`} />
          </div>
        )}

        <div className="grid items-start gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="overflow-hidden rounded-3xl bg-white shadow-[0_10px_30px_rgba(36,20,86,0.06)]">
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <h2 className="m-0 text-base font-semibold">Tasik Varsiti · {monthLabel(month)}</h2>
              <div className="flex flex-wrap gap-2 text-xs text-[#6d6780]">
                {(["I", "II", "III", "IV", "V"] as const).map((item) => (
                  <span key={item} className="inline-flex items-center gap-1">
                    <i className="size-2 rounded-full" style={{ background: CLASS_COLOR[item] }} />
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="relative z-0 h-[420px] [&_.leaflet-container]:z-0">
              <HistoryMap pins={pins} selectedId={selectedId} onSelect={setSelectedId} />
            </div>
          </article>

          <div className="flex max-h-[520px] flex-col gap-2 overflow-auto pr-1">
            {monthSamples.map((sample) => {
              const klass = wqiClass(sample.wqi);
              const selected = selectedId === sample.stationId;
              return (
                <button
                  key={sample.stationId}
                  type="button"
                  onClick={() => setSelectedId(sample.stationId)}
                  className={`rounded-2xl border bg-white px-4 py-3 text-left shadow-[0_8px_20px_rgba(36,20,86,0.04)] ${
                    selected ? "border-[#6d4dff]" : "border-transparent"
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span>
                      <span className="block text-sm font-semibold">
                        {sample.stationId}
                        <span className="ml-2 font-normal text-[#6d6780]">{sample.stationName}</span>
                      </span>
                      <span className="mt-0.5 block text-xs text-[#6d6780]">
                        {sample.waterBody} · {formatDate(sample.date)}
                      </span>
                    </span>
                    <span
                      className="rounded-full px-2.5 py-1 text-xs font-semibold"
                      style={{ background: CLASS_COLOR[klass], color: klass === "III" ? "#2a2110" : "white" }}
                    >
                      {klass} · {sample.wqi.toFixed(1)}
                    </span>
                  </span>
                  <span className="mt-2 grid grid-cols-4 gap-2 text-xs text-[#4c4660]">
                    <Metric name="DO" value={sample.do.toFixed(1)} />
                    <Metric name="BOD" value={sample.bod == null ? "—" : sample.bod.toFixed(1)} />
                    <Metric name="COD" value={sample.cod.toFixed(0)} />
                    <Metric name="NH₃-N" value={sample.nh3.toFixed(2)} />
                  </span>
                </button>
              );
            })}
            {report?.missingBod && <p className="m-0 px-1 text-xs text-[#8a5a2a]">BOD was not measured this month, so WQI for those rows is incomplete.</p>}
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white px-4 py-3 shadow-[0_8px_20px_rgba(36,20,86,0.04)]">
      <p className="m-0 text-xs text-[#6d6780]">{label}</p>
      <p className="m-0 mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}

function Metric({ name, value }: { name: string; value: string }) {
  return (
    <span className="rounded-xl bg-[#f6f4fb] px-2 py-1.5">
      <span className="block text-[10px] text-[#6d6780]">{name}</span>
      <span className="font-semibold text-[#1e2433]">{value}</span>
    </span>
  );
}
