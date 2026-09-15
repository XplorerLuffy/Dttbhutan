"use client";

import dynamic from "next/dynamic";

// Leaflet touches `window` at import time, so it can't run during SSR.
const LiveTrackingMap = dynamic(() => import("./LiveTrackingMap"), {
  ssr: false,
  loading: () => <div className="h-80 animate-pulse rounded-lg bg-stone-100" />,
});

export default LiveTrackingMap;
