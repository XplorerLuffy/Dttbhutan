import DashboardShell from "@/components/dashboard/DashboardShell";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/vendors", label: "Vendor approvals" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/gps/trips", label: "GPS mileage reports" },
  { href: "/admin/packages", label: "Package tours" },
  { href: "/admin/custom-tours", label: "Custom tour requests" },
  { href: "/admin/enquiries", label: "Enquiries" },
  { href: "/admin/travel-guide", label: "Travel guide" },
  { href: "/admin/exchange-rates", label: "Exchange rates" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell title="Admin" nav={NAV}>
      {children}
    </DashboardShell>
  );
}
