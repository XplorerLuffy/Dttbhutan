import "server-only";
import { prisma } from "@/lib/prisma";
import { getCurrentRates } from "@/lib/fx";
import { convertFromBTN, formatCurrency, type CurrencyCode } from "@/lib/currency";
import type { AiToolDefinition } from "@/lib/ai/provider";

/**
 * Real-data grounding tools — the only source of factual claims (prices,
 * availability of a *listing*, package contents) the assistant is allowed
 * to make. Every function here is a read-only Prisma query against the
 * same tables and the same `status: "APPROVED"` / `status: "PUBLISHED"`
 * filters the public site itself uses (see e.g. src/app/guides/page.tsx) —
 * a vendor pending review is exactly as invisible to the assistant as it is
 * to a browsing traveler.
 *
 * The model never computes a price. Every price-shaped value below is read
 * straight from the database (Decimal → Number, same as every existing
 * page does) and handed back as a plain tool result; the model's job is to
 * relay it, not derive it. When nothing matches, functions return an
 * explicit `{ found: false }`-shaped result rather than an empty success —
 * see systemPrompt.ts's instruction to treat "not found" as a real answer,
 * not a gap to fill in.
 */

// ---------------------------------------------------------------------------
// Destinations
// ---------------------------------------------------------------------------

async function searchDestinations(args: { query?: string }) {
  const destinations = await prisma.destination.findMany({
    where: args.query
      ? { name: { contains: args.query, mode: "insensitive" } }
      : undefined,
    select: { name: true, region: true, description: true, highlights: true },
    orderBy: { name: "asc" },
    take: 20,
  });

  if (destinations.length === 0) {
    return { found: false, reason: "No destination matched that name." };
  }

  return {
    found: true,
    destinations: destinations.map((d) => ({
      name: d.name,
      region: d.region,
      description: d.description,
      highlights: d.highlights,
    })),
  };
}

// ---------------------------------------------------------------------------
// Package tours (Itinerary)
// ---------------------------------------------------------------------------

async function searchPackages(args: { destinationName?: string; maxDurationDays?: number }) {
  const packages = await prisma.itinerary.findMany({
    where: {
      status: "PUBLISHED",
      ...(args.maxDurationDays ? { durationDays: { lte: args.maxDurationDays } } : {}),
      ...(args.destinationName
        ? { days: { some: { destination: { name: { contains: args.destinationName, mode: "insensitive" } } } } }
        : {}),
    },
    select: {
      title: true,
      slug: true,
      summary: true,
      durationDays: true,
      pricePerPerson: true,
      difficulty: true,
      includes: true,
      excludes: true,
    },
    orderBy: { pricePerPerson: "asc" },
    take: 15,
  });

  if (packages.length === 0) {
    return { found: false, reason: "No published package tour matched those filters." };
  }

  return {
    found: true,
    packages: packages.map((p) => ({
      title: p.title,
      slug: p.slug,
      summary: p.summary,
      durationDays: p.durationDays,
      pricePerPersonBTN: Number(p.pricePerPerson),
      difficulty: p.difficulty,
      includes: p.includes,
      excludes: p.excludes,
    })),
  };
}

async function getPackageDetails(args: { titleOrSlug: string }) {
  const itinerary = await prisma.itinerary.findFirst({
    where: {
      status: "PUBLISHED",
      OR: [
        { slug: args.titleOrSlug },
        { title: { equals: args.titleOrSlug, mode: "insensitive" } },
        { title: { contains: args.titleOrSlug, mode: "insensitive" } },
      ],
    },
    include: { days: { orderBy: { dayNumber: "asc" }, include: { destination: true } } },
  });

  if (!itinerary) {
    return {
      found: false,
      reason: `No published package matching "${args.titleOrSlug}" was found. Do not guess a price or itinerary for it — tell the user it needs to be confirmed, or suggest they browse /packages.`,
    };
  }

  return {
    found: true,
    title: itinerary.title,
    slug: itinerary.slug,
    summary: itinerary.summary,
    description: itinerary.description,
    durationDays: itinerary.durationDays,
    pricePerPersonBTN: Number(itinerary.pricePerPerson),
    maxGroupSize: itinerary.maxGroupSize,
    difficulty: itinerary.difficulty,
    includes: itinerary.includes,
    excludes: itinerary.excludes,
    days: itinerary.days.map((d) => ({
      dayNumber: d.dayNumber,
      title: d.title,
      destination: d.destination?.name ?? null,
      activities: d.activities,
    })),
  };
}

