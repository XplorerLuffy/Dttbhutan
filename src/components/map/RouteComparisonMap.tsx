"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import L from "leaflet";

function dotIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="width:14px;height:14px;border-radius:9999px;background:${color};border:2px solid white;box-shadow:0 0 0 1px rgba(0,0,0,0.3)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

export type MapPoint = { latitude: number; longitude: number; label?: string };

export default function RouteComparisonMap({
  plannedRoute,
  actualTrail,
}: {
  plannedRoute: MapPoint[];
  actualTrail: MapPoint[];
}) {
  const center = actualTrail[0] ?? plannedRoute[0] ?? { latitude: 27.4712, longitude: 89.639 };

  return (
    <div>
      <MapContainer
        center={[center.latitude, center.longitude]}
        zoom={10}
        scrollWheelZoom={false}
        style={{ height: "380px", width: "100%", borderRadius: "0.5rem" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {plannedRoute.length >= 2 && (
          <Polyline
            positions={plannedRoute.map((p) => [p.latitude, p.longitude])}
            pathOptions={{ color: "#78716c", dashArray: "6 6", weight: 3 }}
          />
        )}

        {actualTrail.length >= 2 && (
          <Polyline
            positions={actualTrail.map((p) => [p.latitude, p.longitude])}
            pathOptions={{ color: "#059669", weight: 4 }}
          />
        )}

        {plannedRoute.map((p, i) => (
          <Marker key={`planned-${i}`} position={[p.latitude, p.longitude]} icon={dotIcon("#78716c")}>
            {p.label && <Popup>Planned: {p.label}</Popup>}
          </Marker>
        ))}

        {actualTrail[0] && (
          <Marker position={[actualTrail[0].latitude, actualTrail[0].longitude]} icon={dotIcon("#059669")}>
            <Popup>GPS start</Popup>
          </Marker>
        )}
        {actualTrail.length > 1 && (
          <Marker
            position={[
              actualTrail[actualTrail.length - 1].latitude,
              actualTrail[actualTrail.length - 1].longitude,
            ]}
            icon={dotIcon("#dc2626")}
          >
            <Popup>GPS end</Popup>
          </Marker>
        )}
      </MapContainer>

      <div className="mt-2 flex gap-4 text-xs text-stone-500">
        <span className="flex items-center gap-1">
          <span className="inline-block h-0.5 w-4 border-t-2 border-dashed border-stone-400" /> Planned route
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-0.5 w-4 bg-emerald-600" /> Actual GPS trail
        </span>
      </div>
    </div>
  );
}
