/**
 * What the project actually contains, counted rather than estimated.
 *
 * Every number the video puts on screen comes from here, and every one was
 * counted from the repository on 2026-09-30:
 *
 *   pages         find src/app -name page.tsx | wc -l
 *   apiRoutes     find src/app/api -name route.ts | wc -l
 *   components    find src/components -name '*.tsx' | wc -l
 *   libModules    find src/lib -name '*.ts' | wc -l
 *   models/enums  grep -c '^model '/'^enum ' prisma/schema.prisma
 *   migrations    ls prisma/migrations | grep -c '^2'
 *   knowledge     SELECT count(*) FROM "KnowledgeDocument" / "KnowledgeChunk"
 *
 * A figure that cannot be counted does not go in the film.
 */
export const FACTS = {
  pages: 59,
  apiRoutes: 40,
  components: 98,
  libModules: 59,
  models: 34,
  enums: 23,
  migrations: 17,
  packages: 29,
  dzongkhags: 20,
  aiTools: 8,
  knowledgeDocuments: 57,
  knowledgeChunks: 140,
  embeddingDimensions: 768,
} as const;

/** The real top of the tree, as `ls` prints it. */
export const PROJECT_TREE = `src/
├── app/            ${FACTS.pages} pages, ${FACTS.apiRoutes} API routes
│   ├── packages/   tour listings and itineraries
│   ├── destinations/
│   ├── custom-tour/
│   ├── assistant/  the AI travel assistant
│   ├── admin/      the dashboard the agency runs it from
│   └── api/
├── components/     ${FACTS.components} React components
├── lib/            ${FACTS.libModules} modules — booking, auth, email, fx, ai
└── types/
prisma/
└── schema.prisma   ${FACTS.models} models, ${FACTS.enums} enums`;

/** The models the travel side of the product is built on, with what each one
 * holds. Taken from prisma/schema.prisma — these are 12 of the 34. */
export const CORE_MODELS: { name: string; note: string }[] = [
  { name: "User", note: "traveller, guide, hotel, transport, admin" },
  { name: "Destination", note: `all ${FACTS.dzongkhags} dzongkhags` },
  { name: "Itinerary", note: "a package tour" },
  { name: "ItineraryDay", note: "its day-by-day plan" },
  { name: "ItineraryLodging", note: "where you stay" },
  { name: "GuideProfile", note: "licence, languages, rate" },
  { name: "Hotel", note: "rooms and availability" },
  { name: "Vehicle", note: "driver, capacity, rate" },
  { name: "Booking", note: "guide, hotel or vehicle" },
  { name: "ItineraryBooking", note: "a whole package" },
  { name: "Departure", note: "fixed dates and seats" },
  { name: "Review", note: "after the trip" },
];

/** The knowledge base as it stands, by where each document came from. */
export const KNOWLEDGE_SOURCES: { label: string; note: string }[] = [
  { label: "Package tours", note: "indexed from Itinerary" },
  { label: "Destinations", note: "indexed from Destination" },
  { label: "Travel guide articles", note: "indexed from Article" },
  { label: "Visa & entry", note: "hand-written" },
  { label: "Sustainable Development Fee", note: "hand-written" },
  { label: "Cancellation & payment", note: "policy" },
];
