import { Config } from "@remotion/cli/config";

/**
 * JPEG frames rather than PNG: 6,600 frames at 1920x1080 is the one part of
 * this render that can exhaust a container's disk, and the difference is
 * invisible once h264 has encoded it.
 */
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setConcurrency(2);

/** The captures are photographs of a real website; scaling them down inside a
 * browser frame is where most of this video's detail lives. */
Config.setChromiumOpenGlRenderer("angle");

/**
 * Render with the Chromium already on this machine.
 *
 * Remotion otherwise downloads its own headless shell from remotion.media on
 * first render, which this container's network policy blocks. Point it at the
 * browser that is already installed (Playwright's, at PLAYWRIGHT_BROWSERS_PATH)
 * and nothing needs to be fetched. Override with REMOTION_BROWSER_EXECUTABLE on
 * a machine where it lives somewhere else; leave it unset and Remotion goes
 * back to managing its own, which is the right default anywhere with network.
 */
const LOCAL_CHROME =
  process.env.REMOTION_BROWSER_EXECUTABLE ??
  (process.env.PLAYWRIGHT_BROWSERS_PATH
    ? `${process.env.PLAYWRIGHT_BROWSERS_PATH}/chromium_headless_shell-1194/chrome-linux/headless_shell`
    : undefined);

if (LOCAL_CHROME) {
  Config.setBrowserExecutable(LOCAL_CHROME);
}
