import { useEffect } from "react";
import { MapContainer, Marker, Polygon, Polyline, TileLayer, useMap, ZoomControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { FLOW_PATH, classDropped } from "../../data/mock";
import type { Station } from "../../data/types";
import { parseCoords } from "../../lib/geo";

const CLASS_COLOR: Record<Station["klass"], string> = {
  I: "#3b82f6",
  II: "#34d399",
  III: "#f5c451",
  IV: "#f08a3c",
  V: "#ef5350",
};

type Layers = {
  catchment: boolean;
  land: boolean;
  outlets: boolean;
};

/** One month's reading per station, used by the time slider. */
export type MonthSnapshot = ReadonlyMap<string, { klass: Station["klass"]; sampled: boolean }>;

type CampusMapProps = {
  stations: Station[];
  boundary: Station[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  layers: Layers;
  showFlow: boolean;
  frameToken: number;
  detailOpen: boolean;
  filterColor: string | null;
  matchedIds: ReadonlySet<string>;
  snapshot?: MonthSnapshot | null;
};

function pinIcon(
  station: Station,
  selected: boolean,
  filterColor: string | null,
  matched: boolean,
  month?: { klass: Station["klass"]; sampled: boolean },
) {
  // When the time slider shows a past month, colour by that month's class instead of the latest one.
  const klass = month ? month.klass : station.klass;
  const hasSample = month ? month.sampled : station.fresh;
  const painted = Boolean(filterColor) && matched && !month;
  const dimmed = !matched;
  const color = dimmed ? "#94a3b8" : painted && filterColor ? filterColor : hasSample ? CLASS_COLOR[klass] : "transparent";
  const border = dimmed ? "#cbd5e1" : hasSample ? "white" : "#b7c0d6";
  const dot = dimmed ? 10 : painted ? (selected ? 20 : 16) : selected ? 18 : 14;
  const ring = dimmed
    ? "box-shadow:none;"
    : selected
      ? "box-shadow:0 0 0 4px rgba(196,181,253,0.95), 0 6px 16px rgba(0,0,0,.45);"
      : painted
        ? `box-shadow:0 0 0 4px ${filterColor}55, 0 4px 12px rgba(0,0,0,.4);`
        : "box-shadow:0 3px 8px rgba(0,0,0,.4);";
  const alert = !month && classDropped(station)
    ? `<span style="position:absolute;top:-1px;right:${selected ? 16 : 0}px;width:8px;height:8px;border-radius:99px;background:#ef4444;border:1.5px solid white"></span>`
    : "";
  const trend = station.trend === "improving" ? "↑" : station.trend === "worsening" ? "↓" : "→";
  const showLabel = selected && !dimmed;
  const label = showLabel
    ? `<span style="margin-top:3px;font:600 10px 'IBM Plex Mono',ui-monospace,monospace;color:white;background:rgba(10,12,28,.9);border-radius:6px;padding:1px 5px;letter-spacing:.02em;white-space:nowrap">${station.id} ${trend}</span>`
    : "";
  return L.divIcon({
    className: "station-pin",
    iconSize: showLabel ? [72, 42] : [dot, dot],
    iconAnchor: showLabel ? [36, dot / 2] : [dot / 2, dot / 2],
    html: `<div style="position:relative;display:flex;flex-direction:column;align-items:center;width:${showLabel ? 72 : dot}px;opacity:${dimmed ? 0.72 : 1}">
      <div style="width:${dot}px;height:${dot}px;border-radius:99px;background:${color};border:2px solid ${border};${ring}"></div>
      ${alert}
      ${label}
    </div>`,
  });
}

function labelIcon(text: string, tone: "lab" | "outlet") {
  const color = tone === "outlet" ? "#fb7185" : "#f5e6c8";
  return L.divIcon({
    className: "station-pin",
    iconSize: [120, 28],
    iconAnchor: [60, 14],
    html: `<div style="font:600 11px 'IBM Plex Sans',sans-serif;color:${color};background:rgba(10,12,28,.78);border:1px dashed ${color};border-radius:999px;padding:4px 8px;text-align:center">${text}</div>`,
  });
}

const LAKE_BOUNDS = L.latLngBounds([3.11885, 101.65615], [3.1199, 101.65895]);

const LAKE_RING: [number, number][] = [
  [3.11972, 101.65618],
  [3.11988, 101.65715],
  [3.11978, 101.65835],
  [3.11935, 101.65895],
  [3.11898, 101.65855],
  [3.11905, 101.6572],
  [3.1194, 101.65625],
];

function FrameLake({ frameToken, detailOpen }: { frameToken: number; detailOpen: boolean }) {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
    const frame = window.requestAnimationFrame(() => {
      const narrow = map.getSize().x < 800;
      map.fitBounds(LAKE_BOUNDS, {
        paddingTopLeft: detailOpen ? L.point(narrow ? 16 : 48, 72) : narrow ? L.point(16, 220) : L.point(480, 72),
        paddingBottomRight: detailOpen ? L.point(narrow ? 24 : 460, 72) : L.point(56, 72),
        maxZoom: 18,
        animate: true,
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [detailOpen, frameToken, map]);

  return null;
}

export function CampusMap({
  stations,
  boundary,
  selectedId,
  onSelect,
  layers,
  showFlow,
  frameToken,
  detailOpen,
  filterColor,
  matchedIds,
  snapshot = null,
}: CampusMapProps) {
  const flowPoints = FLOW_PATH.map((id) => stations.find((station) => station.id === id))
    .filter((station): station is Station => Boolean(station))
    .map((station) => parseCoords(station.coords));
  const outlet = boundary.find((station) => station.id === "VL-05");

  return (
    <MapContainer
      center={[3.1194, 101.6575]}
      zoom={18}
      zoomControl={false}
      attributionControl
      className="h-full w-full"
    >
      <TileLayer
        attribution="Tiles &copy; Esri"
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      />
      <ZoomControl key={detailOpen ? "zoom-left" : "zoom-right"} position={detailOpen ? "bottomleft" : "bottomright"} />
      <FrameLake frameToken={frameToken} detailOpen={detailOpen} />
      {layers.catchment && (
        <Polygon
          positions={LAKE_RING}
          pathOptions={{ color: "#fb7185", weight: 2, dashArray: "1 7", fillColor: "#fb7185", fillOpacity: 0.05 }}
        />
      )}
      {showFlow && flowPoints.length > 1 && (
        <Polyline positions={flowPoints} pathOptions={{ color: "#7dd3fc", weight: 4, opacity: 0.9 }} />
      )}
      {layers.land && <Marker position={[3.12005, 101.65855]} icon={labelIcon("Labs", "lab")} interactive={false} />}
      {layers.outlets && outlet && (
        <Marker position={[3.11982, 101.65862]} icon={labelIcon("Lab discharge", "outlet")} interactive={false} />
      )}
      {stations.map((station) => {
        const matched = matchedIds.has(station.id);
        const month = snapshot?.get(station.id);
        return (
          <Marker
            key={`${station.id}-${selectedId === station.id}-${matched}-${filterColor ?? "class"}-${station.klass}-${month ? `${month.klass}${month.sampled}` : "latest"}`}
            position={parseCoords(station.coords)}
            icon={pinIcon(station, selectedId === station.id, filterColor, matched, month)}
            zIndexOffset={selectedId === station.id ? 600 : matched ? 120 : 0}
            eventHandlers={{ click: () => onSelect(station.id) }}
          />
        );
      })}
    </MapContainer>
  );
}
