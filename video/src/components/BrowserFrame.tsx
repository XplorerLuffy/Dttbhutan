import React from "react";
import { Img, staticFile, interpolate, useCurrentFrame } from "remotion";
import { COLORS, FONTS } from "../theme";
import { CAPTURE_SIZES } from "../data/captureSizes";

/**
 * A browser window holding a real screenshot of DTT Bhutan.
 *
 * Everything inside the viewport is a photograph of the running site — never a
 * rebuild of it — so the frame's job is only to say "this is a website" and to
 * carry the address. The address bar shows dttbhutan.vercel.app because that is
 * the site these captures are of; they were taken from the same commit built
 * and served locally, since the render container cannot reach that host.
 *
 * `pan` moves the capture inside the viewport over the scene's length. A tall
 * full-page capture panned slowly is the closest thing to filming someone
 * scrolling, without pretending to a scroll that never happened.
 */
export const BrowserFrame: React.FC<{
  /** File under public/captures, without the extension. */
  src: string;
  url?: string;
  width?: number;
  height?: number;
  /** 0 → top of the capture, 1 → bottom. Ignored for viewport-sized shots. */
  panFrom?: number;
  panTo?: number;
  /** Frames over which the pan runs. Defaults to the whole sequence. */
  panOver?: [number, number];
  /** Stops to move between instead of one straight run, as [frame, position].
   * A page nearly seven screens tall cannot be crossed in a scene at a speed
   * anyone can read, so a tour of it moves between the sections that matter and
   * rests on each — which is also how a person reads a page. */
  panStops?: [number, number][];
  /** Scale applied to the capture inside the viewport, for a slow push-in. */
  zoomFrom?: number;
  zoomTo?: number;
  style?: React.CSSProperties;
  shadow?: boolean;
}> = ({
  src,
  url = "dttbhutan.vercel.app",
  width = 1520,
  height = 950,
  panFrom = 0,
  panTo = 0,
  panOver,
  panStops,
  zoomFrom = 1,
  zoomTo = 1,
  style,
  shadow = true,
}) => {
  const frame = useCurrentFrame();
  const [panStart, panEnd] = panOver ?? [0, 240];

  const t = interpolate(frame, [panStart, panEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const chrome = 46;
  const viewportH = height - chrome;

  // The capture's real size, measured from the file rather than declared at the
  // call site. Declaring it by hand was wrong and invisibly so: the homepage
  // capture is nearly 7 times taller than it is wide and was declared as 2.9,
  // so a pan meant to reach the footer stopped less than half way down.
  const size = CAPTURE_SIZES[src];
  if (!size) {
    throw new Error(
      `No capture named "${src}" — run node build-capture-manifest.mjs, or check public/captures.`
    );
  }
  // The capture is rendered at the frame's width, so its on-screen height
  // scales with it; panning is over whatever is left below the fold.
  const renderedH = (size.height / size.width) * width;
  const travel = Math.max(0, renderedH - viewportH);

  const position = panStops?.length
    ? interpolate(
        frame,
        panStops.map(([f]) => f),
        panStops.map(([, at]) => at),
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      )
    : panFrom + (panTo - panFrom) * t;

  const offset = -position * travel;
  const zoom = zoomFrom + (zoomTo - zoomFrom) * t;

  return (
    <div
      style={{
        width,
        height,
        borderRadius: 14,
        overflow: "hidden",
        background: COLORS.ink800,
        border: `1px solid ${COLORS.line}`,
        boxShadow: shadow ? "0 60px 140px -40px rgba(0,0,0,0.85)" : undefined,
        ...style,
      }}
    >
      <div
        style={{
          height: chrome,
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "0 18px",
          background: "#1b2027",
          borderBottom: `1px solid ${COLORS.line}`,
        }}
      >
        <div style={{ display: "flex", gap: 8 }}>
          {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
            <span key={c} style={{ width: 12, height: 12, borderRadius: 999, background: c }} />
          ))}
        </div>
        <div
          style={{
            flex: 1,
            height: 26,
            borderRadius: 999,
            background: "#0f1318",
            display: "flex",
            alignItems: "center",
            padding: "0 14px",
            font: `500 14px/1 ${FONTS.body}`,
            color: "rgba(255,255,255,0.55)",
            gap: 8,
          }}
        >
          <span style={{ color: "rgba(255,255,255,0.3)" }}>https://</span>
          {url}
        </div>
      </div>

      <div style={{ height: viewportH, overflow: "hidden", background: "#fff" }}>
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
 * A phone holding a real capture taken at 390px wide — the width the package
 * pages and the assistant panel were actually designed against.
 */
export const PhoneFrame: React.FC<{
  src: string;
  height?: number;
  style?: React.CSSProperties;
}> = ({ src, height = 760, style }) => {
  const width = Math.round((390 / 844) * height);
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 38,
        padding: 8,
        background: "#15181d",
        border: `1px solid ${COLORS.line}`,
        boxShadow: "0 50px 120px -35px rgba(0,0,0,0.9)",
        ...style,
      }}
    >
      <div style={{ width: "100%", height: "100%", borderRadius: 30, overflow: "hidden", background: "#fff" }}>
        <Img src={staticFile(`captures/${src}.png`)} style={{ width: "100%", display: "block" }} />
      </div>
    </div>
  );
};
