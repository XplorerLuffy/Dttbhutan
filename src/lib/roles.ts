import type { Role } from "@prisma/client";

export const DASHBOARD_PATH_BY_ROLE: Record<Role, string> = {
  TRAVELER: "/dashboard",
  GUIDE: "/vendor/guide",
  HOTEL_OPERATOR: "/vendor/hotel",
  TRANSPORT_OPERATOR: "/vendor/transport",
  ADMIN: "/admin",
};

export function dashboardPathForRole(role: Role) {
  return DASHBOARD_PATH_BY_ROLE[role] ?? "/dashboard";
}
