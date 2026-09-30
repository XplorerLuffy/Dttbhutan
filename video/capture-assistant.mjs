import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

/**
 * Photographs the real DRUKA UI holding real production answers.
 *
 * Both halves matter. The pixels are the actual components — AssistantWorkspace,
 * AssistantThread, AssistantComposer, AiChatWidget — driven by typing into the
 * real composer and letting the real client code render the reply. The words are
 * what https://dttbhutan.vercel.app/api/chat actually returned on 2026-09-30.
 *
 * Only the HTTP call between them is intercepted, because this container's
 * network policy blocks the AI provider. Nothing is written for the video: the
 * interceptor replays a recorded response byte for byte.
 */
const BASE = process.env.CAPTURE_BASE ?? "http://localhost:3311";
const OUT = process.env.CAPTURE_OUT ?? "video/public/captures";
fs.mkdirSync(OUT, { recursive: true });

// Verbatim from production. Kept in step with video/src/data/productionReplies.ts.
const SDF = {
  question: "What is the Sustainable Development Fee in Bhutan?",
  conversationId: "cmuo2nujp0000js04512rnauy",
  message:
    "Bhutan levies a **daily Sustainable Development Fee (SDF)** on every international visitor.\n" +
    "It’s charged per person, per night, and is separate from hotels, guides, transport, and meals. " +
    "The exact amount can vary by nationality and the dates of your stay, so it’s best to check the " +
    "current figure with us or on the travel team before you book.\n\n" +
    "Would you like to know how the fee might impact the cost of a particular trip you’re considering?",
};

const PLAN = {
  question: "Help me plan my trip to Bhutan. I have about a week.",
  conversationId: "cmuo2onod0004js04ajlv6ecz",
  message:
    "That sounds wonderful! A week gives you a good balance of travel and exploration. Do you already " +
    "have dates in mind, or any particular places or activities you’re keen to experience in Bhutan? " +
    "This will help me suggest the best options for your stay.",
};

const MEMORY = [
  {
    question: "I am travelling with my family - two adults and two children aged 9 and 12.",
    conversationId: "cmuo36j4i0003jn0464z9prnz",
    message:
      "Sounds lovely! To find the best options for you and your family, could you let me know:\n\n" +
      "1. Which part of Bhutan you’d like to visit (or if you’re open to a few suggestions)?\n" +
      "2. When you’re planning to travel and how many days you’d have in total?\n" +
      "3. Anything you’re particularly interested in—culture, trekking, wildlife, festivals, or a mix?\n" +
      "4. Your preferred style: relaxed, packed, luxury, or budget?\n\n" +
      "These details will let me pull up the most suitable packages for your family.",
  },
  {
    question: "Can you adjust the trip for us?",
    conversationId: "cmuo36j4i0003jn0464z9prnz",
    message:
      "Sure thing! Could you share a bit more about what you’re looking for? For example:\n\n" +
      "- The part of Bhutan you’d like to explore and the dates or season.\n" +
      "- How many days you plan to spend in total.\n" +
      "- Any specific interests (culture, trekking, wildlife, festivals) or accommodation preferences.\n\n" +
      "Once we have that, I can fine‑tune a family‑friendly itinerary for you.",
  },
];

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const log = [];

/** Serves the recorded replies in order, one per POST. */
async function replay(page, replies) {
  const queue = [...replies];
  await page.route("**/api/chat", async (route) => {
    const next = queue.shift();
    if (!next) return route.abort();
    // A beat of latency so the typing indicator is real rather than skipped.
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
  // Typed rather than filled: the video shows the composer mid-keystroke too.
  await box.type(text, { delay: 12 });
  await page.waitForTimeout(250);
}

async function send(page) {
  await page.keyboard.press("Enter");
}

async function shoot(page, name, clip) {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, animations: "disabled", ...(clip ? { clip } : {}) });
  log.push({ name, bytes: fs.statSync(file).size });
  console.log(`  ${name}.png  ${(fs.statSync(file).size / 1024).toFixed(0)}kB`);
}

/** Bounded, because a `loading="lazy"` image below the fold never fires load
 * at all and an unbounded wait on it hangs the whole capture. */
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

