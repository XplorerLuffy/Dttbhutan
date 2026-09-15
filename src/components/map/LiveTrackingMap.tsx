"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
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

const ANIMATION_MS = 1400;

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

/**
 * The vehicle marker. Whenever `position` changes (a new GPS ping came
 * in), eases the marker from wherever it currently sits to the new point
 * over ~1.4s instead of jumping instantly — GPS pings arrive every so
 * often, not continuously, so without this the marker would visibly
 * teleport on every refresh.
 */
function AnimatedVehicleMarker({ position }: { position: MapPoint }) {
  const markerRef = useRef<L.Marker>(null);
  const prevPositionRef = useRef<MapPoint>(position);
  const frameRef = useRef<number>();

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;

    const from = prevPositionRef.current;
    const to = position;
    prevPositionRef.current = position;

    if (from.latitude === to.latitude && from.longitude === to.longitude) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      marker.setLatLng([to.latitude, to.longitude]);
      return;
    }

    const start = performance.now();
    function step(now: number) {
      const t = Math.min(1, (now - start) / ANIMATION_MS);
      const eased = easeInOutCubic(t);
      const lat = from.latitude + (to.latitude - from.latitude) * eased;
      const lng = from.longitude + (to.longitude - from.longitude) * eased;
      marker!.setLatLng([lat, lng]);
      if (t < 1) {
        frameRef.current = requestAnimationFrame(step);
      }
    }
    frameRef.current = requestAnimationFrame(step);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [position]);

  return (
    <Marker
      ref={markerRef}
      position={[prevPositionRef.current.latitude, prevPositionRef.current.longitude]}
      icon={dotIcon("#d1842a")}
    >
      <Popup>Current position</Popup>
    </Marker>
  );
}

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
          pathOptions={{ color: "#1c6741", dashArray: "6 6", weight: 3 }}
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

      {currentPosition && <AnimatedVehicleMarker position={currentPosition} />}
    </MapContainer>
  );
}
