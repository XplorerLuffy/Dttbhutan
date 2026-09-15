const CLASS_BY_STATUS: Record<string, string> = {
  PENDING: "badge-pending",
  APPROVED: "badge-approved",
  REJECTED: "badge-rejected",
  SUSPENDED: "badge-suspended",
  CONFIRMED: "badge-approved",
  CANCELLED: "badge-rejected",
  COMPLETED: "badge-approved",
  IN_PROGRESS: "badge-pending",
  NOT_STARTED: "badge-suspended",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={CLASS_BY_STATUS[status] ?? "badge bg-stone-100 text-stone-700"}>
      {status.replace(/_/g, " ")}
    </span>
  );
}
