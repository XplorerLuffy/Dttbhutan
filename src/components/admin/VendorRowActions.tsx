import Link from "next/link";
import VendorApprovalControls from "@/components/admin/VendorApprovalControls";

type Status = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";

/**
 * The buttons on one row of the vendors list.
 *
 * An approved listing is settled, so its row offers only what an admin does
 * with it day to day: look at it as travellers do, and edit it. Approve /
 * reject / suspend are for listings still waiting on a decision (or taken
 * down); for an approved one they live on its edit page, where suspending is
 * a deliberate step rather than a button beside "Edit".
 *
 * A listing with no edit page (transport operators) keeps its status
 * controls, folded away behind "Change status" once approved.
 */
export default function VendorRowActions({
  status,
  apiPath,
  editHref,
  profileHref,
}: {
  status: Status;
  apiPath: string;
  editHref?: string;
  profileHref?: string;
}) {
  if (status === "APPROVED") {
    return (
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {profileHref && (
          <Link href={profileHref} target="_blank" className="btn-secondary">
            View profile
          </Link>
        )}
        {editHref ? (
          <Link href={editHref} className="btn-secondary">
            Edit
          </Link>
        ) : (
          <details className="text-sm">
            <summary className="cursor-pointer text-stone-600 hover:text-stone-900">
              Change status
            </summary>
            <div className="mt-2">
              <VendorApprovalControls apiPath={apiPath} status={status} />
            </div>
          </details>
        )}
      </div>
    );
  }

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      {editHref && (
        <Link href={editHref} className="btn-secondary">
          Edit
        </Link>
      )}
      <VendorApprovalControls apiPath={apiPath} status={status} />
    </div>
  );
}
