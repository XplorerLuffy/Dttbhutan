import Image from "next/image";
import MotionCard from "@/components/MotionCard";
import RatingBadge from "@/components/listing/RatingBadge";

export default function GuideCard({
  href,
  photoUrl,
  name,
  locations,
  languages,
  yearsExperience,
  ratingAverage,
  ratingCount,
}: {
  href: string;
  photoUrl: string | null;
  name: string;
  locations: string[];
  languages: string[];
  yearsExperience: number;
  ratingAverage: number | null;
  ratingCount: number;
}) {
  return (
    <MotionCard href={href} className="card block overflow-hidden p-0">
      <div className="relative h-44 w-full overflow-hidden bg-brand-50">
        {photoUrl ? (
          <Image src={photoUrl} alt={name} fill unoptimized className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-display text-3xl text-brand-300">
            {name[0]}
          </div>
        )}
        <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-pine-700/90 px-2.5 py-1 text-xs font-semibold text-white">
          <IconCheck className="h-3 w-3" />
          Verified guide
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-display text-base font-semibold text-stone-900">{name}</h3>
        {locations.length > 0 && <p className="mt-0.5 truncate text-xs text-stone-500">{locations.join(" • ")}</p>}
        <p className="mt-1 truncate text-xs text-stone-500">
          {languages.join(", ")}
          {languages.length > 0 && yearsExperience > 0 ? " · " : ""}
          {yearsExperience > 0 ? `${yearsExperience} yr${yearsExperience === 1 ? "" : "s"} experience` : ""}
        </p>
        <div className="mt-2">
          <RatingBadge average={ratingAverage} count={ratingCount} />
        </div>
      </div>
    </MotionCard>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
