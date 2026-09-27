"use client";

import dynamic from "next/dynamic";

/**
 * Leaflet touches `window` at import time, so the map can only be loaded in
 * the browser. The placeholder holds the same height to keep the overview's
 * two columns from jumping when it arrives.
 */
const TripRouteMap = dynamic(() => import("./TripRouteMap"), {
  ssr: false,
  loading: () => <div className="h-80 w-full animate-pulse rounded-xl bg-stone-100" />,
});

export default TripRouteMap;
