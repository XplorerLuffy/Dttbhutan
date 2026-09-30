import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { COLORS } from "../theme";
import { CAPTURE_SIZES } from "../data/captureSizes";

/**
 * A phone holding a real capture of the site as a phone renders it.
 *
 * The landscape film could fit a desktop screenshot whole and still be read.
 * A 9:16 frame cannot — a 16:9 capture placed in it is a third of the height
 * and every label in it is too small to see on the device it will be watched
 * on. So the vertical cut is built from captures taken at 390px wide, which is
 * also the honest thing to show: it is how most of this site's visitors see it.
 *
 * `scroll` moves the page inside the phone, which is the only motion that
 * matters here — it is what the viewer's thumb does.
 */
export const PhoneShot: React.FC<{
  /** A file under public/captures, without the extension. */
  src: string;
  height?: number;
  /** 0 is the top of the page, 1 the bottom. */
  scrollFrom?: number;
  scrollTo?: number;
  /** Frames the scroll runs over. */
  scrollOver?: [number, number];
  zoomFrom?: number;
  zoomTo?: number;
  style?: React.CSSProperties;
}> = ({
  src,
  height = 1020,
  scrollFrom = 0,
  scrollTo = 0,
  scrollOver = [0, 120],
  zoomFrom = 1,
  zoomTo = 1,
  style,
}) => {
  const frame = useCurrentFrame();

  const size = CAPTURE_SIZES[src];
  if (!size) {
    throw new Error(`No capture named "${src}" — run node build-capture-manifest.mjs`);
  }

  // The captures are 390 CSS px wide at 3x. The phone is drawn to that aspect.
  const bezel = 10;
  const screenH = height - bezel * 2;
  const screenW = Math.round((390 / 844) * screenH);
  const width = screenW + bezel * 2;

  const renderedH = (size.height / size.width) * screenW;
  const travel = Math.max(0, renderedH - screenH);
  const t = interpolate(frame, scrollOver, [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const offset = -(scrollFrom + (scrollTo - scrollFrom) * t) * travel;
  const zoom = zoomFrom + (zoomTo - zoomFrom) * t;

  return (
    <div
      style={{
        width,
        height,
        borderRadius: 46,
        padding: bezel,
        background: "#15181d",
        border: `1px solid ${COLORS.line}`,
        boxShadow: "0 40px 90px -25px rgba(0,0,0,0.9)",
        ...style,
      }}
    >
      <div style={{ width: "100%", height: "100%", borderRadius: 38, overflow: "hidden", background: "#fff" }}>
        <Img
          src={staticFile(`captures/${src}.png`)}
          style={{
            width: "100%",
            display: "block",
            transform: `translateY(${offset}px) scale(${zoom})`,
            transformOrigin: "50% 0%",
          }}
        />
      </div>
    </div>
  );
};

/**
 * A blurred still of the site behind everything, so a beat is never a phone
 * floating on flat black. Low contrast on purpose — it is a ground, not a
 * picture.
 */
export const Backdrop: React.FC<{ src: string; opacity?: number }> = ({ src, opacity = 0.22 }) => (
  <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: COLORS.ink }}>
    <Img
      src={staticFile(`captures/${src}.png`)}
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        width: "150%",
        transform: "translate(-50%, -50%)",
        filter: "blur(38px) saturate(1.15)",
        opacity,
      }}
    />
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(7,9,13,0.55), rgba(7,9,13,0.9))" }} />
  </div>
);
