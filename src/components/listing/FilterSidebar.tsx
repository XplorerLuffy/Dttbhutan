/**
 * Left-hand filter sidebar shell (Booking.com's classic "Filter by" panel)
 * plus a labeled section wrapper. Individual pages compose their own
 * filter controls (checkboxes, selects, range inputs) inside <FilterGroup>
 * children — this just gives every listing page the same shape and
 * spacing.
 */
export function FilterSidebar({ children }: { children: React.ReactNode }) {
  return (
    <aside className="filter-sidebar">
      <h2 className="mb-4 font-display text-lg font-semibold text-stone-900">Filter by</h2>
      {children}
    </aside>
  );
}

export function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="filter-group">
      <h3 className="mb-2 text-sm font-semibold text-stone-800">{title}</h3>
      {children}
    </div>
  );
}
