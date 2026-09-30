import React from "react";
import { FPS } from "./theme";

/**
 * How fast a scene runs relative to how it was written.
 *
 * Every scene was choreographed at the timings the original brief gave — a
 * cursor that takes 1.3 seconds to cross a page, a code window that types on
 * over five. Cutting the film to two minutes with a voiceover changed how long
 * each chapter gets, but not how any of it should be choreographed: the same
 * moves, in the same order, faster.
 *
 * So rather than rewriting fourteen scenes' worth of timings by hand — and
 * getting some of them subtly wrong — the composition tells each scene the
 * ratio between the time it has and the time it was written for, and the scene
 * reads its timings through `useSceneSeconds`. A scene stays readable as one
 * piece of choreography, and re-cutting the film again is a change to one
 * table.
 */
export const SceneScaleContext = React.createContext(1);

/**
 * Returns a `seconds()` that speaks in the scene's own written time.
 *
 * Use it in place of the module-level `seconds` inside any scene: `t(3.4)` is
 * "the moment this scene calls 3.4 seconds", wherever that lands in the cut.
 */
export function useSceneSeconds(): (s: number) => number {
  const scale = React.useContext(SceneScaleContext);
  return React.useCallback((s: number) => Math.round(s * FPS * scale), [scale]);
}
