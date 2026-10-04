import VendorApprovalControls from "@/components/admin/VendorApprovalControls";
import StatusBadge from "@/components/StatusBadge";

type Status = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";

/** Approve / reject / suspend, on a listing's edit page. */
export default function ListingStatusSection({
  status,
  apiPath,
  who,
}: {
  status: Status;
  apiPath: string;
  /** Who is emailed about a change, e.g. "the guide". */
  who: string;
}) {
  return (
    <section className="card mt-8 space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">Listing status</h2>
        <StatusBadge status={status} />
      </div>
      <p className="text-sm text-stone-600">
        Only approved listings are shown to travelers. Suspend to take this one down for now;
        changing the status emails {who} if they have an email address.
      </p>
      <VendorApprovalControls apiPath={apiPath} status={status} />
    </section>
  );
}
