import Link from "next/link";
import LogoMark from "@/components/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center py-10">
      <Link href="/" className="mb-6 flex flex-col items-center gap-2">
        <LogoMark className="h-14 w-auto" />
        <span className="font-display text-lg font-semibold text-brand-800">
          Droelma Tours &amp; Travels
        </span>
      </Link>

      <div className="w-full max-w-md">{children}</div>

      <p className="mt-10 text-center text-xs text-stone-500">
        © {new Date().getFullYear()} Droelma Tours &amp; Travels. All rights reserved.
      </p>
    </div>
  );
}
