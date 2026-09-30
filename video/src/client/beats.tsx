import React from "react";
import { AbsoluteFill, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS, seconds } from "../theme";
import { BrowserFrame, PhoneFrame } from "../components/BrowserFrame";
import { CodeWindow } from "../components/CodeWindow";
import { Architecture } from "../components/Architecture";
import { DataFlow } from "../components/DataFlow";
import { Cursor } from "../components/Cursor";
import { SNIPPETS } from "../data/codeSnippets";
import { KNOWLEDGE_SOURCES } from "../data/projectFacts";
import { SEVEN_DAY_REPLY } from "../data/productionReplies";
import { Headline, Chapters } from "./Headline";

/**
 * The ten beats of the client's own shot list, in their order and at their
 * lengths.
 *
 * The brief for this film came as a table — a time, a line of on-screen text,
 * and a line of narration for each beat — so the file is written to be read
 * against that table. Every word on screen is theirs; every screenshot is a
 * photograph of the running site; every line of code is sliced out of the
 * repository. Nothing here illustrates a capability the product does not have.
 *
 * Lengths are set in ClientStory.tsx, from how long each line of narration
 * actually takes to say. A beat's own frame numbers below are relative to it.
 */
const f = (s: number) => seconds(s);

/** The stage everything sits on. */
const Stage: React.FC<{ children: React.ReactNode; center?: boolean }> = ({ children, center = true }) => (
  <AbsoluteFill
    style={{
      background: COLORS.ink,
      alignItems: "center",
      justifyContent: center ? "center" : "flex-start",
    }}
  >
    {children}
  </AbsoluteFill>
);

/** A shot that arrives with a small rise, used where one picture replaces
 * another inside a beat. */
const Shot: React.FC<{ children: React.ReactNode; from?: number }> = ({ children, from = 0 }) => {
  const frame = useCurrentFrame();
  const on = interpolate(frame, [from, from + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div style={{ opacity: on, transform: `translateY(${interpolate(on, [0, 1], [18, 0])}px)` }}>
      {children}
    </div>
  );
};

// ──────────────────────────────────────────── 1. the hook
/** Opens on the product, already moving. A film that asks a stranger for eight
 * seconds before showing anything does not get them. */
export const Hook: React.FC = () => (
  <Stage>
    <BrowserFrame
      src="home-full"
      width={1740}
      height={1000}
      panStops={[
        [0, 0],
        [f(3.7), 0.045],
      ]}
      zoomFrom={1.03}
      zoomTo={1}
    />
    <Headline text="Building a travel website for a real client 🇧🇹" from={f(0.25)} size={52} />
  </Stage>
);

// ──────────────────────────────────────────── 2. the start
/** The title, then the page it names. */
export const TheStart: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const title = spring({ frame, fps, durationInFrames: 26, config: { damping: 200 } });
  const titleOut = interpolate(frame, [f(2.0), f(2.8)], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <Stage>
      <div style={{ position: "absolute", opacity: title * titleOut, transform: `scale(${0.96 + title * 0.04})` }}>
        <p
          style={{
            margin: 0,
            font: `600 128px/1 ${FONTS.display}`,
            color: "#fff",
            letterSpacing: "-0.03em",
            textAlign: "center",
          }}
        >
          DTT Bhutan
        </p>
        <p
          style={{
            margin: "28px 0 0",
            font: `700 26px/1 ${FONTS.body}`,
            letterSpacing: "0.34em",
            textTransform: "uppercase",
            color: COLORS.gold400,
            textAlign: "center",
          }}
        >
          Client project
        </p>
      </div>

      <Sequence from={f(2.3)} name="the site">
        <Stage>
          <BrowserFrame
            src="home-full"
            width={1620}
            height={930}
            // Arrive on the hero, rest, then move down to the collections the
            // page really opens with. Measured stops, not a constant crawl.
            panStops={[
              [0, 0.02],
              [f(1.6), 0.02],
              [f(4.2), 0.13],
              [f(6.6), 0.13],
            ]}
          />
          <Headline text="DTT Bhutan — Client project" kind="label" from={f(0.3)} size={44} />
        </Stage>
      </Sequence>
    </Stage>
  );
};

// ──────────────────────────────────────────── 3. building the website
/** Six real pages in nine seconds, under the three words the client's script
 * puts on this beat. */
