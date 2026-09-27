import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { format, startOfToday } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getCompany } from "@/lib/content";

/**
 * The trip's day-by-day itinerary as a PDF, the thing a traveller forwards
 * to whoever they're going with.
 *
 * Built with pdfkit rather than by printing the page in a headless browser:
 * no Chromium in the serverless bundle, no cold-start penalty, and the
 * layout is written for paper instead of being a screenshot of a website.
 *
 * Prices are printed in ngultrum only. The site converts to the viewer's
 * currency client-side from live rates, and a rate baked into a document
 * someone keeps for six months would be quietly wrong by the time they read
 * it — BTN is what the booking is actually denominated in.
 */

const NAVY = "#0a3159";
const GOLD = "#e8871a";
const INK = "#1c1917";
const MUTED = "#57534e";

const DIFFICULTY_LABEL: Record<string, string> = {
  EASY: "Easy",
  MODERATE: "Moderate",
  CHALLENGING: "Challenging",
};

const CATEGORY_LABEL: Record<string, string> = {
  TREKKING: "Trekking",
  CULTURAL: "Cultural",
  WILDLIFE: "Wildlife",
  HONEYMOON: "Honeymoon",
};

/**
 * pdfkit's built-in fonts encode WinAnsi only, and throw on anything
 * outside it. Editors paste curly quotes and dashes constantly, so map the
 * common ones rather than letting a smart quote 500 the download.
 */
