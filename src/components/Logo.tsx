import Image from "next/image";

/**
 * The client's logo artwork — the DTT mountain-and-river "D".
 *
 * The artwork is the client's DTT logo with the prayer-flag line, supplied as
 * a transparent PNG. The PNGs under public/logo/ are cropped to it and split
 * into the full lockup and the DTT mark alone. The `?v=` on each src is a
 * cache-buster: the files keep their names, so browsers would otherwise show
 * the old logo. The artwork itself —
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
      src="/logo/dtt-mark.png?v=2"
      alt="Droelma Tours &amp; Travels"
      width={544}
      height={198}
      priority
      className={className}
    />
  );
}

export function LogoLockup({ className }: { className?: string }) {
  return (
    <Image
      src="/logo/dtt-logo.png?v=2"
      alt="Droelma Tours &amp; Travels"
      width={1436}
      height={244}
      priority
      className={className}
    />
  );
}

export function LogoMarkReverse({ className }: { className?: string }) {
  return (
    <Image
      src="/logo/dtt-mark-reverse.png?v=2"
      alt="Droelma Tours &amp; Travels"
      width={544}
      height={198}
      priority
      className={className}
    />
  );
}

export function LogoLockupReverse({ className }: { className?: string }) {
  return (
    <Image
      src="/logo/dtt-logo-reverse.png?v=2"
      alt="Droelma Tours &amp; Travels"
      width={1436}
      height={244}
      priority
      className={className}
    />
  );
}