// ---------------------------------------------------------------------------
// Guides
// ---------------------------------------------------------------------------

async function searchGuides(args: { destinationName?: string }) {
  const guides = await prisma.guideProfile.findMany({
    where: {
      status: "APPROVED",
      ...(args.destinationName
        ? { destinations: { some: { name: { contains: args.destinationName, mode: "insensitive" } } } }
        : {}),
    },
    include: { user: { select: { name: true } }, destinations: { select: { name: true } } },
    orderBy: { ratePerDay: "asc" },
    take: 15,
  });

  if (guides.length === 0) {
    return { found: false, reason: "No approved guide matched that destination." };
  }

  return {
    found: true,
    guides: guides.map((g) => ({
      name: g.user.name,
      ratePerDayBTN: Number(g.ratePerDay),
      languages: g.languages,
      specialties: g.specialties,
      yearsExperience: g.yearsExperience,
      destinationsCovered: g.destinations.map((d) => d.name),
    })),
  };
}

// ---------------------------------------------------------------------------
// Hotels / room pricing
// ---------------------------------------------------------------------------

async function searchHotels(args: { destinationName?: string }) {
  const hotels = await prisma.hotel.findMany({
    where: {
      status: "APPROVED",
      ...(args.destinationName
        ? { destination: { name: { contains: args.destinationName, mode: "insensitive" } } }
        : {}),
    },
    include: { destination: { select: { name: true } }, roomTypes: true },
    orderBy: { name: "asc" },
    take: 15,
  });

  if (hotels.length === 0) {
    return { found: false, reason: "No approved hotel matched that destination." };
  }

  return {
    found: true,
    hotels: hotels.map((h) => ({
      name: h.name,
      destination: h.destination.name,
      amenities: h.amenities,
      roomTypes: h.roomTypes.map((r) => ({
        name: r.name,
        capacity: r.capacity,
        pricePerNightBTN: Number(r.pricePerNight),
      })),
    })),
  };
}

// ---------------------------------------------------------------------------
// Vehicles
// ---------------------------------------------------------------------------

async function searchVehicles(args: { type?: string }) {
  const validTypes = ["SEDAN", "SUV", "VAN", "BUS"];
  const normalizedType = args.type?.trim().toUpperCase();
  const type = normalizedType && validTypes.includes(normalizedType) ? normalizedType : undefined;

  const vehicles = await prisma.vehicle.findMany({
    where: {
      status: "APPROVED",
      ...(type ? { type: type as "SEDAN" | "SUV" | "VAN" | "BUS" } : {}),
    },
    include: { operator: { select: { businessName: true } } },
    orderBy: { ratePerDay: "asc" },
    take: 15,
  });

  if (vehicles.length === 0) {
    return { found: false, reason: "No approved vehicle matched that type." };
  }

  return {
    found: true,
    vehicles: vehicles.map((v) => ({
      type: v.type,
      capacity: v.capacity,
      operator: v.operator.businessName,
      ratePerDayBTN: Number(v.ratePerDay),
      ratePerKmBTN: v.ratePerKm ? Number(v.ratePerKm) : null,
    })),
  };
}

// ---------------------------------------------------------------------------
// Currency conversion — reuses the site's own live-rate pipeline
// (src/lib/fx.ts) rather than a separate lookup, so a converted figure the
// assistant states matches what the currency selector in the header shows.
// ---------------------------------------------------------------------------

const CURRENCY_CODES: CurrencyCode[] = ["BTN", "USD", "AUD", "INR", "EUR", "GBP"];

async function convertPrice(args: { amountBTN: number; targetCurrency: string }) {
  const target = args.targetCurrency.trim().toUpperCase();
  if (!CURRENCY_CODES.includes(target as CurrencyCode)) {
    return {
      found: false,
      reason: `"${args.targetCurrency}" isn't a supported currency. Supported: ${CURRENCY_CODES.join(", ")}.`,
    };
  }
  if (!Number.isFinite(args.amountBTN) || args.amountBTN < 0) {
    return { found: false, reason: "amountBTN must be a non-negative number." };
  }

  const rates = await getCurrentRates();
  const currency = target as CurrencyCode;

  return {
    found: true,
    amountBTN: args.amountBTN,
    targetCurrency: currency,
    convertedAmount: Number(convertFromBTN(args.amountBTN, currency, rates).toFixed(2)),
    formatted: formatCurrency(args.amountBTN, currency, rates),
  };
}

