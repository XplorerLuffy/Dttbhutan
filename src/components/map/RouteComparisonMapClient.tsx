"use client";

import dynamic from "next/dynamic";

const RouteComparisonMap = dynamic(() => import("./RouteComparisonMap"), {
  ssr: false,
  loading: () => <div className="h-96 animate-pulse rounded-lg bg-stone-100" />,
});

export default RouteComparisonMap;
