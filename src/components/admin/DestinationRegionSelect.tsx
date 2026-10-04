"use client";

import { useState } from "react";
import { useServerAction } from "@/components/useServerAction";
import type { DzongkhagRegion } from "@prisma/client";
import { REGION_LABEL, REGION_ORDER } from "@/lib/regions";

export default function DestinationRegionSelect({
  destinationId,
  region,
}: {
  destinationId: string;
  region: DzongkhagRegion;
}) {
  const { run, busy, error } = useServerAction();
  // Shows the choice at once; reverts if the save fails.
  const [value, setValue] = useState(region);

  async function handleChange(next: DzongkhagRegion) {
    const previous = value;
    setValue(next);
    const ok = await run(`/api/admin/destinations/${destinationId}`, {
      method: "PATCH",
      body: JSON.stringify({ region: next }),
    });
    if (!ok) setValue(previous);
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <select
        value={value}
        disabled={busy}
        onChange={(e) => handleChange(e.target.value as DzongkhagRegion)}
        className="input w-auto"
      >
        {REGION_ORDER.map((r) => (
          <option key={r} value={r}>
            {REGION_LABEL[r]}
          </option>
        ))}
      </select>
      {error && (
        <span role="alert" className="max-w-xs text-xs text-red-600">
          {error}
        </span>
      )}
    </span>
  );
}
