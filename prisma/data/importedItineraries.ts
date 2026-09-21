import type { ItineraryCategory, TripDifficulty } from "@prisma/client";

export type ImportedItineraryDay = {
  dayNumber: number;
  title: string;
  description: string;
  destinationName?: string;
  activities: string[];
  mealsIncluded: string[];
};

export type ImportedItinerary = {
  title: string;
  slug: string;
  category: ItineraryCategory;
  difficulty: TripDifficulty;
  summary: string;
  description: string;
  durationDays: number;
  pricePerPerson: number;
  maxGroupSize: number;
  includes: string[];
  excludes: string[];
  days: ImportedItineraryDay[];
};

const CULTURAL_INCLUDES = ["Licensed guide", "Private vehicle & driver", "Hotel accommodation", "All meals"];
const TREK_INCLUDES = ["Licensed guide & trek crew", "Camping equipment", "Pack animals for gear", "All meals during the trek", "Hotel accommodation on non-trek nights"];
const STANDARD_EXCLUDES = ["International flights", "Sustainable Development Fee (SDF)", "Visa fee", "Personal expenses"];

export const IMPORTED_ITINERARIES: ImportedItinerary[] = [
  // 1 — 11-Day Central Bhutan Cultural Immersion
  {
    title: "Central Bhutan Grand Cultural Immersion",
    slug: "central-bhutan-grand-cultural-immersion",
    category: "CULTURAL",
    difficulty: "EASY",
    summary: "An 11-day loop from Thimphu to Bumthang and out to remote Haa Valley — the fullest cultural circuit we offer.",
    description:
      "For travelers who want more than the highlights, this route adds Bumthang's sacred valleys and a day trip to little-visited Haa on top of the classic Thimphu–Punakha–Paro circuit. Expect long, scenic drives between destinations, a night in a restored royal-era palace guesthouse, and enough time in each valley to slow down.",
    durationDays: 11,
    pricePerPerson: 99000,
    maxGroupSize: 10,
    includes: CULTURAL_INCLUDES,
    excludes: STANDARD_EXCLUDES,
    days: [
      { dayNumber: 1, title: "Arrival in Paro, transfer to Thimphu", description: "Land in Paro and drive straight to the capital to begin acclimatizing to Bhutan's altitude.", destinationName: "Thimphu", activities: ["Airport pickup", "Scenic drive to Thimphu"], mealsIncluded: ["Lunch", "Dinner"] },
      { dayNumber: 2, title: "Thimphu heritage & craft day", description: "A full day through the capital's museums, dzong, and weekend market culture.", destinationName: "Thimphu", activities: ["National Folk Heritage Museum", "Textile Museum", "Memorial Chorten", "Simtokha Dzong"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 3, title: "Over Dochula Pass to Punakha", description: "Cross the prayer-flag-strewn Dochula Pass before descending into Punakha's subtropical valley.", destinationName: "Punakha", activities: ["Dochula Pass viewpoint", "Punakha Dzong"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 4, title: "Punakha to Bumthang via Trongsa", description: "A long, dramatic drive through central Bhutan's mountain passes to the country's spiritual heartland.", destinationName: "Bumthang", activities: ["Trongsa Dzong viewpoint", "Mountain pass scenery"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 5, title: "Bumthang's sacred temples", description: "Visit the valley's oldest and most revered temples, tied to Bhutan's founding legends.", destinationName: "Bumthang", activities: ["Jambay Lhakhang", "Kurjey Lhakhang", "Tamshing Monastery", "Jakar Dzong"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 6, title: "Tang Valley & a night in a royal palace", description: "A quieter side valley leads to an overnight stay in a converted 19th-century palace guesthouse.", destinationName: "Bumthang", activities: ["Membar Tsho (Burning Lake)", "Ugyen Choling Palace"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 7, title: "Return west toward Gangtey", description: "Retrace the route through Trongsa en route to the glacial Phobjikha Valley.", destinationName: "Wangdue Phodrang", activities: ["Trongsa Dzong"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 8, title: "Phobjikha Valley to Paro", description: "Look for black-necked cranes in Bhutan's most scenic glacial valley before the drive to Paro.", destinationName: "Paro", activities: ["Phobjikha Valley", "Gangtey Monastery"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 9, title: "Paro Valley sightseeing", description: "Explore the valley's dzong, museum, and the ruins of a dzong lost to fire.", destinationName: "Paro", activities: ["Rinpung Dzong", "National Museum", "Drukgyal Dzong ruins"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 10, title: "Day trip to Haa Valley", description: "Cross the high Chele La Pass into one of Bhutan's least-visited valleys, opened to tourism only in 2002.", destinationName: "Haa", activities: ["Chele La Pass", "Haa Valley villages"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 11, title: "Tiger's Nest hike and departure", description: "Cap the trip with Bhutan's most iconic hike before your onward flight.", destinationName: "Paro", activities: ["Paro Taktsang (Tiger's Nest)", "Kyichu Lhakhang"], mealsIncluded: ["Breakfast"] },
    ],
  },

  // 2 — 10-Day Central Bhutan Discovery
  {
    title: "10-Day Central Bhutan Discovery",
    slug: "10-day-central-bhutan-discovery",
    category: "CULTURAL",
    difficulty: "EASY",
    summary: "A 10-day journey from Thimphu through Punakha and Bumthang to the crane valley of Phobjikha, finishing in Paro.",
    description:
      "This route trades speed for depth — a full day in each major valley rather than a quick stop, including Bumthang's temple cluster and an overnight near the black-necked cranes of Phobjikha before finishing with Tiger's Nest.",
    durationDays: 10,
    pricePerPerson: 90000,
    maxGroupSize: 10,
    includes: CULTURAL_INCLUDES,
    excludes: STANDARD_EXCLUDES,
    days: [
      { dayNumber: 1, title: "Arrival, transfer to Thimphu", description: "Arrive in Paro and drive to the capital for your first night.", destinationName: "Thimphu", activities: ["Airport pickup"], mealsIncluded: ["Lunch", "Dinner"] },
      { dayNumber: 2, title: "Thimphu sightseeing", description: "A full day of markets, museums, and the capital's memorial stupa.", destinationName: "Thimphu", activities: ["Weekend market", "National museums", "Memorial Chorten"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 3, title: "Punakha via Dochula Pass", description: "Stop at Dochula's 108 chortens before descending to Bhutan's former winter capital.", destinationName: "Punakha", activities: ["Dochula Pass", "Punakha Dzong", "Chimi Lhakhang"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 4, title: "Punakha to Bumthang via Trongsa", description: "A scenic mountain crossing with a stop at the ancestral seat of the royal family.", destinationName: "Bumthang", activities: ["Trongsa Dzong", "Chendebji Chorten"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 5, title: "Bumthang temples & farm visit", description: "Visit the valley's founding-era temples and sample local cheese at a Swiss-run dairy farm.", destinationName: "Bumthang", activities: ["Kurjey Lhakhang", "Jambay Lhakhang", "Tamshing Monastery", "Jakar Dzong", "Swiss Farm"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 6, title: "Back through Trongsa toward Gangtey", description: "Retrace the mountain road west, stopping at Trongsa's heritage museum.", destinationName: "Wangdue Phodrang", activities: ["Ta Dzong heritage museum"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 7, title: "Phobjikha Valley", description: "A full day in Bhutan's glacial crane valley, with an option to stay in a local farmhouse.", destinationName: "Wangdue Phodrang", activities: ["Phobjikha Valley nature trail", "Gangtey Monastery"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 8, title: "Gangtey to Paro", description: "Drive the final leg west into Paro Valley for sightseeing.", destinationName: "Paro", activities: ["Paro town"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 9, title: "Tiger's Nest hike & Drukgyal ruins", description: "Bhutan's signature hike, followed by the ruins of a dzong that once guarded against Tibetan invasion.", destinationName: "Paro", activities: ["Paro Taktsang (Tiger's Nest)", "Drukgyal Dzong ruins", "Kyichu Lhakhang"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 10, title: "Departure", description: "Transfer to Paro International Airport for your onward flight.", destinationName: "Paro", activities: ["Departure transfer"], mealsIncluded: ["Breakfast"] },
    ],
  },

  // 3 — 7-Day Essential Bhutan Journey
  {
    title: "7-Day Essential Bhutan Journey",
    slug: "7-day-essential-bhutan-journey",
    category: "CULTURAL",
    difficulty: "EASY",
    summary: "The classic first-timer's route: Thimphu, Punakha, and Paro, ending with the hike to Tiger's Nest.",
    description:
      "A week is enough to see why Bhutan's western circuit is its most-traveled route — dzongs, a fertility temple with an unusual origin story, a farmhouse dinner, and the country's most photographed monastery.",
    durationDays: 7,
    pricePerPerson: 63000,
    maxGroupSize: 10,
    includes: CULTURAL_INCLUDES,
    excludes: STANDARD_EXCLUDES,
    days: [
      { dayNumber: 1, title: "Arrival, transfer to Thimphu", description: "Arrive at Paro International Airport and drive to the capital.", destinationName: "Thimphu", activities: ["Airport pickup"], mealsIncluded: ["Lunch", "Dinner"] },
      { dayNumber: 2, title: "Thimphu sightseeing", description: "Markets, museums, and monuments across Bhutan's low-key capital.", destinationName: "Thimphu", activities: ["Weekend market", "Museums", "Thimphu Dzong"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 3, title: "Punakha via Dochula Pass", description: "Cross the Himalayan viewpoint at Dochula on the way to Punakha Dzong.", destinationName: "Punakha", activities: ["Dochula Pass", "Punakha Dzong"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 4, title: "Punakha valley day", description: "A gentle hike to a chorten across the river, the fertility temple, and a farmhouse dinner.", destinationName: "Punakha", activities: ["Khamsum Yulley Chorten", "Chimi Lhakhang", "Suspension bridge walk", "Farmhouse dinner"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 5, title: "Paro Valley sightseeing", description: "Two of Paro's older, quieter temples before tomorrow's hike.", destinationName: "Paro", activities: ["Kyichu Lhakhang", "Dumtse Lhakhang"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 6, title: "Hike to Tiger's Nest", description: "The half-day cliffside hike to Paro Taktsang, Bhutan's most iconic sight.", destinationName: "Paro", activities: ["Paro Taktsang (Tiger's Nest)"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 7, title: "Departure", description: "Transfer to the airport for your flight home.", destinationName: "Paro", activities: ["Departure transfer"], mealsIncluded: ["Breakfast"] },
    ],
  },

  // 4 — 5-Day Bhutan Highlights Tour
  {
    title: "5-Day Bhutan Highlights Tour",
    slug: "5-day-bhutan-highlights-tour",
    category: "CULTURAL",
    difficulty: "EASY",
    summary: "A compact introduction to Bhutan for travelers short on time — Thimphu, Punakha, and Tiger's Nest in five days.",
    description:
      "If you can only spare a long weekend plus a couple of days, this is the tightest version of the western circuit that still fits in the country's best-known sights, without feeling rushed.",
    durationDays: 5,
    pricePerPerson: 46500,
    maxGroupSize: 10,
    includes: CULTURAL_INCLUDES,
    excludes: STANDARD_EXCLUDES,
    days: [
      { dayNumber: 1, title: "Arrival, Thimphu sightseeing", description: "Land in Paro, drive to Thimphu, and see the capital's memorial stupa and giant Buddha statue the same afternoon.", destinationName: "Thimphu", activities: ["Memorial Chorten", "Thimphu Dzong", "Buddha Dordenma"], mealsIncluded: ["Lunch", "Dinner"] },
      { dayNumber: 2, title: "Thimphu to Punakha", description: "Cross Dochula Pass and settle into Bhutan's former winter capital.", destinationName: "Punakha", activities: ["Dochula Pass", "Punakha Dzong", "Khamsum Yulley Chorten hike"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 3, title: "Punakha to Paro", description: "Visit the fertility temple and the ruins of a dzong lost to fire before reaching Paro.", destinationName: "Paro", activities: ["Chimi Lhakhang", "Paro Dzong", "Drukgyal Dzong ruins"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 4, title: "Tiger's Nest hike", description: "The signature hike to Paro Taktsang, plus a nearby 7th-century temple.", destinationName: "Paro", activities: ["Paro Taktsang (Tiger's Nest)", "Kyichu Lhakhang"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 5, title: "Departure", description: "Transfer to the airport for your onward flight.", destinationName: "Paro", activities: ["Departure transfer"], mealsIncluded: ["Breakfast"] },
    ],
  },

  // 5 — 7-Day Bhutan & Haa Valley Tour
  {
    title: "Bhutan & Haa Valley Cultural Tour",
    slug: "bhutan-and-haa-valley-cultural-tour",
    category: "CULTURAL",
    difficulty: "EASY",
    summary: "The classic western circuit with a detour over Chele La Pass into the little-visited Haa Valley.",
    description:
      "Haa only opened to tourism in 2002 and still sees a fraction of Paro's visitors. This route adds it to the standard Thimphu–Punakha–Paro loop, along with a couple of quieter hikes most itineraries skip.",
    durationDays: 7,
    pricePerPerson: 65000,
    maxGroupSize: 10,
    includes: CULTURAL_INCLUDES,
    excludes: STANDARD_EXCLUDES,
    days: [
      { dayNumber: 1, title: "Arrival, transfer to Thimphu", description: "Arrive at Paro airport and drive to the capital.", destinationName: "Thimphu", activities: ["Airport pickup"], mealsIncluded: ["Lunch", "Dinner"] },
      { dayNumber: 2, title: "Thimphu hikes & museums", description: "A gentle monastery hike above the city plus the national textile collection and animal preserve.", destinationName: "Thimphu", activities: ["Cheri Monastery hike", "Textile Museum", "Motithang Takin Preserve"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 3, title: "Punakha via Dochula Pass", description: "Cross Dochula and visit Punakha Dzong plus the fertility temple.", destinationName: "Punakha", activities: ["Dochula Pass", "Punakha Dzong", "Khamsum Yulley Chorten", "Chimi Lhakhang"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 4, title: "Paro Valley sightseeing", description: "The valley's dzong and the ruins of one lost to fire in the 1950s.", destinationName: "Paro", activities: ["Paro Dzong", "Drukgyal Dzong ruins"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 5, title: "Day trip over Chele La to Haa", description: "One of Bhutan's highest motorable passes leads into a valley of quiet farming villages.", destinationName: "Haa", activities: ["Chele La Pass", "Katsho village"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 6, title: "Tiger's Nest hike", description: "Bhutan's most iconic hike and a nearby 7th-century temple.", destinationName: "Paro", activities: ["Paro Taktsang (Tiger's Nest)", "Kyichu Lhakhang"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 7, title: "Departure", description: "Transfer to the airport for your flight home.", destinationName: "Paro", activities: ["Departure transfer"], mealsIncluded: ["Breakfast"] },
    ],
  },

  // 6 — Paro Tshechu Festival & Central Valleys (7-day)
  {
    title: "Paro Tshechu Festival & Central Valleys",
    slug: "paro-tshechu-festival-central-valleys",
    category: "CULTURAL",
    difficulty: "EASY",
    summary: "Time your trip to Bhutan's biggest festival, with Punakha and the crane valley of Phobjikha built around it.",
    description:
      "The Paro Tshechu is one of Bhutan's most colorful annual festivals — masked dances performed by monks, culminating in the unveiling of a giant sacred thangka before dawn. This route builds a full week of central Bhutan sightseeing around festival dates.",
    durationDays: 7,
    pricePerPerson: 68000,
    maxGroupSize: 12,
    includes: CULTURAL_INCLUDES,
    excludes: STANDARD_EXCLUDES,
    days: [
      { dayNumber: 1, title: "Arrival, transfer to Thimphu", description: "Arrive in Paro and drive to Thimphu for the first two nights.", destinationName: "Thimphu", activities: ["Airport pickup"], mealsIncluded: ["Lunch", "Dinner"] },
      { dayNumber: 2, title: "Thimphu sightseeing", description: "Craft traditions and religious monuments across the capital.", destinationName: "Thimphu", activities: ["National Folk Heritage Museum", "Textile Museum", "Motithang Takin Preserve", "Simtokha Dzong"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 3, title: "Punakha via Dochula Pass", description: "Bhutan's former winter capital, plus a hike to a hilltop chorten.", destinationName: "Punakha", activities: ["Dochula Pass", "Punakha Dzong", "Khamsum Yulley Chorten"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 4, title: "Punakha to Phobjikha Valley", description: "The fertility temple en route to Bhutan's glacial crane valley.", destinationName: "Wangdue Phodrang", activities: ["Chimi Lhakhang", "Phobjikha Valley", "Gangtey Monastery"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 5, title: "Phobjikha to Paro", description: "Drive west to Paro and see the valley's fortress and national museum.", destinationName: "Paro", activities: ["Rinpung Dzong", "National Museum"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 6, title: "Paro Tshechu Festival & Tiger's Nest", description: "Watch the masked cham dances at Paro's dzong, then hike to Tiger's Nest and the nearby dzong ruins.", destinationName: "Paro", activities: ["Paro Tshechu festival", "Paro Taktsang (Tiger's Nest)", "Drukgyal Dzong ruins", "Kyichu Lhakhang"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 7, title: "Departure", description: "Transfer to the airport for your flight home.", destinationName: "Paro", activities: ["Departure transfer"], mealsIncluded: ["Breakfast"] },
    ],
  },

  // 7 — Bumdra Trek
  {
    title: "Bumdra Trek to Tiger's Nest",
    slug: "bumdra-trek-to-tigers-nest",
    category: "TREKKING",
    difficulty: "MODERATE",
    summary: "A short, high-reward trek that ends by descending straight into Tiger's Nest monastery.",
    description:
      "Rather than approaching Tiger's Nest from the valley floor like everyone else, this trek climbs above it first — camping a night near a monastery known as the 'Cave of a Thousand Prayers' before descending through Taktsang itself. A good pick for travelers who want one real trekking day without committing to a multi-week expedition.",
    durationDays: 7,
    pricePerPerson: 73500,
    maxGroupSize: 8,
    includes: TREK_INCLUDES,
    excludes: STANDARD_EXCLUDES,
    days: [
      { dayNumber: 1, title: "Arrival, transfer to Thimphu", description: "Arrive in Paro and drive to the capital.", destinationName: "Thimphu", activities: ["Airport pickup"], mealsIncluded: ["Lunch", "Dinner"] },
      { dayNumber: 2, title: "Thimphu sightseeing", description: "Museums and craft workshops across the capital before heading to trek country.", destinationName: "Thimphu", activities: ["Textile Museum", "Thimphu Dzong", "Jungshi Paper Factory"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 3, title: "Punakha via Dochula Pass", description: "Punakha Dzong and a riverside hike before returning toward Paro.", destinationName: "Punakha", activities: ["Dochula Pass", "Punakha Dzong", "Khamsum Yulley Chorten"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 4, title: "Paro Valley sightseeing", description: "The valley's fortress and museum ahead of tomorrow's trek start.", destinationName: "Paro", activities: ["Paro Dzong", "National Museum"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 5, title: "Trek to Bumdra campsite", description: "Climb through forest to a ridgeline monastery known as the Cave of a Thousand Prayers, camping at 3,800m.", destinationName: "Paro", activities: ["Bumdra Monastery", "Optional summit push"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 6, title: "Descend through Tiger's Nest", description: "The trek's payoff — a downhill route that arrives directly at Paro Taktsang.", destinationName: "Paro", activities: ["Paro Taktsang (Tiger's Nest)"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 7, title: "Departure", description: "Transfer to the airport for your flight home.", destinationName: "Paro", activities: ["Departure transfer"], mealsIncluded: ["Breakfast"] },
    ],
  },

  // 8 — Bumthang Valley Cultural Trek
  {
    title: "Bumthang Valley Cultural Trek",
    slug: "bumthang-valley-cultural-trek",
    category: "TREKKING",
    difficulty: "MODERATE",
    summary: "A gentler trek through Bumthang's sacred valleys and remote farming villages, bookended by the western circuit.",
    description:
      "Bumthang is considered Bhutan's spiritual heartland, and this route earns that reputation on foot — three days of trekking between village temples and a night in the remote settlement of Ugyenchholing, framed by a full western-circuit tour on either end.",
    durationDays: 12,
    pricePerPerson: 126000,
    maxGroupSize: 8,
    includes: TREK_INCLUDES,
    excludes: STANDARD_EXCLUDES,
    days: [
      { dayNumber: 1, title: "Arrival in Paro", description: "Arrive at Paro International Airport and settle in for the night.", destinationName: "Paro", activities: ["Airport pickup"], mealsIncluded: ["Lunch", "Dinner"] },
      { dayNumber: 2, title: "Tiger's Nest hike", description: "Acclimatize with Bhutan's signature hike before the trek ahead.", destinationName: "Paro", activities: ["Paro Taktsang (Tiger's Nest)"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 3, title: "Drive to Thimphu", description: "A short transfer to the capital for sightseeing.", destinationName: "Thimphu", activities: ["Thimphu Dzong"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 4, title: "Thimphu to Punakha via Dochula", description: "Cross the pass and settle into Bhutan's former winter capital.", destinationName: "Punakha", activities: ["Dochula Pass", "Punakha Dzong"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 5, title: "Punakha to Bumthang via Trongsa", description: "The long central-Bhutan drive, with a stop at the royal family's ancestral dzong.", destinationName: "Bumthang", activities: ["Trongsa Dzong"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 6, title: "Bumthang temple circuit", description: "The valley's founding-era temples and a Swiss-run dairy farm.", destinationName: "Bumthang", activities: ["Jakar Dzong", "Tamshing Monastery", "Kurjey Lhakhang", "Jambay Lhakhang", "Swiss Farm"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 7, title: "Trek to Ngang Lhakhang", description: "A five-to-six-hour walk to a quiet valley temple, well off the road network.", destinationName: "Bumthang", activities: ["Ngang Lhakhang"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 8, title: "Trek to Ugyenchholing", description: "A longer day over a ridge to a village built around a 16th-century noble estate.", destinationName: "Bumthang", activities: ["Ugyenchholing village"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 9, title: "Trek back to Jakar", description: "The final trekking day, returning to the valley floor.", destinationName: "Bumthang", activities: ["Bumthang farmland"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 10, title: "Drive to Punakha", description: "Retrace the mountain road west.", destinationName: "Punakha", activities: ["Trongsa Dzong"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 11, title: "Punakha to Paro via Dochula", description: "The final drive back over Dochula Pass.", destinationName: "Paro", activities: ["Dochula Pass"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 12, title: "Departure", description: "Transfer to the airport for your flight home.", destinationName: "Paro", activities: ["Departure transfer"], mealsIncluded: ["Breakfast"] },
    ],
  },

  // 9 — Dagala Thousand Lakes Trek
  {
    title: "Dagala Thousand Lakes Trek",
    slug: "dagala-thousand-lakes-trek",
    category: "TREKKING",
    difficulty: "CHALLENGING",
    summary: "A high-altitude trek above Thimphu through a landscape of alpine lakes, with a rest day at 4,300m.",
    description:
      "Despite starting less than an hour from the capital, the Dagala range feels remote — yak-herder camps, dozens of glacial lakes, and views across to Bhutan's higher Himalayan peaks. This is a genuine high-altitude trek; the rest day at Labatama is there for a reason.",
    durationDays: 8,
    pricePerPerson: 96000,
    maxGroupSize: 8,
    includes: TREK_INCLUDES,
    excludes: STANDARD_EXCLUDES,
    days: [
      { dayNumber: 1, title: "Arrival in Paro", description: "Arrive at Paro International Airport.", destinationName: "Paro", activities: ["Airport pickup"], mealsIncluded: ["Lunch", "Dinner"] },
      { dayNumber: 2, title: "Tiger's Nest hike", description: "An acclimatization hike before heading into the mountains.", destinationName: "Paro", activities: ["Paro Taktsang (Tiger's Nest)"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 3, title: "Trek to Gur", description: "From Genekha, a five-to-six-hour climb to the first camp at 3,290m.", destinationName: "Thimphu", activities: ["Genekha trailhead"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 4, title: "Trek to Labatama", description: "A long climb to the trek's high camp at 4,300m, among the first of the alpine lakes.", destinationName: "Thimphu", activities: ["Labatama lakes"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 5, title: "Rest day at Labatama", description: "A day to acclimatize and explore the surrounding lakes on foot.", destinationName: "Thimphu", activities: ["Labatama lake exploration"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 6, title: "Trek to Panka", description: "Descend gradually through yak pasture toward Panka camp at 4,000m.", destinationName: "Thimphu", activities: ["Yak herder camps"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 7, title: "Trek out & drive to Thimphu", description: "The final descent to Chamgang trailhead, then a drive into the capital.", destinationName: "Thimphu", activities: ["Chamgang trailhead"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 8, title: "Departure via Paro", description: "Drive back to Paro for your onward flight.", destinationName: "Paro", activities: ["Departure transfer"], mealsIncluded: ["Breakfast"] },
    ],
  },

  // 10 — Druk Path Trek
  {
    title: "Druk Path Trek",
    slug: "druk-path-trek",
    category: "TREKKING",
    difficulty: "MODERATE",
    summary: "A classic five-day trek between Paro and Thimphu, past a string of alpine lakes and a cliffside monastery.",
    description:
      "One of Bhutan's most popular treks precisely because it connects two towns without a long drive back to the start — you walk out of Paro and down into Thimphu, passing ancient dzong ruins, glacial lakes, and Phajoding Monastery along the way.",
    durationDays: 9,
    pricePerPerson: 94500,
    maxGroupSize: 8,
    includes: TREK_INCLUDES,
    excludes: STANDARD_EXCLUDES,
    days: [
      { dayNumber: 1, title: "Arrival in Paro", description: "Arrive at Paro International Airport.", destinationName: "Paro", activities: ["Airport pickup"], mealsIncluded: ["Lunch", "Dinner"] },
      { dayNumber: 2, title: "Paro Valley sightseeing", description: "Dzong ruins and an old temple, plus a Tiger's Nest viewpoint, before the trek begins.", destinationName: "Paro", activities: ["Drukgyal Dzong ruins", "Kyichu Lhakhang", "Tiger's Nest viewpoint"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 3, title: "Trek to Jele Dzong", description: "A steep first day climbing to a ridgeline dzong at 3,450m, with views back over Paro.", destinationName: "Paro", activities: ["Jele Dzong"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 4, title: "Trek to Tsokam", description: "A ridge walk through rhododendron forest to camp at 3,780m.", destinationName: "Paro", activities: ["Ridge trail views"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 5, title: "Trek to Jimilang Tsho", description: "Reach the first of the trek's alpine lakes, known for its trout.", destinationName: "Thimphu", activities: ["Jimilang Tsho lake"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 6, title: "Trek to Simkotra Tsho", description: "The trek's high point at 4,050m, past a second glacial lake.", destinationName: "Thimphu", activities: ["Simkotra Tsho lake"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 7, title: "Trek to Phajoding, descend to Thimphu", description: "Pass a cliffside monastery complex before descending into the capital.", destinationName: "Thimphu", activities: ["Phajoding Monastery"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 8, title: "Thimphu sightseeing", description: "A rest day exploring the capital's dzong and arts institute.", destinationName: "Thimphu", activities: ["Tashichho Dzong", "Memorial Chorten", "Arts & crafts institute"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 9, title: "Departure via Paro", description: "Drive back to Paro for your onward flight.", destinationName: "Paro", activities: ["Departure transfer"], mealsIncluded: ["Breakfast"] },
    ],
  },

  // 11 — 11-Day Jomolhari Trek (via Chele La & Haa)
  {
    title: "Jomolhari High Trek via Haa Valley",
    slug: "jomolhari-high-trek-via-haa-valley",
    category: "TREKKING",
    difficulty: "CHALLENGING",
    summary: "An 11-day trek to the foot of Mt. Jomolhari, crossing two of Bhutan's highest passes and detouring through Haa Valley.",
    description:
      "This is a longer, harder version of our 9-day Jomolhari Base Camp Trek — it adds a Haa Valley excursion before setting out, then continues past base camp over Nyele La and Yale La, Bhutan's highest trekking passes at nearly 5,000m, before descending through remote Lingshi and Shodu.",
    durationDays: 11,
    pricePerPerson: 132000,
    maxGroupSize: 8,
    includes: TREK_INCLUDES,
    excludes: STANDARD_EXCLUDES,
    days: [
      { dayNumber: 1, title: "Arrival, transfer to Thimphu", description: "Arrive in Paro and drive to the capital.", destinationName: "Thimphu", activities: ["Airport pickup"], mealsIncluded: ["Lunch", "Dinner"] },
      { dayNumber: 2, title: "Paro sightseeing & Tiger's Nest hike", description: "Dzong ruins and Bhutan's signature hike before the trek begins.", destinationName: "Paro", activities: ["Drukgyal Dzong ruins", "Paro Taktsang (Tiger's Nest)", "Kyichu Lhakhang"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 3, title: "Day trip to Haa via Chele La", description: "Cross one of Bhutan's highest motorable passes into a quiet farming valley, then return to Paro.", destinationName: "Haa", activities: ["Chele La Pass", "Haa Valley"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 4, title: "Trek begins: Paro to Shana", description: "A long first day following the Paro Chhu river into Jigme Dorji National Park.", destinationName: "Paro", activities: ["Jigme Dorji National Park"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 5, title: "Shana to Jangothang", description: "The approach to Jomolhari base camp, with the mountain coming into view.", destinationName: "Paro", activities: ["Jangothang (Jomolhari base camp)"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 6, title: "Jangothang to Lingshi via Nyele La", description: "The trek's first big pass at 4,700m, descending into the remote Lingshi valley.", destinationName: "Thimphu", activities: ["Nyele La Pass", "Lingshi Dzong"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 7, title: "Lingshi to Shodu via Yale La", description: "The trek's highest point at 4,950m.", destinationName: "Thimphu", activities: ["Yale La Pass"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 8, title: "Shodu to Barshong", description: "A long descent through rhododendron forest.", destinationName: "Thimphu", activities: ["Forest descent"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 9, title: "Barshong to Dolam Kencho", description: "Following the Thimphu Chhu river downstream.", destinationName: "Thimphu", activities: ["Riverside trail"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 10, title: "Trek out to Dodina, drive to Thimphu", description: "The final short walk out of the park, then a drive into the capital.", destinationName: "Thimphu", activities: ["Dodina trailhead"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 11, title: "Departure via Paro", description: "Drive back to Paro for your onward flight.", destinationName: "Paro", activities: ["Departure transfer"], mealsIncluded: ["Breakfast"] },
    ],
  },

  // 12 — Gangtey Valley Trek
  {
    title: "Gangtey Valley Trek with Haa Excursion",
    slug: "gangtey-valley-trek-haa-excursion",
    category: "TREKKING",
    difficulty: "MODERATE",
    summary: "A gentler trek between hidden farming valleys near Phobjikha, paired with a Haa Valley day trip and Tiger's Nest.",
    description:
      "This route treks between two valleys most visitors never see — Gogona and Khotokha — connected to Phobjikha's crane habitat by two moderate passes, then rounds out with sightseeing in Punakha, a Haa Valley excursion, and Tiger's Nest.",
    durationDays: 10,
    pricePerPerson: 105000,
    maxGroupSize: 8,
    includes: TREK_INCLUDES,
    excludes: STANDARD_EXCLUDES,
    days: [
      { dayNumber: 1, title: "Arrival in Paro", description: "Arrive at Paro International Airport.", destinationName: "Paro", activities: ["Airport pickup"], mealsIncluded: ["Lunch", "Dinner"] },
      { dayNumber: 2, title: "Paro to Thimphu sightseeing", description: "A short transfer and an afternoon in the capital.", destinationName: "Thimphu", activities: ["Thimphu Dzong"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 3, title: "Drive to Gangtey via Dochula", description: "Cross Dochula Pass en route to the trailhead at Gangtey Monastery.", destinationName: "Wangdue Phodrang", activities: ["Dochula Pass", "Gangtey Monastery"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 4, title: "Trek to Gogona via Tsele La", description: "Cross a 3,400m pass into a remote farming valley rarely visited by trekkers.", destinationName: "Wangdue Phodrang", activities: ["Tsele La Pass", "Gogona village"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 5, title: "Trek to Khotokha via Shobju La", description: "A second high pass leads into another hidden valley.", destinationName: "Wangdue Phodrang", activities: ["Shobju La Pass", "Khotokha village"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 6, title: "Trek out, drive to Punakha", description: "The final trekking day, followed by a visit to Punakha Dzong.", destinationName: "Punakha", activities: ["Punakha Dzong"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 7, title: "Punakha to Thimphu", description: "A relaxed drive back over Dochula Pass.", destinationName: "Thimphu", activities: ["Dochula Pass"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 8, title: "Day trip to Haa via Chele La", description: "Cross Bhutan's high pass country into a quiet, little-visited valley.", destinationName: "Haa", activities: ["Chele La Pass", "Haa Valley"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 9, title: "Tiger's Nest hike", description: "Bhutan's signature hike to close out the trip.", destinationName: "Paro", activities: ["Paro Taktsang (Tiger's Nest)"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 10, title: "Departure", description: "Transfer to the airport for your flight home.", destinationName: "Paro", activities: ["Departure transfer"], mealsIncluded: ["Breakfast"] },
    ],
  },

  // 13 — Laya-Gasa Trek
  {
    title: "Laya-Gasa High Himalaya Trek",
    slug: "laya-gasa-high-himalaya-trek",
    category: "TREKKING",
    difficulty: "CHALLENGING",
    summary: "A 21-day expedition through the remote Laya region, crossing five-thousand-meter passes and visiting Bhutan's most isolated village.",
    description:
      "This is one of the longest treks we offer — three weeks through Bhutan's high northwest, timed if possible around the Gasa Tshechu festival, with a rest day among the yak-herding Layap people before a string of passes near 4,700-5,000m carries you back south to Paro.",
    durationDays: 21,
    pricePerPerson: 231000,
    maxGroupSize: 6,
    includes: TREK_INCLUDES,
    excludes: STANDARD_EXCLUDES,
    days: [
      { dayNumber: 1, title: "Arrival, Thimphu sightseeing", description: "Arrive in Paro and drive to Thimphu for initial sightseeing.", destinationName: "Thimphu", activities: ["Airport pickup", "Thimphu Dzong"], mealsIncluded: ["Lunch", "Dinner"] },
      { dayNumber: 2, title: "Thimphu heritage sites", description: "Museums and the capital's central monastic fortress.", destinationName: "Thimphu", activities: ["National museums", "Simtokha Dzong"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 3, title: "Thimphu to Punakha via Dochula", description: "Punakha Dzong and a hilltop chorten hike.", destinationName: "Punakha", activities: ["Dochula Pass", "Punakha Dzong", "Khamsum Yulley Chorten"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 4, title: "Drive to Damji, trek begins", description: "The road ends at Damji, where the trek into Gasa dzongkhag starts.", destinationName: "Gasa", activities: ["Trailhead departure"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 5, title: "Trek to Gasa Hot Springs", description: "A 15km walk to Bhutan's best-known natural hot springs.", destinationName: "Gasa", activities: ["Gasa Tshachu hot springs"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 6, title: "Gasa Dzong & rest day", description: "Visit Gasa's dzong and, festival dates permitting, the Gasa Tshechu.", destinationName: "Gasa", activities: ["Gasa Dzong", "Gasa Tshechu (seasonal)"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 7, title: "Trek to Koena via Bale La", description: "A 22km day over a 3,740m pass.", destinationName: "Gasa", activities: ["Bale La Pass"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 8, title: "Trek to Laya village", description: "Arrive in one of Bhutan's most remote and distinctive settlements.", destinationName: "Gasa", activities: ["Laya village"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 9, title: "Rest day in Laya", description: "Time to explore Layap culture, known for its conical bamboo hats and yak-herding way of life.", destinationName: "Gasa", activities: ["Layap cultural visit"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 10, title: "Trek to Limithang", description: "A shorter day following the Mo Chhu upstream.", destinationName: "Gasa", activities: ["Riverside trail"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 11, title: "Trek to Robluthang via high pass", description: "A demanding day crossing one of the trek's ~5,000m passes.", destinationName: "Gasa", activities: ["High pass crossing"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 12, title: "Trek to Shakshepasa via 4,785m pass", description: "Another long, high day through remote terrain.", destinationName: "Gasa", activities: ["Mountain pass"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 13, title: "Trek to Chebisa via Gombu La", description: "Descend into a scenic village known for a cliffside waterfall.", destinationName: "Gasa", activities: ["Gombu La Pass", "Chebisa village"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 14, title: "Trek to Lingshi", description: "Onward to the fortified monastery-village of Lingshi.", destinationName: "Thimphu", activities: ["Lingshi Dzong"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 15, title: "Trek toward Jangothang", description: "The route joins the classic Jomolhari trail, with the mountain now in view.", destinationName: "Paro", activities: ["Jangothang approach"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 16, title: "Acclimatization day at Jangothang", description: "A rest day at the foot of Mt. Jomolhari.", destinationName: "Paro", activities: ["Jangothang (Jomolhari base camp)"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 17, title: "Trek to Thangthangka", description: "Descending back through the Paro Chhu valley.", destinationName: "Paro", activities: ["Valley descent"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 18, title: "Trek toward Shana", description: "Following the old trade route back down the valley.", destinationName: "Paro", activities: ["Old trade route"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 19, title: "Trek out to Drukgyal Dzong", description: "The final trekking day, arriving back at the valley floor.", destinationName: "Paro", activities: ["Drukgyal Dzong ruins"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 20, title: "Paro sightseeing & Tiger's Nest hike", description: "A well-earned rest day capped with Bhutan's signature hike.", destinationName: "Paro", activities: ["Paro Taktsang (Tiger's Nest)"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 21, title: "Departure", description: "Transfer to the airport for your flight home.", destinationName: "Paro", activities: ["Departure transfer"], mealsIncluded: ["Breakfast"] },
    ],
  },

  // 14 — Merak Sakteng Trek
  {
    title: "Merak & Sakteng Cultural Trek",
    slug: "merak-sakteng-cultural-trek",
    category: "TREKKING",
    difficulty: "MODERATE",
    summary: "An 18-day journey to Bhutan's far east, ending with a trek to the semi-nomadic Brokpa villages of Merak and Sakteng.",
    description:
      "Merak and Sakteng are home to the Brokpa, a semi-nomadic yak-herding people with their own distinct dress and dialect, in a valley long associated with local yeti folklore. Getting there means crossing the country first — a full central-and-eastern-Bhutan tour precedes the trek itself.",
    durationDays: 18,
    pricePerPerson: 180000,
    maxGroupSize: 8,
    includes: TREK_INCLUDES,
    excludes: STANDARD_EXCLUDES,
    days: [
      { dayNumber: 1, title: "Arrival, transfer to Thimphu", description: "Arrive in Paro and drive to the capital.", destinationName: "Thimphu", activities: ["Airport pickup"], mealsIncluded: ["Lunch", "Dinner"] },
      { dayNumber: 2, title: "Thimphu heritage sites", description: "A day through the capital's dzong, museums, and monuments.", destinationName: "Thimphu", activities: ["Thimphu Dzong", "Memorial Chorten"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 3, title: "Thimphu to Wangdue via Dochula", description: "Cross the pass into central Bhutan.", destinationName: "Wangdue Phodrang", activities: ["Dochula Pass"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 4, title: "Phobjikha Valley", description: "Bhutan's glacial crane valley and its hillside monastery.", destinationName: "Wangdue Phodrang", activities: ["Phobjikha Valley", "Gangtey Monastery"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 5, title: "Drive to Trongsa", description: "The ancestral seat of Bhutan's royal family.", destinationName: "Trongsa", activities: ["Trongsa Dzong"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 6, title: "Bumthang sightseeing", description: "A day among the valley's founding-era temples.", destinationName: "Bumthang", activities: ["Jakar Dzong", "Kurjey Lhakhang"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 7, title: "Drive to Trashigang via Thrumshingla", description: "A dramatic mountain-pass crossing into eastern Bhutan.", destinationName: "Trashigang", activities: ["Thrumshingla National Park"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 8, title: "Trek begins toward Charbaling", description: "Leave the road behind for high grazing grounds.", destinationName: "Trashigang", activities: ["Charbaling grazing grounds"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 9, title: "Trek to Merak via Thumburtsa La", description: "Cross a 3,273m pass into the first of the Brokpa villages.", destinationName: "Trashigang", activities: ["Thumburtsa La Pass", "Merak village"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 10, title: "Trek to Sakteng via Nyuksang La", description: "The trek's high point at 4,140m, into the second Brokpa village.", destinationName: "Trashigang", activities: ["Nyuksang La Pass", "Sakteng village"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 11, title: "Explore Sakteng", description: "A day among Brokpa herding communities inside the Sakteng Wildlife Sanctuary.", destinationName: "Trashigang", activities: ["Sakteng Wildlife Sanctuary", "Brokpa village life"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 12, title: "Trek to Jyonkhar via Munde La", description: "Descend over a lower pass toward the roadhead.", destinationName: "Trashigang", activities: ["Munde La Pass"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 13, title: "Trek out to Phongme", description: "A short final walking day back to the road.", destinationName: "Trashigang", activities: ["Phongme village"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 14, title: "Drive to Bumthang", description: "Retrace the mountain road west.", destinationName: "Bumthang", activities: ["Thrumshingla National Park"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 15, title: "Drive to Punakha", description: "A long transfer day toward western Bhutan.", destinationName: "Punakha", activities: ["Trongsa Dzong"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 16, title: "Punakha sightseeing", description: "Punakha Dzong and the fertility temple.", destinationName: "Punakha", activities: ["Punakha Dzong", "Chimi Lhakhang"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 17, title: "Paro sightseeing & Tiger's Nest hike", description: "Bhutan's signature hike to close out the trip.", destinationName: "Paro", activities: ["Paro Taktsang (Tiger's Nest)"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 18, title: "Departure", description: "Transfer to the airport for your flight home.", destinationName: "Paro", activities: ["Departure transfer"], mealsIncluded: ["Breakfast"] },
    ],
  },

  // 15 — 12-Day Jomolhari Trek (Classic Route)
  {
    title: "Jomolhari Trek — Classic Route",
    slug: "jomolhari-trek-classic-route",
    category: "TREKKING",
    difficulty: "CHALLENGING",
    summary: "A 12-day approach to Mt. Jomolhari via Jangothang, continuing on over Lingshi and Shodu rather than turning back.",
    description:
      "Where our shorter Jomolhari Base Camp Trek turns around after reaching the mountain, this classic through-route continues north over two more high passes before dropping back down to Thimphu — a longer, harder trek for those who want to see more of the range beyond base camp.",
    durationDays: 12,
    pricePerPerson: 144000,
    maxGroupSize: 8,
    includes: TREK_INCLUDES,
    excludes: STANDARD_EXCLUDES,
    days: [
      { dayNumber: 1, title: "Arrival in Paro", description: "Arrive at Paro International Airport.", destinationName: "Paro", activities: ["Airport pickup"], mealsIncluded: ["Lunch", "Dinner"] },
      { dayNumber: 2, title: "Tiger's Nest hike", description: "Acclimatize with Bhutan's signature hike.", destinationName: "Paro", activities: ["Paro Taktsang (Tiger's Nest)"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 3, title: "Trek begins: Paro to Shana", description: "Follow the Paro Chhu river into Jigme Dorji National Park.", destinationName: "Paro", activities: ["Jigme Dorji National Park"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 4, title: "Shana to Thangthangka", description: "A long day gaining altitude through pine and rhododendron forest.", destinationName: "Paro", activities: ["Forest trail"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 5, title: "Thangthangka to Jangothang", description: "Arrive at Jomolhari base camp, with the mountain now visible.", destinationName: "Paro", activities: ["Jangothang (Jomolhari base camp)"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 6, title: "Rest day at Jangothang", description: "An optional side hike to a turquoise glacial lake.", destinationName: "Paro", activities: ["Tshophu Lake (optional)"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 7, title: "Jangothang to Lingshi", description: "Cross a high pass into the remote Lingshi valley.", destinationName: "Thimphu", activities: ["Lingshi Dzong"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 8, title: "Lingshi to Shodu", description: "The trek's highest point, near 4,950m.", destinationName: "Thimphu", activities: ["High pass crossing"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 9, title: "Shodu to Barshong", description: "A long descent through rhododendron forest.", destinationName: "Thimphu", activities: ["Forest descent"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 10, title: "Barshong to Dodina, drive to Thimphu", description: "The final trekking day, followed by a drive into the capital.", destinationName: "Thimphu", activities: ["Dodina trailhead"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 11, title: "Thimphu sightseeing", description: "A rest day among the capital's monuments and museums.", destinationName: "Thimphu", activities: ["Buddha Dordenma", "Tashichho Dzong"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 12, title: "Departure via Paro", description: "Drive back to Paro for your onward flight.", destinationName: "Paro", activities: ["Departure transfer"], mealsIncluded: ["Breakfast"] },
    ],
  },

  // 16 — Royal Manas Wildlife Expedition
  {
    title: "Royal Manas Jungle & Wildlife Expedition",
    slug: "royal-manas-jungle-wildlife-expedition",
    category: "WILDLIFE",
    difficulty: "MODERATE",
    summary: "A rare lowland jungle expedition through Royal Manas National Park, tracking wildlife by foot, river, and raft.",
    description:
      "This is Bhutan's only true jungle safari — a UNESCO-recognized park along the Indian border, home to tigers, golden langurs, and elephants, reached through the country's least-visited southern belt. Because it requires small groups and heavier logistics than our other packages, it's priced and paced accordingly.",
    durationDays: 10,
    pricePerPerson: 145000,
    maxGroupSize: 5,
    includes: [...TREK_INCLUDES, "River rafting equipment"],
    excludes: STANDARD_EXCLUDES,
    days: [
      { dayNumber: 1, title: "Overland to Gelephu", description: "Cross the border into southern Bhutan and continue to Gelephu.", destinationName: "Sarpang", activities: ["Border crossing"], mealsIncluded: ["Lunch", "Dinner"] },
      { dayNumber: 2, title: "Drive to Gomphu eco-camp", description: "A scenic drive through Zhemgang, with birdwatching stops along the way.", destinationName: "Zhemgang", activities: ["Birdwatching en route"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 3, title: "Trek to Pangtang", description: "The first day into the park's forest interior.", destinationName: "Zhemgang", activities: ["Forest trekking"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 4, title: "Trek to Shilingtoe", description: "Lowland forest known for its rich birdlife.", destinationName: "Zhemgang", activities: ["Birdwatching"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 5, title: "Trek to Panbang via caves & waterfall", description: "Pass limestone caves and a twin waterfall en route to riverside camp.", destinationName: "Zhemgang", activities: ["Cave systems", "Lelang Twin Waterfall"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 6, title: "Rafting & fishing on the Dangme Chhu", description: "A day on the river, with a short walk through the park.", destinationName: "Zhemgang", activities: ["River rafting", "Fishing"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 7, title: "Wildlife trekking in Royal Manas", description: "The park's core zone, home to tigers, elephants, and golden langurs.", destinationName: "Zhemgang", activities: ["Royal Manas National Park"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 8, title: "Extra day in the park", description: "A flexible day for further wildlife tracking or river time.", destinationName: "Zhemgang", activities: ["Wildlife tracking"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 9, title: "Trek out via Norbugang", description: "The expedition's toughest day, retracing the route out of the park.", destinationName: "Zhemgang", activities: ["Norbugang trail"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 10, title: "Departure", description: "Drive back across the border for your onward journey.", destinationName: "Sarpang", activities: ["Border crossing"], mealsIncluded: ["Breakfast"] },
    ],
  },

  // 17 — Sagala Trek
  {
    title: "Sagala Trek via Haa Valley",
    slug: "sagala-trek-via-haa-valley",
    category: "TREKKING",
    difficulty: "MODERATE",
    summary: "A short alpine trek through wildflower meadows near Haa, with views of Mt. Jomolhari from camp.",
    description:
      "The Sagala Pass sits above Haa Valley in a stretch of Bhutan few trekkers reach, with the trek's high camp offering some of the best unobstructed views of Mt. Jomolhari in the country — no multi-week commitment required.",
    durationDays: 7,
    pricePerPerson: 71500,
    maxGroupSize: 8,
    includes: TREK_INCLUDES,
    excludes: STANDARD_EXCLUDES,
    days: [
      { dayNumber: 1, title: "Arrival, transfer to Thimphu", description: "Arrive in Paro and drive to the capital.", destinationName: "Thimphu", activities: ["Airport pickup"], mealsIncluded: ["Lunch", "Dinner"] },
      { dayNumber: 2, title: "Paro Valley & Tiger's Nest hike", description: "Bhutan's signature hike plus a local market visit before the trek begins.", destinationName: "Paro", activities: ["Paro Taktsang (Tiger's Nest)", "Kaja Throm market"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 3, title: "Trek to Sagala Camp", description: "Start from Talung and climb to a high camp at 3,600m.", destinationName: "Haa", activities: ["Sagala Camp"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 4, title: "Trek to Ningula", description: "A shorter day higher into alpine wildflower meadows at 3,800m.", destinationName: "Haa", activities: ["Alpine meadows"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 5, title: "Trek to Chele La, drive to Paro", description: "The trek's final stretch ends at one of Bhutan's highest motorable passes.", destinationName: "Paro", activities: ["Chele La Pass"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 6, title: "Day hike to Chumphu Monastery", description: "A remote pilgrimage site associated with a legendary floating statue.", destinationName: "Paro", activities: ["Chumphu Nye"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 7, title: "Departure", description: "Transfer to the airport for your flight home.", destinationName: "Paro", activities: ["Departure transfer"], mealsIncluded: ["Breakfast"] },
    ],
  },

  // 18 — Snowman Trek
  {
    title: "Snowman Trek",
    slug: "snowman-trek",
    category: "TREKKING",
    difficulty: "CHALLENGING",
    summary: "A 28-day, world-renowned expedition through Bhutan's high north — widely considered one of the hardest treks on Earth.",
    description:
      "Fewer people complete the Snowman Trek each year than climb Everest. It links the Jomolhari and Laya-Gasa routes and continues deep into remote Lunana, crossing pass after pass above 4,700m — including Rinchen Zoe La at 5,326m — before finally descending near Gangtey. This is a serious undertaking that demands real fitness and flexible dates, since heavy snow can close the route entirely in a given year.",
    durationDays: 28,
    pricePerPerson: 322000,
    maxGroupSize: 6,
    includes: TREK_INCLUDES,
    excludes: STANDARD_EXCLUDES,
    days: [
      { dayNumber: 1, title: "Arrival in Paro", description: "Arrive at Paro International Airport and visit the national museum.", destinationName: "Paro", activities: ["National Museum"], mealsIncluded: ["Lunch", "Dinner"] },
      { dayNumber: 2, title: "Tiger's Nest hike", description: "Acclimatize with Bhutan's signature hike before a long trek ahead.", destinationName: "Paro", activities: ["Paro Taktsang (Tiger's Nest)"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 3, title: "Trek begins: Paro to Shana", description: "Follow the Paro Chhu into Jigme Dorji National Park.", destinationName: "Paro", activities: ["Jigme Dorji National Park"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 4, title: "Shana to Thangthangka", description: "Climb through forest toward the high country at 3,800m.", destinationName: "Paro", activities: ["Forest trail"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 5, title: "Thangthangka to Jangothang", description: "Arrive at the foot of Mt. Jomolhari.", destinationName: "Paro", activities: ["Jangothang (Jomolhari base camp)"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 6, title: "Acclimatization day at Jangothang", description: "A rest day with an optional hike to Tshophu Lake.", destinationName: "Paro", activities: ["Tshophu Lake (optional)"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 7, title: "Over Nyile La to Lingshi", description: "A 4,700m pass into the remote Lingshi valley.", destinationName: "Thimphu", activities: ["Nyile La Pass", "Lingshi Dzong"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 8, title: "Lingshi to Chebisa", description: "A short day to a village known for its cliffside waterfall.", destinationName: "Thimphu", activities: ["Chebisa waterfall"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 9, title: "Chebisa to Shomuthang via Gombu La", description: "Cross a 4,440m pass into blue-sheep country.", destinationName: "Gasa", activities: ["Gombu La Pass"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 10, title: "Shomuthang to Robluthang via Jare La", description: "A 4,750m pass through a valley known for takin sightings.", destinationName: "Gasa", activities: ["Jare La Pass"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 11, title: "Robluthang to Limithang via Sinche La", description: "One of the trek's toughest days, over a 5,005m pass.", destinationName: "Gasa", activities: ["Sinche La Pass"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 12, title: "Limithang to Laya", description: "Descend into one of Bhutan's most distinctive villages.", destinationName: "Gasa", activities: ["Laya village"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 13, title: "Rest day in Laya", description: "Time among the yak-herding Layap community before pushing further north.", destinationName: "Gasa", activities: ["Layap cultural visit"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 14, title: "Laya to Rodophu", description: "Leaving the last permanent settlement behind for the high Lunana approach.", destinationName: "Gasa", activities: ["Remote high trail"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 15, title: "Rodophu to Narethang via Tsemo La", description: "A 4,900m pass into increasingly stark high terrain.", destinationName: "Gasa", activities: ["Tsemo La Pass"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 16, title: "Narethang to Tarina via Karakachu La", description: "One of the expedition's highest passes, at 5,017m.", destinationName: "Gasa", activities: ["Karakachu La Pass"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 17, title: "Tarina to Woche", description: "The first village of the remote Lunana region.", destinationName: "Gasa", activities: ["Woche village"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 18, title: "Woche to Lhedi via Keche La", description: "Pass a string of high alpine lakes at 4,700m.", destinationName: "Gasa", activities: ["Keche La Pass", "Alpine lakes"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 19, title: "Lhedi to Thanza", description: "Arrive beneath Table Mountain and Chozo Dzong, deep in Lunana.", destinationName: "Gasa", activities: ["Chozo Dzong", "Table Mountain views"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 20, title: "Rest day at Thanza", description: "A buffer day built in for weather and altitude.", destinationName: "Gasa", activities: ["Lunana village life"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 21, title: "Thanza to Tshochena", description: "A long day past a cluster of glacial lakes.", destinationName: "Gasa", activities: ["Glacial lakes"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 22, title: "Tshochena to Jichudramo via Loju La", description: "Continuing east through increasingly remote terrain.", destinationName: "Wangdue Phodrang", activities: ["Loju La Pass"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 23, title: "Jichudramo to Chukarpo via Rinchen Zoe La", description: "The expedition's highest point, at 5,326m.", destinationName: "Wangdue Phodrang", activities: ["Rinchen Zoe La Pass"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 24, title: "Chukarpo to Tampoe Tshe", description: "Descending back into forested terrain.", destinationName: "Wangdue Phodrang", activities: ["Forest descent"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 25, title: "Tampoe Tshe to Maurothang via Tempe La", description: "The trek's last major pass before the descent to civilization.", destinationName: "Wangdue Phodrang", activities: ["Tempe La Pass"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 26, title: "Trek out to Sephu, drive to Gangtey", description: "Reconnect with the road network after over three weeks on foot.", destinationName: "Wangdue Phodrang", activities: ["Sephu roadhead"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 27, title: "Gangtey to Paro", description: "A rest day's drive back to Paro Valley.", destinationName: "Paro", activities: ["Scenic drive"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 28, title: "Departure", description: "Transfer to the airport for your flight home.", destinationName: "Paro", activities: ["Departure transfer"], mealsIncluded: ["Breakfast"] },
    ],
  },

  // 19 — Paro Tshechu Festival Complete Tour (9-day)
  {
    title: "Paro Tshechu Festival Complete Tour",
    slug: "paro-tshechu-festival-complete-tour",
    category: "CULTURAL",
    difficulty: "EASY",
    summary: "A fuller 9-day version of our festival tour, adding a Phobjikha Valley detour around the Paro Tshechu.",
    description:
      "Same festival, more country — this version circles out to the black-necked crane valley of Phobjikha before returning to Paro in time for the Tshechu's masked dances and the dawn unveiling of a giant sacred thangka.",
    durationDays: 9,
    pricePerPerson: 81000,
    maxGroupSize: 12,
    includes: CULTURAL_INCLUDES,
    excludes: STANDARD_EXCLUDES,
    days: [
      { dayNumber: 1, title: "Arrival, transfer to Thimphu", description: "Arrive in Paro and drive to the capital.", destinationName: "Thimphu", activities: ["Airport pickup"], mealsIncluded: ["Lunch", "Dinner"] },
      { dayNumber: 2, title: "Thimphu sightseeing", description: "Dzong, museums, and monuments across the capital.", destinationName: "Thimphu", activities: ["Tashichho Dzong", "Memorial Chorten", "Buddha Dordenma", "Craft market"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 3, title: "Thimphu to Punakha via Dochula", description: "The fertility temple and Punakha's riverside fortress.", destinationName: "Punakha", activities: ["Dochula Pass", "Chimi Lhakhang", "Punakha Dzong"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 4, title: "Punakha to Phobjikha Valley", description: "Bhutan's glacial crane valley and its hillside monastery.", destinationName: "Wangdue Phodrang", activities: ["Gangtey Monastery", "Crane information center"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 5, title: "Phobjikha to Thimphu", description: "A return drive back over Dochula.", destinationName: "Thimphu", activities: ["Dochula Pass"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 6, title: "Thimphu to Paro", description: "A short transfer into Paro Valley.", destinationName: "Paro", activities: ["Paro town"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 7, title: "Paro Tshechu Festival", description: "A full day watching the masked cham dances at Paro's dzong.", destinationName: "Paro", activities: ["Paro Tshechu festival"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 8, title: "Tiger's Nest hike", description: "Bhutan's signature hike, plus time to shop in Paro town.", destinationName: "Paro", activities: ["Paro Taktsang (Tiger's Nest)"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 9, title: "Departure", description: "Transfer to the airport for your flight home.", destinationName: "Paro", activities: ["Departure transfer"], mealsIncluded: ["Breakfast"] },
    ],
  },

  // 20 — Thimphu Tshechu Festival Tour (7-day)
  {
    title: "Thimphu Tshechu Festival Tour",
    slug: "thimphu-tshechu-festival-tour",
    category: "CULTURAL",
    difficulty: "EASY",
    summary: "A week built around Thimphu's autumn Tshechu, one of the largest and most crowded festivals in the country.",
    description:
      "Thimphu's Tshechu draws visitors from across Bhutan for three days of masked dances at Tashichho Dzong, ending with the dawn unveiling of a giant appliquéd thangka. This route pairs the festival with the rest of the western circuit.",
    durationDays: 7,
    pricePerPerson: 62000,
    maxGroupSize: 12,
    includes: CULTURAL_INCLUDES,
    excludes: STANDARD_EXCLUDES,
    days: [
      { dayNumber: 1, title: "Arrival, Paro sightseeing", description: "Arrive in Paro and explore the valley's fortress the same day.", destinationName: "Paro", activities: ["Rinpung Dzong", "Paro town"], mealsIncluded: ["Lunch", "Dinner"] },
      { dayNumber: 2, title: "Transfer to Thimphu, sightseeing", description: "Craft markets and monuments across the capital.", destinationName: "Thimphu", activities: ["Tashichho Dzong", "Craft market", "Memorial Chorten", "Buddha Dordenma"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 3, title: "Thimphu Tshechu Festival", description: "A full day of masked cham dances and the unveiling of a giant sacred thangka.", destinationName: "Thimphu", activities: ["Thimphu Tshechu festival"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 4, title: "Thimphu to Punakha via Dochula", description: "The fertility temple, Punakha Dzong, and a riverside suspension bridge.", destinationName: "Punakha", activities: ["Dochula Pass", "Chimi Lhakhang", "Punakha Dzong", "Suspension bridge"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 5, title: "Punakha to Paro", description: "A scenic drive back west, with a stop at Wangdue's dzong ruins.", destinationName: "Paro", activities: ["Wangdue Phodrang Dzong viewpoint"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 6, title: "Tiger's Nest hike", description: "Bhutan's signature hike above Paro Valley.", destinationName: "Paro", activities: ["Paro Taktsang (Tiger's Nest)"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 7, title: "Departure", description: "Transfer to the airport for your flight home.", destinationName: "Paro", activities: ["Departure transfer"], mealsIncluded: ["Breakfast"] },
    ],
  },

  // 21 — Punakha Tshechu Festival Tour (8-day)
  {
    title: "Punakha Tshechu Festival Tour",
    slug: "punakha-tshechu-festival-tour",
    category: "CULTURAL",
    difficulty: "EASY",
    summary: "An 8-day tour timed to Punakha's Drupchen and Tshechu, which reenacts a 17th-century military victory.",
    description:
      "Punakha's festival is unusual for including a reenactment of a historic battle alongside the more familiar masked dances, all staged in the courtyard of Bhutan's most photographed dzong. This route builds a full western-Bhutan tour around it.",
    durationDays: 8,
    pricePerPerson: 72000,
    maxGroupSize: 12,
    includes: CULTURAL_INCLUDES,
    excludes: STANDARD_EXCLUDES,
    days: [
      { dayNumber: 1, title: "Arrival, transfer to Thimphu", description: "Arrive in Paro and drive to the capital.", destinationName: "Thimphu", activities: ["Airport pickup"], mealsIncluded: ["Lunch", "Dinner"] },
      { dayNumber: 2, title: "Thimphu sightseeing", description: "The capital's dzong, monuments, and traditional arts institute.", destinationName: "Thimphu", activities: ["Tashichho Dzong", "Buddha Dordenma", "Memorial Chorten", "Zorig Chusum arts institute"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 3, title: "Thimphu to Punakha via Dochula", description: "The fertility temple and Bhutan's former winter capital.", destinationName: "Punakha", activities: ["Dochula Pass", "Chimi Lhakhang", "Punakha Dzong"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 4, title: "Punakha Drupchen & Tshechu", description: "A full day of masked cham dances and a reenacted 17th-century battle scene.", destinationName: "Punakha", activities: ["Punakha Drupchen & Tshechu"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 5, title: "Punakha to Paro", description: "A scenic transfer back to Paro Valley.", destinationName: "Paro", activities: ["Scenic drive"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 6, title: "Paro leisure day", description: "Optional archery and a traditional hot-stone bath, or simply rest before the hike.", destinationName: "Paro", activities: ["Archery demonstration", "Hot-stone bath (optional)"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 7, title: "Tiger's Nest hike", description: "Bhutan's signature hike to close out the trip.", destinationName: "Paro", activities: ["Paro Taktsang (Tiger's Nest)"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 8, title: "Departure", description: "Transfer to the airport for your flight home.", destinationName: "Paro", activities: ["Departure transfer"], mealsIncluded: ["Breakfast"] },
    ],
  },

  // 22 — 3-Day Paro Highlights Tour
  {
    title: "3-Day Paro Highlights Tour",
    slug: "3-day-paro-highlights-tour",
    category: "CULTURAL",
    difficulty: "EASY",
    summary: "A weekend-length introduction to Bhutan for travelers with a short layover or limited time — all within Paro Valley.",
    description:
      "If a stopover or a tight schedule is all you have, this stays entirely in Paro Valley and still delivers the hike everyone comes for — Tiger's Nest — alongside the valley's dzong and national museum.",
    durationDays: 3,
    pricePerPerson: 30000,
    maxGroupSize: 12,
    includes: CULTURAL_INCLUDES,
    excludes: STANDARD_EXCLUDES,
    days: [
      { dayNumber: 1, title: "Arrival, Paro town", description: "Arrive at Paro International Airport and see the valley's fortress and museum.", destinationName: "Paro", activities: ["Rinpung Dzong", "National Museum (Ta Dzong)"], mealsIncluded: ["Lunch", "Dinner"] },
      { dayNumber: 2, title: "Tiger's Nest hike & Paro sightseeing", description: "The half-day hike to Paro Taktsang, followed by an old riverside temple.", destinationName: "Paro", activities: ["Paro Taktsang (Tiger's Nest)", "Kyichu Lhakhang"], mealsIncluded: ["Breakfast", "Lunch", "Dinner"] },
      { dayNumber: 3, title: "Departure", description: "Transfer to the airport for your onward flight.", destinationName: "Paro", activities: ["Departure transfer"], mealsIncluded: ["Breakfast"] },
    ],
  },
];