const BUILD_SHOTS: { src: string; url: string; from: number; pan?: [number, number] }[] = [
  { src: "home-full", url: "dttbhutan.vercel.app", from: 0, pan: [0.16, 0.28] },
  { src: "nav-megamenu", url: "dttbhutan.vercel.app", from: 1.45 },
  { src: "destinations-full", url: "dttbhutan.vercel.app/destinations", from: 2.9, pan: [0, 0.35] },
  { src: "package-detail-full", url: "dttbhutan.vercel.app/packages", from: 4.35, pan: [0.05, 0.4] },
  { src: "custom-tour-full", url: "dttbhutan.vercel.app/custom-tour", from: 5.8, pan: [0, 0.45] },
];

export const Building: React.FC = () => (
  <Stage>
    {BUILD_SHOTS.map((shot, i) => (
      <Sequence
        key={shot.src}
        name={shot.src}
        from={f(shot.from)}
        durationInFrames={f(i === BUILD_SHOTS.length - 1 ? 1.35 : 1.45) + 4}
      >
        <Stage>
          <Shot>
            <BrowserFrame
              src={shot.src}
              url={shot.url}
              width={1560}
              height={880}
              panStops={
                shot.pan
                  ? [
                      [0, shot.pan[0]],
                      [f(1.45), shot.pan[1]],
                    ]
                  : undefined
              }
            />
          </Shot>
        </Stage>
      </Sequence>
    ))}

    {/* The same site at the width most of its visitors will meet it. */}
    <Sequence name="responsive" from={f(7.15)}>
      <Stage>
        <Shot>
          <div style={{ display: "flex", alignItems: "center", gap: 64 }}>
            <BrowserFrame src="home" width={1140} height={700} />
            <PhoneFrame src="p-home" height={760} />
          </div>
        </Shot>
      </Stage>
    </Sequence>

    <Chapters
      words={["Design", "Development", "Functionality"]}
      at={[f(0.2), f(3.3), f(6.3)]}
      bottom={64}
    />
  </Stage>
);

// ──────────────────────────────────────────── 4. under the hood
/** The client's script gives this beat no on-screen text — only the picture
 * turning over from the page to what is underneath it. */