// ---------------------------------------------------------------------------
// Tool registry — what gets advertised to the model and how each call runs.
// ---------------------------------------------------------------------------

export type AiToolResult = { found: boolean; [key: string]: unknown };

type ToolEntry = {
  definition: AiToolDefinition;
  execute: (args: Record<string, unknown>) => Promise<AiToolResult>;
};

export const AI_TOOLS: ToolEntry[] = [
  {
    definition: {
      name: "search_destinations",
      description:
        "Search Bhutan destinations (dzongkhags) actually listed on the site. Use before describing any destination in detail.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Destination name or partial name, e.g. 'Paro'. Omit to list all." },
        },
      },
    },
    execute: (args) => searchDestinations(args as { query?: string }),
  },
  {
    definition: {
      name: "search_packages",
      description:
        "Search published package tours, optionally filtered by destination or maximum duration. Returns real prices per person in BTN.",
      parameters: {
        type: "object",
        properties: {
          destinationName: { type: "string", description: "Filter to packages visiting this destination." },
          maxDurationDays: { type: "number", description: "Only packages this many days or shorter." },
        },
      },
    },
    execute: (args) => searchPackages(args as { destinationName?: string; maxDurationDays?: number }),
  },
  {
    definition: {
      name: "get_package_details",
      description:
        "Get full details (exact price, day-by-day plan, what's included/excluded) for one specific published package by its title or slug. Always use this before quoting a specific package's price.",
      parameters: {
        type: "object",
        properties: {
          titleOrSlug: { type: "string", description: "The package's title or URL slug." },
        },
        required: ["titleOrSlug"],
      },
    },
    execute: (args) => getPackageDetails(args as { titleOrSlug: string }),
  },
  {
    definition: {
      name: "search_guides",
      description: "Search approved tour guides, optionally filtered by destination. Returns real daily rates in BTN.",
      parameters: {
        type: "object",
        properties: {
          destinationName: { type: "string", description: "Filter to guides covering this destination." },
        },
      },
    },
    execute: (args) => searchGuides(args as { destinationName?: string }),
  },
  {
    definition: {
      name: "search_hotels",
      description:
        "Search approved hotels/homestays, optionally filtered by destination. Returns real room types and nightly rates in BTN.",
      parameters: {
        type: "object",
        properties: {
          destinationName: { type: "string", description: "Filter to hotels in this destination." },
        },
      },
    },
    execute: (args) => searchHotels(args as { destinationName?: string }),
  },
  {
    definition: {
      name: "search_vehicles",
      description: "Search approved transport vehicles, optionally filtered by type (SEDAN, SUV, VAN, BUS). Returns real daily/per-km rates in BTN.",
      parameters: {
        type: "object",
        properties: {
          type: { type: "string", description: "One of SEDAN, SUV, VAN, BUS." },
        },
      },
    },
    execute: (args) => searchVehicles(args as { type?: string }),
  },
  {
    definition: {
      name: "convert_price",
      description:
        "Convert a BTN amount to another currency (USD, AUD, INR, EUR, GBP) using the site's real, current exchange rates. Always use this instead of converting currency yourself.",
      parameters: {
        type: "object",
        properties: {
          amountBTN: { type: "number", description: "Amount in Bhutanese Ngultrum." },
          targetCurrency: { type: "string", description: "USD, AUD, INR, EUR, or GBP." },
        },
        required: ["amountBTN", "targetCurrency"],
      },
    },
    execute: (args) => convertPrice(args as { amountBTN: number; targetCurrency: string }),
  },
];

export function getToolDefinitions(): AiToolDefinition[] {
  return AI_TOOLS.map((t) => t.definition);
}

export async function executeTool(name: string, args: Record<string, unknown>): Promise<AiToolResult> {
  const tool = AI_TOOLS.find((t) => t.definition.name === name);
  if (!tool) {
    return { found: false, reason: `Unknown tool "${name}" — no such tool exists.` };
  }
  try {
    return await tool.execute(args ?? {});
  } catch (err) {
    console.error(`[ai] tool "${name}" threw`, err);
    return { found: false, reason: "This lookup failed unexpectedly and could not be completed." };
  }
}
