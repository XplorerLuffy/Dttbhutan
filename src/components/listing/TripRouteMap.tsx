"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Polyline, Tooltip } from "react-leaflet";
import L from "leaflet";

export type RouteStop = {
  name: string;
  latitude: number;
  longitude: number;
  /** Which days of the trip are spent here, e.g. [1, 2]. */
  days: number[];
};

/**
 * Numbered stop marker. Leaflet's default icon ships as a PNG resolved
 * relative to the CSS, which breaks under Next's asset hashing — a divIcon
 * sidesteps that entirely and lets the stop order sit inside the pin.
 */
function stopIcon(order: number) {
  return L.divIcon({
    className: "",
    html: `<div style="display:flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:9999px;background:#0a3159;color:#fff;font:600 12px/1 system-ui,sans-serif;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.4)">${order}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

export default function TripRouteMap({ stops }: { stops: RouteStop[] }) {
  if (stops.length === 0) return null;

  const lats = stops.map((s) => s.latitude);
  const lngs = stops.map((s) => s.longitude);
  // A single-stop trip has no bounds to fit, so fall back to a centred view
  // at a sensible valley-level zoom rather than the whole country.
  const single = stops.length === 1;
  const bounds: [[number, number], [number, number]] = [
    [Math.min(...lats), Math.min(...lngs)],
    [Math.max(...lats), Math.max(...lngs)],
  ];

  return (
    <MapContainer
      {...(single
        ? { center: [stops[0].latitude, stops[0].longitude] as [number, number], zoom: 10 }
        : { bounds, boundsOptions: { padding: [36, 36] as [number, number] } })}
      scrollWheelZoom={false}
      className="h-80 w-full rounded-xl"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {stops.length > 1 && (
        <Polyline
          positions={stops.map((s) => [s.latitude, s.longitude] as [number, number])}
          pathOptions={{ color: "#e8871a", weight: 3, dashArray: "6 6" }}
        />
      )}
      {stops.map((s, i) => (
        <Marker key={s.name} position={[s.latitude, s.longitude]} icon={stopIcon(i + 1)}>
          <Tooltip direction="top" offset={[0, -14]}>
            <span className="font-semibold">{s.name}</span>
            {s.days.length > 0 && (
              <span className="text-stone-500">
                {" "}
                — day{s.days.length > 1 ? "s" : ""} {s.days.join(", ")}
              </span>
            )}
          </Tooltip>
        </Marker>
      ))}
    </MapContainer>
  );
}
