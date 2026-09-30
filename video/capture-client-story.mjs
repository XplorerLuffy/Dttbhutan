import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

/**
 * Photographs the one exchange the client-story film shows.
 *
 * The film's AI beat is scripted around a specific question — "I'm visiting
 * Bhutan for 7 days. What should I see?" — so these captures are of the real
 * DRUKA components answering exactly that, with exactly the words production
 * returned for it on 2026-09-30. As in capture-assistant.mjs, only the HTTP
 * call to /api/chat is intercepted, because the render container cannot reach
 * the AI provider; the reply is replayed byte for byte, never regenerated.
 *
 * Run from the repository root (the script resolves playwright from there):
 *   node video/capture-client-story.mjs
 */
const BASE = process.env.CAPTURE_BASE ?? "http://localhost:3311";
const OUT = process.env.CAPTURE_OUT ?? "video/public/captures";
fs.mkdirSync(OUT, { recursive: true });

// Verbatim from production. Kept in step with video/src/data/productionReplies.ts.
const SEVEN_DAY = {
  question: "I'm visiting Bhutan for 7 days. What should I see?",
  conversationId: "cmuobgior0000jy04gneoj6oc",
  message:
    "Sounds exciting!  To help you pin down a great 7‑day itinerary, could you share a bit more:\n\n" +
    "1. Do you already have dates in mind for your trip?  \n" +
    "2. What kind of experiences are most important to you? (e.g., cultural sites, trekking, festivals, wildlife, relaxation, photography)  \n\n" +
    "That’ll let me suggest a mix that fits both your schedule and your interests.",
};

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const log = [];

async function replay(page, replies) {
  const queue = [...replies];
  await page.route("**/api/chat", async (route) => {
    const next = queue.shift();
    if (!next) return route.abort();
    await new Promise((r) => setTimeout(r, 900));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ message: next.message, conversationId: next.conversationId, cards: [] }),
    });
  });
}

async function ask(page, text) {
  const box = page.getByLabel("Message the travel assistant");
  await box.click();
  await box.type(text, { delay: 12 });
  await page.waitForTimeout(250);
}

async function shoot(page, name, opts = {}) {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, animations: "disabled", ...opts });
  log.push(name);
  console.log(`  ${name}.png  ${(fs.statSync(file).size / 1024).toFixed(0)}kB`);
}

async function settleImages(page) {
  await page.evaluate(() => {
    const pending = Array.from(document.images).filter((i) => !i.complete);
    return Promise.race([
      Promise.all(pending.map((i) => new Promise((r) => { i.onload = i.onerror = r; }))),
      new Promise((r) => setTimeout(r, 3000)),
    ]);
  });
  await page.waitForTimeout(400);
}

/** The whole reply is on screen once its closing sentence is. */
const ANSWERED = "fits both your schedule and your interests";

// ───────────────────────────── /assistant, desktop
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await replay(page, [SEVEN_DAY]);

  console.log("→ /assistant, question typed");
  await page.goto(`${BASE}/assistant`, { waitUntil: "networkidle" });
  await settleImages(page);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);
  await ask(page, SEVEN_DAY.question);
  await shoot(page, "client-typing");

  console.log("→ /assistant, thinking");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(450);
  await shoot(page, "client-thinking");

  console.log("→ /assistant, answered");
  await page.waitForFunction((n) => document.body.innerText.includes(n), ANSWERED, { timeout: 20000 });
  await page.waitForTimeout(900);
  await shoot(page, "client-answer");
  await shoot(page, "client-answer-full", { fullPage: true });
  await ctx.close();
}

// ───────────────────────────── the widget, on the homepage
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await replay(page, [SEVEN_DAY]);

  console.log("→ widget on the homepage, answered");
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await settleImages(page);
  const button = page.getByRole("button", { name: /DRUKA|assistant|chat/i }).last();
  await button.click();
  await page.waitForTimeout(900);
  await ask(page, SEVEN_DAY.question);
  await page.keyboard.press("Enter");
  await page.waitForFunction((n) => document.body.innerText.includes(n), ANSWERED, { timeout: 20000 });
  await page.waitForTimeout(900);
  await shoot(page, "client-widget-answer");
  await ctx.close();
}

// ───────────────────────────── the widget, at phone width
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
  const page = await ctx.newPage();
  await replay(page, [SEVEN_DAY]);

  console.log("→ widget on a phone, answered");
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await settleImages(page);
  const b = page.getByRole("button", { name: /DRUKA|assistant|chat/i }).last();
  await b.click();
  await page.waitForTimeout(900);
  await ask(page, SEVEN_DAY.question);
  await page.keyboard.press("Enter");
  await page.waitForFunction((n) => document.body.innerText.includes(n), ANSWERED, { timeout: 20000 });
  await page.waitForTimeout(900);
  await shoot(page, "p-client-widget-answer");
  await ctx.close();
}

console.log(`\n${log.length} captures`);
await browser.close();
