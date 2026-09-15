"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import L from "leaflet";

// Avoid shipping Leaflet's default marker image assets (they resolve to
// broken paths under Next.js's bundler) — divIcon + inline styling instead.
function dotIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="width:16px;height:16px;border-radius:9999px;background:${color};border:2px solid white;box-shadow:0 0 0 1px rgba(0,0,0,0.3)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

export type MapPoint = { latitude: number; longitude: number; label?: string };

export default function LiveTrackingMap({
  route,
  currentPosition,
}: {
  route: MapPoint[];
  currentPosition: MapPoint | null;
}) {
  const center = currentPosition ?? route[0] ?? { latitude: 27.4712, longitude: 89.639 };

  return (
    <MapContainer
      center={[center.latitude, center.longitude]}
      zoom={11}
      scrollWheelZoom={false}
      style={{ height: "320px", width: "100%", borderRadius: "0.5rem" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {route.length >= 2 && (
        <Polyline
          positions={route.map((p) => [p.latitude, p.longitude])}
          pathOptions={{ color: "#0f766e", dashArray: "6 6", weight: 3 }}
        />
      )}

      {route.map((p, i) => (
        <Marker
          key={`waypoint-${i}`}
          position={[p.latitude, p.longitude]}
          icon={dotIcon("#78716c")}
        >
          {p.label && <Popup>{p.label}</Popup>}
        </Marker>
      ))}

      {currentPosition && (
        <Marker
          position={[currentPosition.latitude, currentPosition.longitude]}
          icon={dotIcon("#059669")}
        >
          <Popup>Current position</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
