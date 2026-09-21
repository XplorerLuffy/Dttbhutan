import Image from "next/image";
import MotionCard from "@/components/MotionCard";

export default function DestinationCard({
  href,
  photoUrl,
  name,
  description,
  packageCount,
}: {
  href: string;
  photoUrl: string | null;
  name: string;
  description: string | null;
  packageCount: number;
}) {
  return (
    <MotionCard href={href} className="card block overflow-hidden p-0">
      <div className="relative h-40 w-full overflow-hidden bg-brand-50">
        {photoUrl ? (
          <Image src={photoUrl} alt={name} fill unoptimized className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-display text-3xl text-brand-300">
            {name[0]}
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-display text-base font-semibold text-stone-900">{name}</h3>
        {description && <p className="mt-1 line-clamp-2 text-sm text-stone-600">{description}</p>}
        <p className="mt-2 text-xs font-semibold text-brand-700">
          {packageCount} PACKAGE{packageCount === 1 ? "" : "S"} AVAILABLE
        </p>
      </div>
    </MotionCard>
  );
}
