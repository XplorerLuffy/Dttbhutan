import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

/**
 * Re-photographs the homepage, and re-measures where its sections now sit.
 *
 * The homepage's section order changes from time to time — Featured
 * Collections moved above the value band — and when it does, two things in
 * the films go stale at once: the pictures, and the pan positions the Design
 * scene uses to stop on a named section. Measuring here rather than by eye is
 * what keeps a label from naming a section the window has already left.
 *
 * Run from the repository root:  node video/recapture-home.mjs
 */
const BASE = process.env.CAPTURE_BASE ?? "http://localhost:3311";
const OUT = process.env.CAPTURE_OUT ?? "video/public/captures";
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });

async function settle(page) {
  await page.evaluate(async () => {
    // Scroll the whole page so the reveal animations have fired before the
    // photograph; a full-page capture of an unscrolled page is half blank.
    for (let y = 0; y < document.body.scrollHeight; y += 400) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 55));
    }
    window.scrollTo(0, 0);
    const pending = Array.from(document.images).filter((i) => !i.complete);
    await Promise.race([
      Promise.all(pending.map((i) => new Promise((r) => { i.onload = i.onerror = r; }))),
      new Promise((r) => setTimeout(r, 3000)),
    ]);
  });
  await page.waitForTimeout(600);
}

// ───────────────────────────── desktop
const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.25 });
{
  const page = await desktop.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await settle(page);

  await page.screenshot({ path: path.join(OUT, "home.png"), animations: "disabled" });
  await page.screenshot({ path: path.join(OUT, "home-full.png"), fullPage: true, animations: "disabled" });

  const measured = await page.evaluate(() => ({
    pageHeight: document.body.scrollHeight,
    viewport: document.documentElement.clientHeight,
    sections: Array.from(document.querySelectorAll("h1, h2")).map((h) => ({
      text: h.innerText.trim().replace(/\s+/g, " "),
      top: Math.round(h.getBoundingClientRect().top + window.scrollY),
    })),
  }));
  console.log(`\nhomepage: ${measured.pageHeight}px tall at 1440 wide, ${measured.viewport}px viewport`);
  for (const s of measured.sections) console.log(`  ${String(s.top).padStart(6)}  ${s.text}`);
  fs.writeFileSync(path.join(OUT, "home-sections.json"), JSON.stringify(measured, null, 2));

  // The chat button, scrolled to where it is unmistakably on the page.
  await page.evaluate(() => window.scrollTo(0, 600));
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, "home-chat-button.png"), animations: "disabled" });
  console.log("\nhome.png, home-full.png, home-chat-button.png");
}

// ───────────────────────────── phone
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await settle(page);
  await page.screenshot({ path: path.join(OUT, "p-home.png"), animations: "disabled" });
  await page.screenshot({ path: path.join(OUT, "p-home-full.png"), fullPage: true, animations: "disabled" });
  await page.screenshot({ path: path.join(OUT, "phone-home.png"), animations: "disabled" });
  console.log("p-home.png, p-home-full.png, phone-home.png");
  await ctx.close();
}

await desktop.close();
await browser.close();
