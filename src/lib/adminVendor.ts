import "server-only";
import { z } from "zod";

export const vendorStatusUpdateSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "SUSPENDED", "PENDING"]),
  adminNote: z.string().max(1000).optional(),
});
