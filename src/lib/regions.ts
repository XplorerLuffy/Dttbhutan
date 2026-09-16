import type { DzongkhagRegion } from "@prisma/client";

export const REGION_ORDER: DzongkhagRegion[] = ["WEST", "CENTRAL", "EAST"];

export const REGION_LABEL: Record<DzongkhagRegion, string> = {
  WEST: "Western Bhutan",
  CENTRAL: "Central Bhutan",
  EAST: "Eastern Bhutan",
};
