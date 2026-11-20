import { useEffect } from "react";
import { MapContainer, Marker, Polygon, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { NwqsClass } from "../../data/types";
import { parseCoords } from "../../lib/geo";

const CLASS_COLOR: Record<NwqsClass, string> = {
  I: "#3b82f6",
  II: "#34d399",
  III: "#f5c451",
  IV: "#f08a3c",
  V: "#ef5350",
};

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

export type HistoryPin = {
  id: string;
  coords: string;
  klass: NwqsClass | null;
};

function pinIcon(pin: HistoryPin, selected: boolean) {
  const color = pin.klass ? CLASS_COLOR[pin.klass] : "#94a3b8";
  const dot = selected ? 18 : pin.klass ? 14 : 9;
  const label = selected
    ? `<span style="margin-top:3px;font:600 11px 'IBM Plex Sans',sans-serif;color:white;background:rgba(10,12,28,.88);border-radius:6px;padding:1px 6px">${pin.id}</span>`
    : "";
  return L.divIcon({
    className: "station-pin",
    iconSize: selected ? [64, 40] : [dot, dot],
    iconAnchor: selected ? [32, dot / 2] : [dot / 2, dot / 2],
    html: `<div style="display:flex;flex-direction:column;align-items:center;opacity:${pin.klass ? 1 : 0.55}">
      <div style="width:${dot}px;height:${dot}px;border-radius:99px;background:${color};border:2px solid white;box-shadow:0 3px 8px rgba(0,0,0,.4)"></div>
      ${label}
    </div>`,
  });
}

function Frame() {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    const frame = window.requestAnimationFrame(() => {
      map.fitBounds(LAKE_BOUNDS, { padding: [28, 28], maxZoom: 17, animate: false });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [map]);
  return null;
}

export function HistoryMap({
  pins,
  selectedId,
  onSelect,
}: {
  pins: HistoryPin[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <MapContainer center={[3.1194, 101.6575]} zoom={17} zoomControl={false} attributionControl={false} className="h-full w-full">
      <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
      <Frame />
      <Polygon positions={LAKE_RING} pathOptions={{ color: "#fb7185", weight: 2, dashArray: "1 7", fillColor: "#fb7185", fillOpacity: 0.05 }} />
      {pins.map((pin) => (
        <Marker
          key={`${pin.id}-${pin.klass ?? "none"}-${selectedId === pin.id}`}
          position={parseCoords(pin.coords)}
          icon={pinIcon(pin, selectedId === pin.id)}
          zIndexOffset={selectedId === pin.id ? 400 : pin.klass ? 100 : 0}
          eventHandlers={{ click: () => onSelect(pin.id) }}
        />
      ))}
    </MapContainer>
  );
}
