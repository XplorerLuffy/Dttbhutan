import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COLORS, FONTS, seconds } from "../theme";
import { Architecture } from "../components/Architecture";
import { SectionTitle } from "../components/SectionTitle";
import { CORE_MODELS, FACTS } from "../data/projectFacts";

/**
 * 65–78s. The shape of the data.
 *
 * The stack on the left is the one this project really has, named down to the
 * host: Prisma over PostgreSQL, hosted on Supabase, with pgvector — which
 * belongs here rather than in the AI chapter, because the vectors live in the
 * same database as the bookings, in a KnowledgeChunk table beside Itinerary.
 *
 * The grid is 12 of the 34 models, chosen because they are the ones the travel
 * product is made of; the count says the other 22 exist rather than pretending
 * these are all of them.
 */
export const Database: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ background: COLORS.ink }}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: 76 }}>
        <SectionTitle from={seconds(0.3)} size={38}>
          The data behind the experience had to be structured too.
        </SectionTitle>
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 96,
          paddingTop: 84,
        }}
      >
        <Architecture
          width={430}
          nodes={[
            { label: "Website", detail: "server components" },
            { label: "API routes", detail: `${FACTS.apiRoutes} handlers` },
            { label: "Prisma", detail: "typed client + migrations" },
            { label: "PostgreSQL", detail: `${FACTS.migrations} migrations applied` },
            { label: "Supabase", detail: "managed Postgres + pgvector" },
          ]}
          revealOver={[seconds(1.0), seconds(4.0)]}
        />

        <div style={{ width: 880 }}>
          <p
            style={{
              margin: "0 0 22px",
              font: `600 15px/1 ${FONTS.body}`,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: COLORS.gold400,
              opacity: interpolate(frame, [seconds(4.0), seconds(4.6)], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            prisma/schema.prisma — {FACTS.models} models, {FACTS.enums} enums
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {CORE_MODELS.map((model, i) => {
              const at = seconds(4.2) + i * 3;
              const on = interpolate(frame, [at, at + 12], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              return (
                <div
                  key={model.name}
                  style={{
                    opacity: on,
                    transform: `translateY(${interpolate(on, [0, 1], [12, 0])}px)`,
                    borderRadius: 9,
                    padding: "15px 17px",
                    background: "rgba(255,255,255,0.035)",
                    border: `1px solid ${COLORS.line}`,
                  }}
                >
                  <p style={{ margin: 0, font: `600 21px/1.2 ${FONTS.mono}`, color: COLORS.brand300 }}>
                    {model.name}
                  </p>
                  <p style={{ margin: "6px 0 0", font: `400 15px/1.35 ${FONTS.body}`, color: COLORS.textFaint }}>
                    {model.note}
                  </p>
                </div>
              );
            })}
          </div>

          <p
            style={{
              margin: "22px 0 0",
              font: `400 17px/1 ${FONTS.body}`,
              color: COLORS.textFaint,
              opacity: interpolate(frame, [seconds(9.0), seconds(9.8)], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            + {FACTS.models - CORE_MODELS.length} more — payments, messaging, GPS trips, exchange rates,
            site content
          </p>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