function winAnsi(text: string): string {
  return text
    .replace(/[‘’‛]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/ /g, " ")
    // eslint-disable-next-line no-control-regex
    .replace(/[^\u0000-ÿ]/g, "");
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const [itinerary, company] = await Promise.all([
    prisma.itinerary.findUnique({
      where: { slug },
      include: {
        days: {
          orderBy: { dayNumber: "asc" },
          include: { destination: true, lodging: true },
        },
        lodgings: { orderBy: { position: "asc" } },
        departures: {
          where: { startDate: { gte: startOfToday() }, status: { notIn: ["CANCELLED"] } },
          orderBy: { startDate: "asc" },
        },
      },
    }),
    getCompany(),
  ]);

  if (!itinerary || itinerary.status !== "PUBLISHED") {
    return new NextResponse("Not found", { status: 404 });
  }

  // Formatted here rather than via formatCurrency, which wants a live rate
  // map: BTN needs no conversion, and passing it a rate at all invites
  // baking one into a document someone keeps for months.
  const money = (n: number) => `Nu. ${Math.round(n).toLocaleString("en-US")}`;
  const nightsByLodging = new Map<string, number>();
  for (const d of itinerary.days) {
    if (d.lodgingId) nightsByLodging.set(d.lodgingId, (nightsByLodging.get(d.lodgingId) ?? 0) + 1);
  }

  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 56, bottom: 64, left: 56, right: 56 },
    info: {
      Title: `${itinerary.title} — itinerary`,
      Author: company.name,
      Subject: `${itinerary.durationDays}-day Bhutan itinerary`,
    },
  });

  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  const W = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const text = (s: string) => winAnsi(s);

  /** Starts a new page when the next block wouldn't fit — keeps days whole. */
  function room(height: number) {
    if (doc.y + height > doc.page.height - doc.page.margins.bottom) doc.addPage();
  }

  function heading(label: string) {
    room(60);
    doc.moveDown(1.2);
    doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(15).text(text(label));
    doc
      .moveTo(doc.page.margins.left, doc.y + 4)
      .lineTo(doc.page.margins.left + 46, doc.y + 4)
      .lineWidth(2)
      .strokeColor(GOLD)
      .stroke();
    doc.moveDown(0.8);
  }

  function body(s: string, opts: { color?: string; size?: number; gap?: number } = {}) {
    doc
      .fillColor(opts.color ?? INK)
      .font("Helvetica")
      .fontSize(opts.size ?? 10.5)
      .text(text(s), { width: W, lineGap: opts.gap ?? 2 });
  }

  // ---------------------------------------------------------------- cover
  doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(9).text(text(company.name.toUpperCase()), {
    characterSpacing: 1.4,
  });
  doc.moveDown(1.2);
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(26).text(text(itinerary.title), { width: W });
  doc.moveDown(0.5);
  body(itinerary.summary, { color: MUTED, size: 12 });
  doc.moveDown(1);

  const facts: [string, string][] = [
    ["Trip length", `${itinerary.durationDays} days${itinerary.durationDays > 1 ? ` / ${itinerary.durationDays - 1} nights` : ""}`],
    ["Activity level", DIFFICULTY_LABEL[itinerary.difficulty] ?? itinerary.difficulty],
    ["Group size", itinerary.maxGroupSize ? `Up to ${itinerary.maxGroupSize}` : "Small group"],
    ["From", `${money(Number(itinerary.pricePerPerson))} per person`],
    ["Style", CATEGORY_LABEL[itinerary.category] ?? itinerary.category],
  ];

  const boxTop = doc.y;
  const colW = W / 2;
  facts.forEach(([label, value], i) => {
    const x = doc.page.margins.left + (i % 2) * colW;
    const y = boxTop + Math.floor(i / 2) * 34;
    doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(7.5).text(text(label.toUpperCase()), x, y, {
      width: colW - 12,
      characterSpacing: 0.8,
    });
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(12).text(text(value), x, y + 11, {
      width: colW - 12,
    });
  });
  doc.y = boxTop + Math.ceil(facts.length / 2) * 34 + 6;
  doc.x = doc.page.margins.left;

  if (itinerary.description) {
    doc.moveDown(0.6);
    body(itinerary.description);
  }

  // ------------------------------------------------------------ day by day
  heading("Day by day");
  for (const day of itinerary.days) {
    room(90);
    doc
      .fillColor(NAVY)
      .font("Helvetica-Bold")
      .fontSize(11.5)
      .text(text(`Day ${day.dayNumber} — ${day.title}`), { width: W });
    if (day.destination) {
      doc.fillColor(MUTED).font("Helvetica").fontSize(9.5).text(text(day.destination.name));
    }
    doc.moveDown(0.3);
    if (day.description) body(day.description);

    if (day.activities.length > 0) {
      doc.moveDown(0.2);
      body(`Includes: ${day.activities.join(", ")}`, { color: MUTED, size: 9.5 });
    }

    const hike: string[] = [];
    if (day.hikeDistanceKm !== null) hike.push(`${Number(day.hikeDistanceKm)} km`);
    if (day.hikeAscentM !== null) hike.push(`${day.hikeAscentM} m ascent`);
    if (day.hikeDescentM !== null) hike.push(`${day.hikeDescentM} m descent`);
    if (day.hikeHours !== null) hike.push(`${Number(day.hikeHours)} hrs on foot`);
    if (day.hikeDifficulty) hike.push(DIFFICULTY_LABEL[day.hikeDifficulty] ?? day.hikeDifficulty);
    if (hike.length > 0) {
      body(`Hiking: ${hike.join(" · ")}${day.hikeNote ? `. ${day.hikeNote}` : ""}`, {
        color: MUTED,
        size: 9.5,
      });
    }

    const meals = day.mealsIncluded.length > 0 ? day.mealsIncluded.join(", ") : "None included";
    body(`Meals: ${meals}   |   Stay: ${day.lodging?.name ?? "No overnight stay"}`, {
      color: MUTED,
      size: 9.5,
    });
    doc.moveDown(0.7);
  }

  // -------------------------------------------------------------- lodgings
  if (itinerary.lodgings.length > 0) {
    heading("Where you'll stay");
    for (const l of itinerary.lodgings) {
      room(56);
      const nights = nightsByLodging.get(l.id) ?? 0;
      doc
        .fillColor(INK)
        .font("Helvetica-Bold")
        .fontSize(11)
        .text(
          text(
            `${l.name}${l.location ? ` — ${l.location}` : ""}${nights > 0 ? `  (${nights} night${nights === 1 ? "" : "s"})` : ""}`
          ),
          { width: W }
        );
      if (l.description) body(l.description, { color: MUTED, size: 9.5 });
      doc.moveDown(0.5);
    }
  }

  // -------------------------------------------------------------- includes
  if (itinerary.includes.length > 0 || itinerary.excludes.length > 0) {
    heading("What's included");
    if (itinerary.includes.length > 0) {
      doc.fillColor(INK).font("Helvetica-Bold").fontSize(10).text(text("Included in the price"));
      doc.moveDown(0.2);
      for (const i of itinerary.includes) body(`+  ${i}`, { size: 10 });
      doc.moveDown(0.5);
    }
    if (itinerary.excludes.length > 0) {
      room(60);
      doc.fillColor(INK).font("Helvetica-Bold").fontSize(10).text(text("Not included"));
      doc.moveDown(0.2);
      for (const i of itinerary.excludes) body(`-  ${i}`, { color: MUTED, size: 10 });
    }
  }

  // ------------------------------------------------------------- departures
  if (itinerary.departures.length > 0) {
    heading("Scheduled departures");
    body("Prices are per person in Bhutanese ngultrum (BTN), sharing a twin room.", {
      color: MUTED,
      size: 9.5,
    });
    doc.moveDown(0.5);
    // Fixed columns, positioned absolutely. Chaining `continued: true`
    // segments instead wraps the tail back to the left margin the moment a
    // row runs long, which turns the table into a paragraph.
    const cols = [
      { x: 0, w: 190 },
      { x: 196, w: 84 },
      { x: 288, w: 92 },
      { x: 388, w: W - 388 },
    ];
    const left = doc.page.margins.left;

    const headerY = doc.y;
    ["Departs / returns", "Price", "Availability", ""].forEach((label, i) => {
      if (!label) return;
      doc
        .fillColor(MUTED)
        .font("Helvetica-Bold")
        .fontSize(7.5)
        .text(text(label.toUpperCase()), left + cols[i].x, headerY, {
          width: cols[i].w,
          characterSpacing: 0.8,
        });
    });
    doc.y = headerY + 14;

    for (const d of itinerary.departures) {
      room(22);
      const y = doc.y;
      const price = money(Number(d.priceOverride ?? itinerary.pricePerPerson));
      const status =
        d.status === "SOLD_OUT" ? "Sold out" : d.status === "LIMITED" ? "Limited space" : "Available";
      const cells: [string, string][] = [
        [`${fmt(d.startDate)} to ${fmt(d.endDate)}`, INK],
        [price, INK],
        [status, d.status === "OPEN" ? MUTED : INK],
        [d.note ?? "", MUTED],
      ];
      let tallest = 0;
      cells.forEach(([value, color], i) => {
        if (!value) return;
        doc
          .fillColor(color)
          .font("Helvetica")
          .fontSize(9.5)
          .text(text(value), left + cols[i].x, y, { width: cols[i].w, lineBreak: false });
        tallest = Math.max(tallest, doc.y - y);
      });
      doc.x = left;
      doc.y = y + Math.max(tallest, 14);
    }
  } else {
    heading("Dates");
    body(
      "No scheduled departures are published for this trip. It runs privately on dates that suit you — get in touch and we'll build it around them."
    );
  }

  // ----------------------------------------------------------------- footer
  heading("Talk to us");
  const contact = [
    company.phone && `Phone ${company.phone}`,
    company.whatsapp && `WhatsApp ${company.whatsapp}`,
    company.email && `Email ${company.email}`,
  ]
    .filter(Boolean)
    .join("   |   ");
  if (contact) body(contact);
  body(company.officeHours, { color: MUTED, size: 9.5 });
  doc.moveDown(0.6);
  body(
    `Prepared ${format(new Date(), "d MMMM yyyy")}. Prices and departures can change — the current version is always at ${siteUrlFor(slug)}.`,
    { color: MUTED, size: 9 }
  );

  doc.end();
  const pdf = await done;

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(pdf.length),
      "Content-Disposition": `attachment; filename="${asciiFilename(itinerary.slug)}-itinerary.pdf"`,
      // Short: the document embeds today's date and the live departure list.
      "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=3600",
    },
  });
}

/** DATE columns are read back in UTC so a 4 October departure isn't the 3rd. */
function fmt(date: Date) {
  return format(new Date(`${date.toISOString().slice(0, 10)}T12:00:00`), "d MMM yyyy");
}

function siteUrlFor(slug: string) {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  return `${base}/packages/${slug}`;
}

/** Content-Disposition filenames travel badly once they leave ASCII. */
function asciiFilename(slug: string) {
  return slug.replace(/[^a-z0-9-]/gi, "-").slice(0, 60) || "trip";
}
