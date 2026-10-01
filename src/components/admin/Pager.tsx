import Link from "next/link";

/**
 * Previous/next for an admin list.
 *
 * Page numbers, not cursors: these lists are ordered by creation date and an
 * admin's "go back a page" has to land where they were. The links carry every
 * other search param, so paging never silently drops the filter you set.
 */
export default function Pager({
  page,
  pageSize,
  total,
  params,
}: {
  /** 1-based. */
  page: number;
  pageSize: number;
  total: number;
  /** The current query string, which the links preserve. */
  params: URLSearchParams;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;

  const href = (n: number) => {
    const next = new URLSearchParams(params.toString());
    if (n <= 1) next.delete("page");
    else next.set("page", String(n));
    const qs = next.toString();
    return qs ? `?${qs}` : "?";
  };

  const first = (page - 1) * pageSize + 1;
  const last = Math.min(total, page * pageSize);

  return (
    <div className="mt-5 flex items-center justify-between gap-4 text-sm">
      <p className="text-stone-500">
        {first}–{last} of {total}
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link href={href(page - 1)} className="btn-secondary px-4 py-2">
            Previous
          </Link>
        ) : (
          <span className="cursor-not-allowed rounded-full border border-stone-200 px-4 py-2 text-stone-300">
            Previous
          </span>
        )}
        {page < pages ? (
          <Link href={href(page + 1)} className="btn-secondary px-4 py-2">
            Next
          </Link>
        ) : (
          <span className="cursor-not-allowed rounded-full border border-stone-200 px-4 py-2 text-stone-300">
            Next
          </span>
        )}
      </div>
    </div>
  );
}
