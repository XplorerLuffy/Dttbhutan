import React from "react";
import { Composition, continueRender, delayRender, staticFile } from "remotion";
import { DttBhutanBuildStory, TOTAL_FRAMES } from "./compositions/DttBhutanBuildStory";
import { FPS } from "./theme";

/**
 * Loads the website's own two typefaces before anything renders.
 *
 * Fraunces and Plus Jakarta Sans are what DTT Bhutan itself uses (see
 * src/app/layout.tsx in the app), which is what keeps a title card and a screen
 * capture looking like the same product. They are served from public/fonts
 * rather than from Google, because the render container reaches fonts.googleapis
 * through a proxy Chromium will not trust — and a film that quietly falls back
 * to a system face when the network is missing is worse than one that carries
 * its fonts. Run `node fetch-fonts.mjs` to refresh them.
 *
 * delayRender holds the first frame until the faces are actually ready. Without
 * it the opening title can be photographed mid-swap, in the fallback face.
 */
const handle = delayRender("Loading the site's typefaces");

if (typeof document !== "undefined") {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = staticFile("fonts.css");
  link.onload = () => {
    document.fonts.ready.then(() => continueRender(handle));
  };
  link.onerror = () => {
    // Better a rendered film in the fallback face than no film at all — but
    // say so, because every frame of type will be wrong.
    console.warn("[video] public/fonts.css did not load; run node fetch-fonts.mjs");
    continueRender(handle);
  };
  document.head.appendChild(link);
} else {
  continueRender(handle);
}

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="DttBhutanBuildStory"
      component={DttBhutanBuildStory}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={1920}
      height={1080}
    />
  </>
);
