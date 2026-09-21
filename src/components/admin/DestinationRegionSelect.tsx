"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { DzongkhagRegion } from "@prisma/client";
import { REGION_LABEL, REGION_ORDER } from "@/lib/regions";

export default function DestinationRegionSelect({
  destinationId,
  region,
}: {
  destinationId: string;
  region: DzongkhagRegion;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(next: DzongkhagRegion) {
    startTransition(async () => {
      await fetch(`/api/admin/destinations/${destinationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ region: next }),
      });
      router.refresh();
    });
  }

  return (
    <select
      value={region}
      disabled={isPending}
      onChange={(e) => handleChange(e.target.value as DzongkhagRegion)}
      className="input w-auto"
    >
      {REGION_ORDER.map((r) => (
        <option key={r} value={r}>
          {REGION_LABEL[r]}
        </option>
      ))}
    </select>
  );
}
