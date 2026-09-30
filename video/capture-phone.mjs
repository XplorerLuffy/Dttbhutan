import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

/**
 * Photographs the real site at phone width, for the vertical cut.
 *
 * The landscape film could fit a 16:9 capture whole and still be read. A 9:16
 * frame cannot: a desktop screenshot placed in it renders about a third of the
 * height and every label in it is too small to read on a phone. So the vertical
 * cut is built from captures of the site as a phone actually renders it —
 * which is also the honest thing to show, since that is how most of this site's
 * visitors see it.
 *
 * 390x844 at 3x, the iPhone viewport the responsive work was done against.
 */
const BASE = process.env.CAPTURE_BASE ?? "http://localhost:3311";
const OUT = process.env.CAPTURE_OUT ?? "video/public/captures";
fs.mkdirSync(OUT, { recursive: true });

const PAGES = [
  ["home", "/"],
  ["packages", "/packages"],
  ["package", "/packages/7-day-essential-bhutan-journey"],
  ["package-trek", "/packages/jomolhari-base-camp-trek"],
  ["destinations", "/destinations"],
  ["destination", "/destinations/paro"],
  ["custom-tour", "/custom-tour"],
  ["travel-guide", "/travel-guide"],
  ["guides", "/guides"],
  ["assistant", "/assistant"],
];

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
});
const page = await ctx.newPage();

/** Scroll-triggered reveals have to be fired before a capture, or half the
 * page photographs at zero opacity. Bounded, because a lazy image below the
 * fold never fires load at all. */
async function settle(p) {
  await p.evaluate(async () => {
    const step = window.innerHeight * 0.7;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 90));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 400));
  });
  await p.evaluate(() =>
    Promise.race([
      Promise.all(
        Array.from(document.images)
          .filter((i) => !i.complete)
          .map((i) => new Promise((r) => { i.onload = i.onerror = r; }))
      ),
      new Promise((r) => setTimeout(r, 3000)),
    ])
  );
  await p.waitForTimeout(400);
}

for (const [name, url] of PAGES) {
  console.log(`→ ${url}`);
  await page.goto(`${BASE}${url}`, { waitUntil: "networkidle", timeout: 60000 });
  await settle(page);

  const viewport = path.join(OUT, `p-${name}.png`);
  await page.screenshot({ path: viewport, animations: "disabled" });

  // The full page too: the vertical cut scrolls these rather than cutting.
  const full = path.join(OUT, `p-${name}-full.png`);
  await page.screenshot({ path: full, fullPage: true, animations: "disabled" });

  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  console.log(`  p-${name}.png  +  p-${name}-full.png (${h}px tall)`);
}

await ctx.close();
await browser.close();
console.log(`\n${PAGES.length * 2} phone captures written to ${OUT}`);
