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
 * The `Reverse` variants are for dark backgrounds. Measured against the
 * navy header, the artwork's dominant blue sits at 1.46:1 contrast — the
 * glyph and the Bhutan map effectively vanish. Those elements are recoloured
 * to white (11.5:1) while the gold and orange petals keep their own colour,
 * since they already read clearly at 6.5:1 and 4.0:1. That is a standard
 * reversed lockup, but it is a variant of the client's artwork rather than
 * something they supplied; an official reversed or vector master from their
 * designer should replace it when available.
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

export function LogoMarkReverse({ className }: { className?: string }) {
  return (
    <Image
      src="/logo/droelma-mark-reverse.png"
      alt="Droelma Tours &amp; Travels"
      width={535}
      height={533}
      priority
      className={className}
    />
  );
}

export function LogoLockupReverse({ className }: { className?: string }) {
  return (
    <Image
      src="/logo/droelma-logo-reverse.png"
      alt="Droelma Tours &amp; Travels"
      width={714}
      height={607}
      className={className}
    />
  );
}
