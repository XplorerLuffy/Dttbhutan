import Image from "next/image";
import type { DzongkhagRegion } from "@prisma/client";
import MotionCard from "@/components/MotionCard";
import { REGION_LABEL } from "@/lib/regions";

export default function DestinationCard({
  href,
  photoUrl,
  region,
  name,
  description,
  packageCount,
}: {
  href: string;
  photoUrl: string | null;
  region: string;
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
        <span className="absolute left-2 top-2 rounded-full bg-gold-400 px-2.5 py-1 text-xs font-semibold text-brand-950">
          {REGION_LABEL[region as DzongkhagRegion] ?? region}
        </span>
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
