import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

/**
 * Photographs the real DTT Bhutan UI for the case-study video.
 *
 * The video's whole claim is that the UI on screen is the UI that exists, so
 * every frame of website footage in it comes from here rather than from
 * anything rebuilt inside Remotion.
 *
 * It runs against the locally-built production server rather than
 * dttbhutan.vercel.app because this container's network policy blocks that
 * host. Same commit, same `next build`, same components, same seeded content —
 * what differs is the hostname in the address bar, which the browser frame
 * draws separately and labels dttbhutan.vercel.app, the site these pages are.
 */
const BASE = process.env.CAPTURE_BASE ?? "http://localhost:3311";
const OUT = process.env.CAPTURE_OUT ?? "video/public/captures";
fs.mkdirSync(OUT, { recursive: true });

const VIEWPORT = { width: 1440, height: 900 };
/** Retina-ish, so a capture still reads when the camera pushes into it. */
const SCALE = 2;

const log = [];

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });

async function newPage(loggedInAs) {
  const ctx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: SCALE });
  const page = await ctx.newPage();
  if (loggedInAs) {
    await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
    await page.fill('input[type="email"]', loggedInAs);
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(admin|dashboard|vendor)/, { timeout: 30000 });
  }
  return { ctx, page };
}

/** Animations reveal on scroll (GSAP ScrollTrigger) and fade in (Framer
 * Motion). A capture taken too early catches half-transparent sections, so
 * every shot scrolls the whole page first to trigger them, then settles. */
async function settle(page) {
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.7;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 90));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 400));
  });
  // Images decode after layout; a capture without them is a grey box.
  await page.evaluate(() => Promise.all(Array.from(document.images).filter((i) => !i.complete).map((i) => new Promise((r) => { i.onload = i.onerror = r; }))));
  await page.waitForTimeout(500);
}

async function shoot(page, name, opts = {}) {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: Boolean(opts.fullPage), animations: "disabled" });
  const { width, height } = await page.evaluate(() => ({ width: document.documentElement.clientWidth, height: document.body.scrollHeight }));
  const bytes = fs.statSync(file).size;
  log.push({ name, fullPage: Boolean(opts.fullPage), cssWidth: width, cssHeight: opts.fullPage ? height : VIEWPORT.height, bytes });
  console.log(`  ${name}.png  ${(bytes / 1024).toFixed(0)}kB${opts.fullPage ? ` (full page, ${height}px tall)` : ""}`);
}

// ─────────────────────────────────────────────── public pages
{
  const { ctx, page } = await newPage();
  const PAGES = [
    ["home", "/", true],
    ["packages", "/packages", true],
    ["package-detail", "/packages/7-day-essential-bhutan-journey", true],
    ["package-trek", "/packages/jomolhari-base-camp-trek", false],
    ["destinations", "/destinations", true],
    ["destination-paro", "/destinations/paro", true],
    ["guides", "/guides", false],
    ["hotels", "/hotels", false],
    ["vehicles", "/vehicles", false],
    ["flights", "/flights", false],
    ["custom-tour", "/custom-tour", true],
    ["travel-guide", "/travel-guide", false],
    ["article-sdf", "/travel-guide/bhutans-sustainable-development-fee-explained", true],
    ["gallery", "/gallery", false],
    ["about", "/about", true],
    ["contact", "/contact", false],
    ["faq", "/faq", false],
    ["login", "/login", false],
    ["register", "/register", false],
    ["vendor-guide-register", "/vendor/guide/register", true],
  ];

  for (const [name, url, alsoFull] of PAGES) {
    console.log(`→ ${url}`);
    await page.goto(`${BASE}${url}`, { waitUntil: "networkidle", timeout: 60000 });
    await settle(page);
    await shoot(page, name);
    if (alsoFull) await shoot(page, `${name}-full`, { fullPage: true });
  }

  // The nav mega-menu, which only exists while hovered.
  console.log("→ nav mega-menu");
  await page.goto(`${BASE}/packages`, { waitUntil: "networkidle" });
  await settle(page);
  const trigger = page.locator("header").getByText("Destinations", { exact: true }).first();
  if (await trigger.count()) {
    await trigger.hover();
    await page.waitForTimeout(700);
    await shoot(page, "nav-megamenu");
  } else {
    console.log("  (no mega-menu trigger found — skipped)");
  }

  // The floating assistant button, closed, on a real page.
  console.log("→ chat button (closed)");
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await settle(page);
  await shoot(page, "home-chat-button");

  await ctx.close();
}

// ─────────────────────────────────────────────── phone width
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
  const page = await ctx.newPage();
  for (const [name, url] of [["phone-home", "/"], ["phone-package", "/packages/7-day-essential-bhutan-journey"]]) {
    console.log(`→ ${url} (phone)`);
    await page.goto(`${BASE}${url}`, { waitUntil: "networkidle", timeout: 60000 });
    await settle(page);
    const file = path.join(OUT, `${name}.png`);
    await page.screenshot({ path: file, animations: "disabled" });
    log.push({ name, cssWidth: 390, cssHeight: 844, bytes: fs.statSync(file).size });
    console.log(`  ${name}.png`);
  }
  await ctx.close();
}

// ─────────────────────────────────────────────── signed-in surfaces
for (const [name, email, url] of [
  ["dashboard-traveler", "traveler@example.com", "/dashboard"],
  ["admin-overview", "admin@dttbhutan.bt", "/admin"],
  ["admin-knowledge", "admin@dttbhutan.bt", "/admin/knowledge"],
  ["admin-content", "admin@dttbhutan.bt", "/admin/content"],
  ["admin-packages", "admin@dttbhutan.bt", "/admin/packages"],
]) {
  console.log(`→ ${url} (as ${email})`);
  try {
    const { ctx, page } = await newPage(email);
    await page.goto(`${BASE}${url}`, { waitUntil: "networkidle", timeout: 60000 });
    await settle(page);
    await shoot(page, name);
    await ctx.close();
  } catch (err) {
    console.log(`  SKIPPED (${err.message.split("\n")[0]})`);
  }
}

fs.writeFileSync("video/public/captures/manifest.json", JSON.stringify(log, null, 2));
console.log(`\n${log.length} captures written to ${OUT}`);
await browser.close();