export const UnderTheHood: React.FC = () => {
  const frame = useCurrentFrame();
  const away = interpolate(frame, [f(2.6), f(3.6)], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <Stage>
      <div style={{ position: "absolute", opacity: away, transform: `scale(${0.94 + away * 0.06})` }}>
        <BrowserFrame src="home" width={1500} height={860} />
      </div>

      <Sequence from={f(3.2)} name="the code and the stack">
        <Stage>
          {/* Lifted, because the flow below claims the bottom of the frame and a
              centred pair would sit on it. */}
          <div style={{ display: "flex", alignItems: "center", gap: 70, transform: "translateY(-96px)" }}>
            <Shot>
              <CodeWindow
                path={SNIPPETS.auth.path}
                code={SNIPPETS.auth.code}
                startLine={SNIPPETS.auth.startLine}
                width={880}
                fontSize={22}
                typeOver={[f(0.2), f(1.8)]}
                highlight={[SNIPPETS.auth.startLine + 2]}
              />
            </Shot>
            <Architecture
              width={560}
              revealOver={[f(0.6), f(2.4)]}
              accentLast
              nodes={[
                { label: "Next.js App Router", detail: "src/app/**/route.ts" },
                { label: "Session & roles", detail: "src/lib/auth.ts" },
                { label: "Prisma ORM", detail: "prisma/schema.prisma" },
                { label: "PostgreSQL", detail: "34 models, 17 migrations" },
              ]}
            />
          </div>
        </Stage>
      </Sequence>

      <Sequence from={f(5.4)} name="code to api to database">
        <div style={{ position: "absolute", bottom: 74, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          <DataFlow
            width={1500}
            runOver={[f(0.3), f(3.4)]}
            steps={[
              { label: "Code", note: "TypeScript" },
              { label: "API", note: "route handlers" },
              { label: "Database", note: "PostgreSQL" },
            ]}
          />
        </div>
      </Sequence>
    </Stage>
  );
};

// ──────────────────────────────────────────── 5. the AI idea
/** The button was always there; this is the beat that notices it. */
export const TheAiIdea: React.FC = () => (
  <Stage>
    <Sequence name="the button" durationInFrames={f(4.3) + 6}>
      <Stage>
        <div style={{ position: "relative" }}>
          <BrowserFrame src="home-chat-button" width={1560} height={880} />
          <Cursor
            from={[1180, 700]}
            to={[1418, 786]}
            moveOver={[f(1.2), f(2.6)]}
            clickAt={f(2.8)}
            fadeOut={[f(3.6), f(4.1)]}
          />
        </div>
      </Stage>
    </Sequence>

    <Sequence name="the assistant opens" from={f(4.1)}>
      <Stage>
        <Shot>
          <BrowserFrame src="widget-open-greeting" width={1560} height={880} />
        </Shot>
      </Stage>
    </Sequence>

    <Headline text="Then I wanted to take it further…" from={f(0.3)} until={f(7.6)} size={54} />
  </Stage>
);

// ──────────────────────────────────────────── 6. the AI travel assistant
/**
 * One question and the answer production gave it.
 *
 * The three shots are the real states of the real component — composer,
 * pending, answered — photographed in that order, so the beat is a recording
 * of the product working rather than an animation of it working.
 */
export const Assistant: React.FC = () => (
  <Stage>
    <Sequence name="typing" durationInFrames={f(1.6) + 4}>
      <Stage>
        <BrowserFrame src="client-typing" url="dttbhutan.vercel.app/assistant" width={1620} height={930} />
      </Stage>
    </Sequence>

    <Sequence name="thinking" from={f(1.6)} durationInFrames={f(1.0) + 4}>
      <Stage>
        <BrowserFrame src="client-thinking" url="dttbhutan.vercel.app/assistant" width={1620} height={930} />
      </Stage>
    </Sequence>

    <Sequence name="answered" from={f(2.6)}>
      <Stage>
        <Shot>
          <BrowserFrame src="client-answer" url="dttbhutan.vercel.app/assistant" width={1620} height={930} />
        </Shot>
      </Stage>
    </Sequence>

    <Headline text="AI travel assistant" kind="label" from={f(0.15)} until={f(1.5)} size={46} />
  </Stage>
);

// ──────────────────────────────────────────── 7. how it works
/** What happens between the question and the answer, with the knowledge base
 * it reaches named by what is actually in it. */
export const HowItWorks: React.FC = () => {
  const frame = useCurrentFrame();
  const sources = interpolate(frame, [f(4.6), f(5.4)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <Stage>
      <div style={{ position: "absolute", top: 212, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <DataFlow
          width={1560}
          runOver={[f(0.5), f(4.2)]}
          steps={[
            { label: "User", note: "asks a question" },
            { label: "AI", note: "src/lib/ai" },
            { label: "Knowledge", note: "embedded chunks" },
            { label: "Response", note: "grounded in real data" },
          ]}
        />
      </div>

      <div
        style={{
          position: "absolute",
          top: 492,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: sources,
          transform: `translateY(${interpolate(sources, [0, 1], [20, 0])}px)`,
        }}
      >
        <div style={{ width: 1560 }}>
          <p
            style={{
              margin: "0 0 22px",
              font: `700 18px/1 ${FONTS.body}`,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: COLORS.gold400,
              textAlign: "center",
            }}
          >
            What it can draw on
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center" }}>
            {KNOWLEDGE_SOURCES.map((source, i) => {
              const on = interpolate(frame, [f(5.0 + i * 0.16), f(5.4 + i * 0.16)], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              return (
                <div
                  key={source.label}
                  style={{
                    opacity: on,
                    transform: `translateY(${interpolate(on, [0, 1], [14, 0])}px)`,
                    borderRadius: 10,
                    border: `1px solid ${COLORS.line}`,
                    background: "rgba(255,255,255,0.035)",
                    padding: "16px 22px",
                    // Fixed width so the six sources sit three and three rather
                    // than breaking wherever the longest label happens to land.
                    flex: "0 0 468px",
                  }}
                >
                  <p style={{ margin: 0, font: `600 23px/1.2 ${FONTS.body}`, color: COLORS.text }}>
                    {source.label}
                  </p>
                  <p style={{ margin: "7px 0 0", font: `400 15px/1.3 ${FONTS.mono}`, color: COLORS.textFaint }}>
                    {source.note}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Headline text="User → AI → Knowledge → Response" kind="label" from={f(0.2)} bottom={78} size={38} />
    </Stage>
  );
};

// ──────────────────────────────────────────── 8. the final result
/** The finished thing, on both screens it has to work on. */
export const FinalResult: React.FC = () => {
  const frame = useCurrentFrame();
  const phone = spring({ frame: frame - f(0.7), fps: 30, durationInFrames: 26, config: { damping: 200 } });

  return (
    <Stage>
      {/* Side by side with real space between them. Overlapped, the phone's
          chat and the desktop's chat read as one smeared window. */}
      <div style={{ display: "flex", alignItems: "center", gap: 54, transform: "translateY(-26px)" }}>
        <BrowserFrame src="client-widget-answer" width={1290} height={750} />
        <div
          style={{
            transform: `translateX(${interpolate(phone, [0, 1], [110, 0])}px)`,
            opacity: phone,
          }}
        >
          <PhoneFrame src="p-client-widget-answer" height={660} />
        </div>
      </div>
      <Headline text="DTT Bhutan" kind="label" from={f(0.2)} bottom={62} size={44} />
    </Stage>
  );
};

// ──────────────────────────────────────────── 9. the personal brand
/** Whose work this is. The tiles behind are the film's own shots, so the card
 * sits on the project rather than on a stock background. */
const TILES = ["home", "client-answer", "destinations", "package-detail", "admin-knowledge", "custom-tour"];

export const PersonalBrand: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const dim = interpolate(frame, [f(3.9), f(5.0)], [1, 0.16], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const card = spring({ frame: frame - f(4.3), fps, durationInFrames: 30, config: { damping: 200 } });

  return (
    <Stage>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gridAutoRows: "min-content",
          alignContent: "center",
          gap: 30,
          padding: 70,
          opacity: dim,
        }}
      >
        {TILES.map((src, i) => {
          const on = interpolate(frame, [f(0.1 + i * 0.13), f(0.5 + i * 0.13)], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div
              key={src}
              style={{
                opacity: on,
                transform: `translateY(${interpolate(on, [0, 1], [26, 0])}px)`,
                borderRadius: 12,
                overflow: "hidden",
                border: `1px solid ${COLORS.line}`,
              }}
            >
              <Img src={staticFile(`captures/${src}.png`)} style={{ width: "100%", display: "block" }} />
            </div>
          );
        })}
      </div>

      <div
        style={{
          position: "absolute",
          opacity: card,
          transform: `scale(${0.94 + card * 0.06})`,
          textAlign: "center",
        }}
      >
        <p
          style={{
            margin: 0,
            font: `700 110px/1 ${FONTS.body}`,
            letterSpacing: "0.02em",
            color: "#fff",
          }}
        >
          jambayang<span style={{ color: COLORS.gold400 }}>.com</span>
        </p>
        <p
          style={{
            margin: "30px 0 0",
            font: `500 34px/1.4 ${FONTS.display}`,
            color: COLORS.textDim,
          }}
        >
          Websites and digital experiences for businesses
        </p>
      </div>

      <Headline text="jambayang.com" kind="label" from={f(0.4)} until={f(4.0)} size={42} />
    </Stage>
  );
};

// ──────────────────────────────────────────── 10. the end
export const TheEnd: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const on = spring({ frame, fps, durationInFrames: 24, config: { damping: 200 } });

  return (
    <Stage>
      <div style={{ opacity: on, transform: `translateY(${interpolate(on, [0, 1], [20, 0])}px)`, textAlign: "center" }}>
        <p
          style={{
            margin: 0,
            font: `600 92px/1.25 ${FONTS.display}`,
            color: "#fff",
            letterSpacing: "-0.02em",
          }}
        >
          Building. Designing. Shipping.
        </p>
        <p
          style={{
            margin: "40px 0 0",
            font: `600 32px/1 ${FONTS.body}`,
            letterSpacing: "0.16em",
            color: COLORS.gold400,
          }}
        >
          jambayang.com
        </p>
      </div>
    </Stage>
  );
};

/** Exported so the composition can assert the film shows the question the
 * client's script names, and not some other one. */
export const SCRIPTED_QUESTION = SEVEN_DAY_REPLY.question;
