import Image from "next/image";

/**
 * The client's actual logo artwork.
 *
 * Source of truth is public/uploads/droelma logo.jpeg, uploaded by the
 * client. The two PNGs under public/logo/ are derived from it: cropped to
 * the artwork (the original is an A4 page with wide empty margins) and
 * cut out from its off-white #f7f7f7 background, which would otherwise
 * show as a grey rectangle on the white header. The artwork itself —
 * shapes, proportions, colours — is untouched.
 *
 * `LogoMark` is the emblem alone, for places that already print the agency
 * name beside it. `LogoLockup` is the emblem over the wordmark, in the
 * brand's own typography.
 *
 * Both sit on light backgrounds. The cutout keeps a faint light fringe from
 * the original JPEG's anti-aliasing, which is invisible on white but shows
 * on a dark panel — a vector (SVG) master from the designer would be worth
 * asking for before using either over dark imagery.
 */

export default function LogoMark({ className }: { className?: string }) {
  return (
    <Image
      src="/logo/droelma-mark.png"
      alt="Droelma Tours &amp; Travels"
      width={535}
      height={533}
      priority
      className={className}
    />
  );
}

export function LogoLockup({ className }: { className?: string }) {
  return (
    <Image
      src="/logo/droelma-logo.png"
      alt="Droelma Tours &amp; Travels"
      width={714}
      height={607}
      priority
      className={className}
    />
  );
}
