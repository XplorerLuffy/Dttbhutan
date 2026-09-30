import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COLORS } from "../theme";
import { useSceneSeconds } from "../timing";
import { Architecture } from "../components/Architecture";
import { CodeWindow } from "../components/CodeWindow";
import { SectionTitle } from "../components/SectionTitle";
import { SNIPPETS } from "../data/codeSnippets";
import { FACTS } from "../data/projectFacts";

/**
 * 50–65s. What happens after the click.
 *
 * The layers on the left are read off the repository, not off a diagram of how
 * a Next.js app is usually put together: there is no separate server, so
 * "Next.js App Router" and "Route handlers" are two rows rather than a box
 * labelled "backend". The code on the right is one whole route handler,
 * unedited — it is worth the screen time because it shows all four things at
 * once: who you are, whether you may, whether the request is well-formed, and
 * what happens when the trip is already taken.
 */
export const Backend: React.FC = () => {
  const t = useSceneSeconds();
  const frame = useCurrentFrame();

  const codeIn = interpolate(frame, [t(3.6), t(5.0)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: COLORS.ink }}>
      {/* A column, not two overlaid layers. The route handler is 31 lines, which
          at any readable size is nearly the height of the frame — laid over a
          centred row it pushed up into the narration and covered it. Giving the
          title its own band and the content the rest is the only arrangement
          that holds at every speed this scene gets cut to. */}
      <AbsoluteFill style={{ display: "flex", flexDirection: "column", padding: "52px 80px 40px" }}>
        <div style={{ height: 92, display: "flex", alignItems: "flex-start", justifyContent: "center" }}>
          <SectionTitle from={t(0.3)} size={36}>
            Behind the interface, I built the backend that powers it.
          </SectionTitle>
        </div>

        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 70,
          }}
        >
        <Architecture
          width={470}
          nodes={[
            { label: "DTT Bhutan", detail: "the pages a traveller sees" },
            { label: "Next.js App Router", detail: `src/app — ${FACTS.pages} pages` },
            { label: "Route handlers", detail: `src/app/api — ${FACTS.apiRoutes} routes` },
            { label: "Validation", detail: "Zod — src/lib/validation.ts" },
            { label: "Business logic", detail: "src/lib — booking, fx, email, gps" },
            { label: "Prisma", detail: "PostgreSQL" },
          ]}
          revealOver={[t(1.2), t(4.4)]}
        />

        <div style={{ opacity: codeIn, transform: `translateX(${interpolate(codeIn, [0, 1], [50, 0])}px)` }}>
          <CodeWindow
            path={SNIPPETS.bookingRoute.path}
            code={SNIPPETS.bookingRoute.code}
            startLine={SNIPPETS.bookingRoute.startLine}
            width={880}
            fontSize={15}
            typeOver={[t(4.4), t(9.6)]}
            highlight={[8, 12, 20, 26, 30]}
          />
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
