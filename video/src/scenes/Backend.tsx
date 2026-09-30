import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COLORS, seconds } from "../theme";
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
  const frame = useCurrentFrame();

  const codeIn = interpolate(frame, [seconds(3.6), seconds(5.0)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: COLORS.ink }}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: 76 }}>
        <SectionTitle from={seconds(0.3)} size={38}>
          Behind the interface, I built the backend that powers it.
        </SectionTitle>
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 74,
          paddingTop: 92,
          paddingLeft: 90,
          paddingRight: 90,
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
          revealOver={[seconds(1.2), seconds(4.4)]}
        />

        <div style={{ opacity: codeIn, transform: `translateX(${interpolate(codeIn, [0, 1], [50, 0])}px)` }}>
          <CodeWindow
            path={SNIPPETS.bookingRoute.path}
            code={SNIPPETS.bookingRoute.code}
            startLine={SNIPPETS.bookingRoute.startLine}
            width={940}
            fontSize={18}
            typeOver={[seconds(4.4), seconds(9.6)]}
            highlight={[8, 12, 20, 26, 30]}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
