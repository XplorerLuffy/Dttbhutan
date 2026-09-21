import type { DzongkhagRegion } from "@prisma/client";

export const REGION_ORDER: DzongkhagRegion[] = ["WEST", "CENTRAL", "EAST", "NORTH", "SOUTH"];

export const REGION_LABEL: Record<DzongkhagRegion, string> = {
  WEST: "Western Bhutan",
  CENTRAL: "Central Bhutan",
  EAST: "Eastern Bhutan",
  NORTH: "Northern Bhutan",
  SOUTH: "Southern Bhutan",
};
