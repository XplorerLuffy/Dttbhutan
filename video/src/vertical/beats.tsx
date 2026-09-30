import React from "react";
import { AbsoluteFill, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { COLORS, FONTS } from "../theme";
import { useSceneSeconds } from "../timing";
import { Caption, BigStat, CAPTION_TOP } from "./Caption";
import { PhoneShot, Backdrop } from "./PhoneShot";
import { CodeWindow } from "../components/CodeWindow";
import { SNIPPETS } from "../data/codeSnippets";
import { FACTS } from "../data/projectFacts";
import { VERTICAL_VO } from "../data/verticalVoiceover";

/**
 * The nine beats of the vertical cut.
 *
 * They live in one file rather than nine because each is a few dozen lines —
 * the landscape film's scenes earn their own files, these do not, and reading
 * the whole thing top to bottom is how you check a fifty-second video hangs
 * together.
 *
 * Every beat obeys the same two rules, which are the platform's, not mine:
 * the picture stays above y=1200 and the caption sits at 1240, because below
 * that is TikTok's own caption and username; and nothing important goes past
 * x=880 between y=900 and y=1650, because that is the like/comment/share rail.
 */
const caption = (id: string) => VERTICAL_VO.find((l) => l.id === id)!.caption;

/** Where a beat's picture sits, given the caption below it. */
const STAGE: React.CSSProperties = {
  position: "absolute",
  left: 0,
  right: 0,
  top: 120,
  height: CAPTION_TOP - 180,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

// ─────────────────────────────────────────────────────── 1. the hook
/**
 * No fade from black, no title card, no build. The site is on screen and
 * already moving at frame one, because a TikTok that opens on black is a
 * TikTok nobody sees the second second of.
 */
export const Hook: React.FC = () => {
  const t = useSceneSeconds();
  return (
    <AbsoluteFill>
      <Backdrop src="p-home" opacity={0.3} />
      <div style={STAGE}>
        <PhoneShot
          src="p-home-full"
          height={1010}
          scrollFrom={0}
          scrollTo={0.06}
          scrollOver={[0, t(3.4)]}
          zoomFrom={1.03}
          zoomTo={1}
        />
      </div>
      <Caption text={caption("hook")} from={t(0.1)} />
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────── 2. the platform
export const Platform: React.FC = () => {
  const t = useSceneSeconds();
  const third = t(2.35);

  return (
    <AbsoluteFill>
      <Backdrop src="p-packages" opacity={0.26} />

      <Sequence durationInFrames={third}>
        <div style={STAGE}>
          <PhoneShot src="p-packages-full" height={1010} scrollFrom={0.01} scrollTo={0.1} scrollOver={[0, third]} />
        </div>
      </Sequence>

      <Sequence from={third} durationInFrames={third}>
        <div style={STAGE}>
          <PhoneShot src="p-destinations-full" height={1010} scrollFrom={0.05} scrollTo={0.42} scrollOver={[0, third]} />
        </div>
      </Sequence>

      <Sequence from={third * 2}>
        <div style={STAGE}>
          <PhoneShot src="p-package-full" height={1010} scrollFrom={0.02} scrollTo={0.3} scrollOver={[0, third]} />
        </div>
      </Sequence>

      {/* The figures, because a number said out loud goes past too quickly. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 950,
          display: "flex",
          justifyContent: "center",
          gap: 74,
        }}
      >
        <BigStat value={String(FACTS.packages)} label="tour packages" from={t(0.5)} />
        <BigStat value={String(FACTS.dzongkhags)} label="districts" from={t(2.6)} />
      </div>

      <Caption text={caption("platform")} from={t(0.2)} />
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────── 3. the backend
export const Backend: React.FC = () => {
  const t = useSceneSeconds();

  return (
    <AbsoluteFill style={{ background: COLORS.ink }}>
      <Backdrop src="p-package" opacity={0.12} />

      <div style={{ ...STAGE, flexDirection: "column", gap: 44 }}>
        <div style={{ display: "flex", gap: 56, justifyContent: "center" }}>
          <BigStat value={String(FACTS.apiRoutes)} label="API routes" from={t(0.3)} />
          <BigStat value={String(FACTS.models)} label="DB models" from={t(1.1)} />
          <BigStat value="5" label="account types" from={t(1.9)} />
        </div>

        {/* Real code, narrow enough to read on a phone. */}
        <div
          style={{
            opacity: interpolate(useCurrentFrame(), [t(2.4), t(3.0)], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          <CodeWindow
            path={SNIPPETS.bookingRoute.path}
            code={SNIPPETS.bookingRoute.code.split("\n").slice(0, 14).join("\n")}
            startLine={SNIPPETS.bookingRoute.startLine}
            width={900}
            fontSize={21}
            typeOver={[t(2.8), t(5.6)]}
            highlight={[8, 12]}
          />
        </div>
      </div>

      <Caption text={caption("backend")} from={t(0.2)} />
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────── 4. the turn
/** The one beat with no product in it. Two seconds of dark is what makes the
 * assistant land as a decision rather than a feature. */
export const Turn: React.FC = () => {
  const t = useSceneSeconds();
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ background: COLORS.ink, alignItems: "center", justifyContent: "center" }}>
      <p
        style={{
          margin: 0,
          maxWidth: 880,
          textAlign: "center",
          font: `700 76px/1.2 ${FONTS.display}`,
          color: "#fff",
          opacity: interpolate(frame, [t(0.15), t(0.6)], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          transform: `translateY(${interpolate(frame, [t(0.15), t(0.7)], [22, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })}px)`,
        }}
      >
        Then I wanted more
        <br />
        than a website.
      </p>
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────── 5. the assistant
export const Assistant: React.FC = () => {
  const t = useSceneSeconds();
  const frame = useCurrentFrame();
  const rise = interpolate(frame, [0, t(0.8)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <Backdrop src="p-assistant" opacity={0.3} />
      <div style={STAGE}>
        <div
          style={{
            opacity: rise,
            transform: `translateY(${interpolate(rise, [0, 1], [90, 0])}px)`,
          }}
        >
          <PhoneShot src="p-assistant-full" height={1010} scrollFrom={0} scrollTo={0.14} scrollOver={[0, t(4.8)]} />
        </div>
      </div>
      <Caption text={caption("ai")} from={t(0.3)} accent={COLORS.gold400} />
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────── 6. the knowledge
/** The one diagram that is naturally vertical, so it is the one that survives
 * the format: documents down to an answer, a step at a time. */
const STEPS: { label: string; note: string }[] = [
  { label: `${FACTS.knowledgeDocuments} documents`, note: "visa, the daily fee, tours, destinations" },
  { label: `${FACTS.knowledgeChunks} passages`, note: "split for retrieval" },
  { label: "Embeddings", note: `vector(${FACTS.embeddingDimensions}) in pgvector` },
  { label: "Searched by meaning", note: "not by keyword" },
];

export const Knowledge: React.FC = () => {
  const t = useSceneSeconds();
  const frame = useCurrentFrame();
  const toAdmin = t(4.6);

  return (
    <AbsoluteFill style={{ background: COLORS.ink }}>
      <Backdrop src="p-assistant" opacity={0.1} />

      <Sequence durationInFrames={toAdmin}>
        <div style={{ ...STAGE, flexDirection: "column", gap: 0 }}>
          {STEPS.map((step, i) => {
            const at = t(0.35 + i * 0.75);
            const on = interpolate(frame, [at, at + 9], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const last = i === STEPS.length - 1;
            return (
              <React.Fragment key={step.label}>
                {i > 0 && <div style={{ width: 3, height: 30, background: COLORS.gold400, opacity: on }} />}
                <div
                  style={{
                    opacity: on,
                    transform: `translateY(${interpolate(on, [0, 1], [14, 0])}px)`,
                    width: 820,
                    borderRadius: 16,
                    padding: "22px 30px",
                    textAlign: "center",
                    background: last ? "rgba(242,162,39,0.14)" : "rgba(255,255,255,0.05)",
                    border: `2px solid ${last ? "rgba(242,162,39,0.55)" : COLORS.line}`,
                  }}
                >
                  <p style={{ margin: 0, font: `700 44px/1.15 ${FONTS.body}`, color: last ? COLORS.gold300 : "#fff" }}>
                    {step.label}
                  </p>
                  <p style={{ margin: "8px 0 0", font: `400 26px/1.3 ${FONTS.mono}`, color: COLORS.textFaint }}>
                    {step.note}
                  </p>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </Sequence>

      {/* And the screen the client keeps it current from. This belongs in a
          video meant to win work: it is the difference between "I wired up an
          AI" and "I built something they can run". Captured at phone width —
          the desktop shot put a 16:9 image in a 9:16 phone and left half the
          screen white. */}
      <Sequence from={toAdmin}>
        <div style={STAGE}>
          <PhoneShot
            src="p-admin-knowledge-full"
            height={1010}
            scrollFrom={0.02}
            scrollTo={0.3}
            scrollOver={[0, t(3.4)]}
          />
        </div>
      </Sequence>

      <Caption text={caption("knowledge")} from={t(0.2)} />
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────── 7. the answer
export const Answer: React.FC = () => {
  const t = useSceneSeconds();
  const frame = useCurrentFrame();
  const toPhone = t(2.6);

  return (
    <AbsoluteFill style={{ background: COLORS.ink }}>
      <Backdrop src="p-assistant" opacity={0.14} />

      {/* The question, as a traveller would ask it. */}
      <Sequence durationInFrames={toPhone}>
        <div style={{ ...STAGE, flexDirection: "column", gap: 34 }}>
          <p
            style={{
              margin: 0,
              maxWidth: 900,
              textAlign: "center",
              font: `600 54px/1.3 ${FONTS.display}`,
              color: "#fff",
              opacity: interpolate(frame, [t(0.1), t(0.6)], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            &ldquo;What is the Sustainable
            <br />
            Development Fee in Bhutan?&rdquo;
          </p>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            {["Search the knowledge base", "Find the relevant passages", "Answer from those"].map((step, i) => {
              const at = t(0.9 + i * 0.5);
              const on = interpolate(frame, [at, at + 8], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              return (
                <p
                  key={step}
                  style={{
                    margin: 0,
                    opacity: on,
                    font: `600 34px/1 ${FONTS.body}`,
                    color: COLORS.gold300,
                    background: "rgba(242,162,39,0.10)",
                    border: `1px solid rgba(242,162,39,0.3)`,
                    borderRadius: 999,
                    padding: "14px 30px",
                  }}
                >
                  {step}
                </p>
              );
            })}
          </div>
        </div>
      </Sequence>

      {/* The answer production actually gave, in the real UI. */}
      <Sequence from={toPhone}>
        <div style={STAGE}>
          <PhoneShot src="phone-widget-answer" height={1010} zoomFrom={1.04} zoomTo={1} scrollOver={[0, t(4)]} />
        </div>
      </Sequence>

      <Caption text={caption("rag")} from={t(0.2)} />
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────── 8. everywhere
export const Everywhere: React.FC = () => {
  const t = useSceneSeconds();
  return (
    <AbsoluteFill>
      <Backdrop src="p-package" opacity={0.28} />
      <div style={{ ...STAGE, gap: 30 }}>
        <PhoneShot src="phone-widget-closed" height={880} />
        <PhoneShot src="phone-widget-open" height={880} />
      </div>
      <Caption text={caption("everywhere")} from={t(0.1)} />
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────── 9. the ask
/** The only beat that asks for anything. It is why the video exists. */
export const CallToAction: React.FC = () => {
  const t = useSceneSeconds();
  const frame = useCurrentFrame();

  const fade = (from: number) =>
    interpolate(frame, [t(from), t(from + 0.5)], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  return (
    <AbsoluteFill style={{ background: COLORS.ink }}>
      <Backdrop src="p-home" opacity={0.16} />

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 0 }}>
        <Img
          src={staticFile("logo/droelma-mark-reverse.png")}
          style={{ width: 130, marginBottom: 40, opacity: fade(0.2) }}
        />
        <p
          style={{
            margin: 0,
            font: `700 88px/1.05 ${FONTS.display}`,
            color: "#fff",
            letterSpacing: "0.02em",
            opacity: fade(0.4),
          }}
        >
          DTT BHUTAN
        </p>
        <p
          style={{
            margin: "18px 0 0",
            font: `400 32px/1.4 ${FONTS.body}`,
            color: COLORS.textDim,
            opacity: fade(0.7),
          }}
        >
          built for a client in Bhutan
        </p>

        <div style={{ height: 90 }} />

        <p
          style={{
            margin: 0,
            font: `700 52px/1.25 ${FONTS.body}`,
            color: "#fff",
            textAlign: "center",
            opacity: fade(2.0),
          }}
        >
          I build websites like this.
        </p>
        <p
          style={{
            margin: "26px 0 0",
            font: `700 62px/1 ${FONTS.body}`,
            color: COLORS.gold400,
            background: "rgba(242,162,39,0.12)",
            border: "2px solid rgba(242,162,39,0.5)",
            borderRadius: 999,
            padding: "20px 46px",
            opacity: fade(2.6),
          }}
        >
          jambayang.com
        </p>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
