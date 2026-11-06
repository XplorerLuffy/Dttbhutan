import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseArticle, parseInline, tableOfContents } from "../articleFormat";

// Rebuilt from the "Lung Dhar" article as it displayed: every line its own
// paragraph, so headings, a list and a table arrive flattened.
const FLAT = [
  "Discover the spiritual meaning, five sacred colours, and ancient Buddhist traditions behind Bhutan's beautiful Lung Dhar prayer flags.",
  "When you travel through Bhutan, one of the most beautiful sights you will encounter is the colourful prayer flags dancing in the Himalayan breeze.",
  "What Is Lung Dhar in Bhutan?",
  "Lung Dhar refers to the colourful Buddhist prayer flags traditionally displayed horizontally or diagonally on strings between trees, poles and bridges.",
  "The Spiritual Meaning of Lung Dhar Prayer Flags",
  "In Bhutanese Buddhist tradition, wind is seen as a powerful carrier of spiritual blessings.",
  "The practice reflects several important Buddhist values:",
  "Compassion: Sharing prayers and good wishes with all living beings.",
  "Peace: Encouraging harmony within ourselves and the world around us.",
  "Good Fortune: Invoking favourable circumstances and spiritual well-being.",
  "Protection: Seeking blessings against obstacles and negative influences.",
  "For Bhutanese communities, raising prayer flags is both a spiritual offering and an expression of hope for the future.",
  "The Five Sacred Colours of Lung Dhar and Their Meanings",
  "One of the most recognisable features of Lung Dhar is its five vibrant colours.",
  "Colour",
  "Element",
  "Symbolic Meaning",
  "Blue",
  "Sky / Space",
  "Wisdom and infinity",
  "White",
  "Air / Wind",
  "Purity and peace",
  "Red",
  "Fire",
  "Strength and energy",
  "Green",
  "Water",
  "Harmony and balance",
  "Yellow",
  "Earth",
  "Stability and grounding",
  "Together, the five colours represent the balance of the natural world.",
].join("\n\n");

describe("flattened text (older articles)", () => {
  const blocks = parseArticle(FLAT);
  it("finds the headings, and only the headings", () => {
    const headings = blocks.filter((b) => b.type === "heading").map((b) => (b as { text: string }).text);
    assert.deepEqual(headings, [
      "What Is Lung Dhar in Bhutan?",
      "The Spiritual Meaning of Lung Dhar Prayer Flags",
      "The Five Sacred Colours of Lung Dhar and Their Meanings",
    ]);
  });
  it("turns the Label: sentence run into a labelled list, keeping the lead-in as a paragraph", () => {
    const i = blocks.findIndex((b) => b.type === "list");
    assert.equal(blocks[i - 1].type, "paragraph");
    const list = blocks[i] as Extract<(typeof blocks)[number], { type: "list" }>;
    assert.equal(list.items.length, 4);
    assert.deepEqual(list.items[0], { label: "Compassion", text: "Sharing prayers and good wishes with all living beings." });
  });
  it("rebuilds the colour table with three columns", () => {
    const t = blocks.find((b) => b.type === "table") as Extract<(typeof blocks)[number], { type: "table" }>;
    assert.deepEqual(t.head, ["Colour", "Element", "Symbolic Meaning"]);
    assert.equal(t.rows.length, 5);
    assert.deepEqual(t.rows[0], ["Blue", "Sky / Space", "Wisdom and infinity"]);
    assert.deepEqual(t.rows[4], ["Yellow", "Earth", "Stability and grounding"]);
  });
  it("keeps ordinary sentences as paragraphs and never swallows text", () => {
    const paragraphs = blocks.filter((b) => b.type === "paragraph");
    assert.equal(paragraphs.length, 8);
    assert.ok(blocks.at(-1)?.type === "paragraph");
  });
  it("builds a table of contents from the headings", () => {
    assert.equal(tableOfContents(blocks).length, 3);
    assert.equal(tableOfContents(blocks)[0].id, "what-is-lung-dhar-in-bhutan");
  });
});

describe("cautious guesses", () => {
  it("leaves a plain article of full paragraphs alone", () => {
    const text = "First paragraph with enough words to be prose, ending properly.\n\nSecond paragraph, also a proper sentence that goes on for a while.";
    assert.deepEqual(parseArticle(text).map((b) => b.type), ["paragraph", "paragraph"]);
  });
  it("does not make a heading of a short line with no paragraph after it", () => {
    assert.deepEqual(parseArticle("A real paragraph that is long enough to count as prose for sure.\n\nThe End Of Everything").map((b) => b.type), ["paragraph", "paragraph"]);
  });
  it("makes a bullet list, not a table, of a short run that does not divide into rows", () => {
    const text = ["Paro Tshechu", "Thimphu Tshechu", "Punakha Drubchen", "Jambay Lhakhang Drup", "Haa Summer Festival"].join("\n\n");
    const b = parseArticle(text);
    assert.equal(b.length, 1);
    assert.equal(b[0].type, "list");
  });
  it("does not treat a single 'Note: ...' line as a list", () => {
    assert.equal(parseArticle("Note: carry your passport at all times.")[0].type, "paragraph");
  });
});

describe("explicit markup", () => {
  const md = [
    "Intro text that is a normal paragraph.",
    "## Getting there",
    "### By air",
    "- Paro airport",
    "- **Drukair** flies from Delhi",
    "1. Apply for the visa",
    "2. Pay the SDF",
    "> Tip: book flights early.",
    "| Season | Months |",
    "|---|---|",
    "| Spring | Mar–May |",
    "| Autumn | Sep–Nov |",
  ].join("\n");
  const blocks = parseArticle(md);
  it("reads headings, lists, quotes and tables", () => {
    assert.deepEqual(blocks.map((b) => b.type), ["paragraph", "heading", "heading", "list", "list", "quote", "table"]);
    assert.equal((blocks[1] as { level: number }).level, 2);
    assert.equal((blocks[2] as { level: number }).level, 3);
    assert.equal((blocks[4] as { ordered: boolean }).ordered, true);
    const t = blocks[6] as { head: string[]; rows: string[][] };
    assert.deepEqual(t.head, ["Season", "Months"]);
    assert.deepEqual(t.rows, [["Spring", "Mar–May"], ["Autumn", "Sep–Nov"]]);
  });
  it("gives duplicate headings distinct ids", () => {
    const b = parseArticle("## Visa\n\ntext\n\n## Visa\n\ntext").filter((x) => x.type === "heading") as { id: string }[];
    assert.deepEqual(b.map((x) => x.id), ["visa", "visa-2"]);
  });
});

describe("inline formatting", () => {
  it("handles bold and safe links only", () => {
    assert.deepEqual(parseInline("a **b** [c](/packages) [d](javascript:void) [e](https://x.org)"), [
      { text: "a " },
      { text: "b", bold: true },
      { text: " " },
      { text: "c", href: "/packages" },
      { text: " " },
      { text: "d" },
      { text: " " },
      { text: "e", href: "https://x.org" },
    ]);
  });
  it("leaves stray asterisks and brackets as text", () => {
    assert.deepEqual(parseInline("5 * 3 [not a link]"), [{ text: "5 * 3 [not a link]" }]);
  });
});
