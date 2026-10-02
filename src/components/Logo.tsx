import Image from "next/image";

/**
 * The client's logo artwork — the DTT mountain-and-river "D".
 *
 * Source of truth is public/new logo.jpeg, uploaded by the client. The PNGs
 * under public/logo/ are derived from it: cropped to the artwork and cut out
 * from its flat #f7f7f7 background, which would otherwise show as a grey
 * rectangle on anything that isn't that exact grey. The artwork itself —
 * shapes, proportions, colours — is untouched.
 *
 * `LogoMark` is the emblem alone (the "D" with the peak and the river), for
 * small square spaces — avatars, the dashboard bar. `LogoLockup` is the full
 * logo: emblem, "DTT" and the agency name.
 *
 * The `Reverse` variants are for dark backgrounds. The artwork's navy is the
 * same colour as the site header, so it would vanish there; it is recoloured
 * to white while the river keeps its bright blue, which still reads clearly
 * against the navy. That is a standard reversed lockup, but it is a variant
 * of the client's artwork rather than something they supplied; an official
 * reversed or vector master from their designer should replace it when
 * available.
 */

export default function LogoMark({ className }: { className?: string }) {
  return (
    <Image
      src="/logo/dtt-mark.png"
      alt="Droelma Tours &amp; Travels"
      width={544}
      height={416}
      priority
      className={className}
    />
  );
}

export function LogoLockup({ className }: { className?: string }) {
  return (
    <Image
      src="/logo/dtt-logo.png"
      alt="Droelma Tours &amp; Travels"
      width={1436}
      height={416}
      priority
      className={className}
    />
  );
}

export function LogoMarkReverse({ className }: { className?: string }) {
  return (
    <Image
      src="/logo/dtt-mark-reverse.png"
      alt="Droelma Tours &amp; Travels"
      width={544}
      height={416}
      priority
      className={className}
    />
  );
}

export function LogoLockupReverse({ className }: { className?: string }) {
  return (
    <Image
      src="/logo/dtt-logo-reverse.png"
      alt="Droelma Tours &amp; Travels"
      width={1436}
      height={416}
      priority
      className={className}
    />
  );
}
