export type DzongkhagRegion = "WEST" | "CENTRAL" | "EAST";

export type DzongkhagSeed = {
  name: string;
  slug: string;
  region: DzongkhagRegion;
  description: string;
  highlights: string[];
  latitude: number;
  longitude: number;
};

// Bhutan's 20 dzongkhags (districts), grouped into the three regions
// commonly used for tourism itineraries (Western / Central / Eastern).
// Coordinates are approximate (dzongkhag capital/main town).
export const DZONGKHAGS: DzongkhagSeed[] = [
  // --- Western Bhutan ------------------------------------------------
  {
    name: "Thimphu",
    slug: "thimphu",
    region: "WEST",
    description:
      "Bhutan's capital and largest city, where traditional architecture meets a fast-growing urban center — with no traffic lights by choice.",
    highlights: ["Tashichho Dzong", "Buddha Dordenma statue", "Memorial Chorten", "Weekend Market"],
    latitude: 27.4712,
    longitude: 89.6339,
  },
  {
    name: "Paro",
    slug: "paro",
    region: "WEST",
    description:
      "Home to Bhutan's only international airport and its most iconic sight — the cliffside Tiger's Nest monastery.",
    highlights: ["Paro Taktsang (Tiger's Nest)", "Rinpung Dzong", "National Museum of Bhutan", "Drukgyel Dzong ruins"],
    latitude: 27.4305,
    longitude: 89.4133,
  },
  {
    name: "Punakha",
    slug: "punakha",
    region: "WEST",
    description:
      "The former winter capital, set at the confluence of two rivers, and home to one of the country's most photographed dzongs.",
    highlights: ["Punakha Dzong", "Punakha Suspension Bridge", "Chimi Lhakhang (fertility temple)"],
    latitude: 27.5921,
    longitude: 89.8797,
  },
  {
    name: "Wangdue Phodrang",
    slug: "wangdue-phodrang",
    region: "WEST",
    description:
      "A gateway to central Bhutan, best known for the glacial Phobjikha Valley where black-necked cranes winter each year.",
    highlights: ["Phobjikha Valley", "Gangtey Monastery", "Wangdue Phodrang Dzong"],
    latitude: 27.4870,
    longitude: 89.8990,
  },
  {
    name: "Haa",
    slug: "haa",
    region: "WEST",
    description:
      "One of Bhutan's least-visited valleys — opened to tourism only in 2002 — with pristine landscapes and Chele La pass views.",
    highlights: ["Haa Valley", "Chele La Pass", "Lhakhang Karpo & Lhakhang Nagpo temples"],
    latitude: 27.3333,
    longitude: 89.1833,
  },
  {
    name: "Gasa",
    slug: "gasa",
    region: "WEST",
    description:
      "Bhutan's most remote and sparsely populated dzongkhag, the starting point for high-altitude treks and known for its hot springs.",
    highlights: ["Gasa Dzong", "Gasa Tshachu hot springs", "Jomolhari trek gateway"],
    latitude: 27.9167,
    longitude: 89.7167,
  },
  {
    name: "Chukha",
    slug: "chukha",
    region: "WEST",
    description:
      "Bhutan's hydropower heartland along the road between Phuentsholing and Thimphu, with steep forested gorges.",
    highlights: ["Chukha Dzong", "Chukha Hydropower Project", "Wangchulo Dzong"],
    latitude: 27.0800,
    longitude: 89.5500,
  },
  {
    name: "Samtse",
    slug: "samtse",
    region: "WEST",
    description:
      "A southwestern border dzongkhag of tea gardens and lower-elevation forest, bordering West Bengal, India.",
    highlights: ["Samtse town", "Dorokha region", "Southern border trade routes"],
    latitude: 26.9000,
    longitude: 89.0833,
  },

  // --- Central Bhutan --------------------------------------------------
  {
    name: "Bumthang",
    slug: "bumthang",
    region: "CENTRAL",
    description:
      "Considered Bhutan's spiritual heartland, home to some of its oldest temples, apple orchards, and cheese and honey production.",
    highlights: ["Jambay Lhakhang", "Kurjey Lhakhang", "Tamshing Monastery", "Local cheese & honey"],
    latitude: 27.6667,
    longitude: 90.7333,
  },
  {
    name: "Trongsa",
    slug: "trongsa",
    region: "CENTRAL",
    description:
      "The ancestral seat of Bhutan's royal family, perched dramatically above the Mangde River gorge.",
    highlights: ["Trongsa Dzong", "Ta Dzong (Royal Heritage Museum)"],
    latitude: 27.5000,
    longitude: 90.5000,
  },
  {
    name: "Zhemgang",
    slug: "zhemgang",
    region: "CENTRAL",
    description:
      "A biodiversity hotspot of dense subtropical forest, home to the Royal Manas National Park.",
    highlights: ["Royal Manas National Park", "Zhemgang Dzong", "Golden langur habitat"],
    latitude: 27.2167,
    longitude: 90.6500,
  },
  {
    name: "Dagana",
    slug: "dagana",
    region: "CENTRAL",
    description:
      "A remote dzongkhag of terraced hillsides and orange orchards, less visited by tourists.",
    highlights: ["Daga Dzong", "Terraced farmland"],
    latitude: 27.0833,
    longitude: 89.8833,
  },
  {
    name: "Tsirang",
    slug: "tsirang",
    region: "CENTRAL",
    description:
      "Bhutan's youngest dzongkhag, known for citrus orchards and gentle, rolling hills.",
    highlights: ["Tsirang town", "Citrus orchards"],
    latitude: 27.0333,
    longitude: 90.1167,
  },
  {
    name: "Sarpang",
    slug: "sarpang",
    region: "CENTRAL",
    description:
      "Bhutan's southern gateway near Gelephu, with subtropical plains bordering Assam, India.",
    highlights: ["Gelephu town", "Southern plains"],
    latitude: 26.8642,
    longitude: 90.2666,
  },

  // --- Eastern Bhutan ---------------------------------------------------
  {
    name: "Mongar",
    slug: "mongar",
    region: "EAST",
    description:
      "The gateway to eastern Bhutan, reached via a dramatic winding mountain road from Bumthang.",
    highlights: ["Mongar Dzong", "Eastern mountain highway"],
    latitude: 27.2667,
    longitude: 91.2333,
  },
  {
    name: "Trashigang",
    slug: "trashigang",
    region: "EAST",
    description:
      "The largest dzongkhag in the east, historically a major trade hub on the route to Tibet and India.",
    highlights: ["Trashigang Dzong", "Gom Kora sacred site"],
    latitude: 27.3333,
    longitude: 91.5500,
  },
  {
    name: "Trashiyangtse",
    slug: "trashiyangtse",
    region: "EAST",
    description:
      "A remote, tranquil dzongkhag known for traditional wooden crafts and the sacred Chorten Kora stupa.",
    highlights: ["Chorten Kora", "Traditional wood-turning crafts", "Bomdeling Wildlife Sanctuary"],
    latitude: 27.6089,
    longitude: 91.5000,
  },
  {
    name: "Lhuentse",
    slug: "lhuentse",
    region: "EAST",
    description:
      "The ancestral home of Bhutan's royal dynasty, and the source of the country's finest hand-woven textiles.",
    highlights: ["Lhuentse Dzong", "Kurtoep weaving villages"],
    latitude: 27.6667,
    longitude: 91.1833,
  },
  {
    name: "Pemagatshel",
    slug: "pemagatshel",
    region: "EAST",
    description:
      "One of Bhutan's least-visited dzongkhags, with rolling hills and a slower pace of life.",
    highlights: ["Pemagatshel Dzong", "Rural farming villages"],
    latitude: 27.0333,
    longitude: 91.4000,
  },
  {
    name: "Samdrup Jongkhar",
    slug: "samdrup-jongkhar",
    region: "EAST",
    description:
      "Bhutan's southeastern border town, a gateway to Assam, India, at the far end of the east-west highway.",
    highlights: ["Samdrup Jongkhar town", "Southeastern border crossing"],
    latitude: 26.8000,
    longitude: 91.5083,
  },
];