// ───────────────────────────── the /assistant page
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await replay(page, [SDF, PLAN]);

  console.log("→ /assistant (empty)");
  await page.goto(`${BASE}/assistant`, { waitUntil: "networkidle" });
  await settleImages(page);
  await shoot(page, "assistant-empty");
  await page.screenshot({ path: path.join(OUT, "assistant-empty-full.png"), fullPage: true, animations: "disabled" });
  console.log("  assistant-empty-full.png");

  console.log("→ /assistant (question typed, not yet sent)");
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(400);
  await ask(page, SDF.question);
  await shoot(page, "assistant-typing");

  console.log("→ /assistant (thinking)");
  await send(page);
  await page.waitForTimeout(450);
  await shoot(page, "assistant-thinking");

  console.log("→ /assistant (answered)");
  await page.waitForFunction((needle) => document.body.innerText.includes(needle), "Sustainable Development Fee (SDF)", { timeout: 20000 });
  await page.waitForTimeout(900);
  await shoot(page, "assistant-answer-sdf");
  await page.screenshot({ path: path.join(OUT, "assistant-answer-sdf-full.png"), fullPage: true, animations: "disabled" });
  console.log("  assistant-answer-sdf-full.png");

  console.log("→ /assistant (second exchange)");
  await ask(page, PLAN.question);
  await send(page);
  await page.waitForFunction(() => document.body.innerText.includes("A week gives you a good balance"), { timeout: 20000 });
  await page.waitForTimeout(900);
  await shoot(page, "assistant-answer-plan");
  await ctx.close();
}

// ───────────────────────────── the memory thread, one conversation
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await replay(page, MEMORY);

  console.log("→ /assistant (memory thread)");
  await page.goto(`${BASE}/assistant`, { waitUntil: "networkidle" });
  await settleImages(page);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await ask(page, MEMORY[0].question);
  await send(page);
  await page.waitForFunction(() => document.body.innerText.includes("Sounds lovely!"), { timeout: 20000 });
  await page.waitForTimeout(700);
  await shoot(page, "assistant-memory-1");

  await ask(page, MEMORY[1].question);
  await send(page);
  await page.waitForFunction(() => document.body.innerText.includes("family‑friendly itinerary"), { timeout: 20000 });
  await page.waitForTimeout(900);
  await shoot(page, "assistant-memory-2");
  await page.screenshot({ path: path.join(OUT, "assistant-memory-full.png"), fullPage: true, animations: "disabled" });
  console.log("  assistant-memory-full.png");
  await ctx.close();
}

// ───────────────────────────── the widget, inside the website
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await replay(page, [SDF, PLAN]);

  console.log("→ widget on a package page (closed)");
  await page.goto(`${BASE}/packages/7-day-essential-bhutan-journey`, { waitUntil: "networkidle" });
  await settleImages(page);
  await shoot(page, "widget-closed-package");

  const button = page.getByRole("button", { name: /DRUKA|assistant|chat/i }).last();
  console.log("→ widget open (greeting)");
  await button.click();
  await page.waitForTimeout(900);
  await settleImages(page);
  await shoot(page, "widget-open-greeting");

  console.log("→ widget answering");
  await ask(page, SDF.question);
  await shoot(page, "widget-typing");
  await send(page);
  await page.waitForTimeout(450);
  await shoot(page, "widget-thinking");
  await page.waitForFunction(() => document.body.innerText.includes("Sustainable Development Fee (SDF)"), { timeout: 20000 });
  await page.waitForTimeout(900);
  await shoot(page, "widget-answer-sdf");

  console.log("→ widget on the homepage");
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await settleImages(page);
  const homeButton = page.getByRole("button", { name: /DRUKA|assistant|chat/i }).last();
  await homeButton.click();
  await page.waitForTimeout(900);
  await ask(page, PLAN.question);
  await send(page);
  await page.waitForFunction(() => document.body.innerText.includes("A week gives you a good balance"), { timeout: 20000 });
  await page.waitForTimeout(900);
  await shoot(page, "widget-answer-home");
  await ctx.close();
}

// ───────────────────────────── the widget at phone width
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
  const page = await ctx.newPage();
  await replay(page, [SDF]);
  console.log("→ widget on a phone");
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await settleImages(page);
  await page.screenshot({ path: path.join(OUT, "phone-widget-closed.png"), animations: "disabled" });
  const b = page.getByRole("button", { name: /DRUKA|assistant|chat/i }).last();
  await b.click();
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(OUT, "phone-widget-open.png"), animations: "disabled" });
  await ask(page, SDF.question);
  await send(page);
  await page.waitForFunction(() => document.body.innerText.includes("Sustainable Development Fee (SDF)"), { timeout: 20000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT, "phone-widget-answer.png"), animations: "disabled" });
  console.log("  phone-widget-closed / open / answer .png");
  await ctx.close();
}

console.log(`\n${log.length} named captures + full-page and phone variants`);
await browser.close();
