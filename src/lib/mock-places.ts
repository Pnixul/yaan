import { MOCK_AREAS } from "./mock-locations";
export type Coordinates = [number, number];
export const CATEGORIES = [
  { id: "essentials", label: "Everyday picks" },
  { id: "food", label: "Food" },
  { id: "transport", label: "Transport" },
  { id: "shopping", label: "Shopping" },
  { id: "health", label: "Health" },
  { id: "education", label: "Education" },
  { id: "parks", label: "Parks" },
  { id: "attractions", label: "Attractions" },
] as const;
export type Category = (typeof CATEGORIES)[number]["id"];
export type PlaceCategory = Exclude<Category, "essentials">;
export type MockPlace = {
  id: string;
  areaId: string;
  name: string;
  category: PlaceCategory | "office" | "home";
  description: string;
  coordinates: Coordinates;
  suggestedReference: boolean;
  featured: boolean;
  spineIndex: number;
  accessPath: Coordinates[];
};

// Fictional street corridors and access paths, hand placed for route previews.
// These are NOT a routable street dataset or verified pedestrian access.
export const MOCK_STREETS: Record<string, Coordinates[]> = {
  ari: [
    [100.5435, 13.7765],
    [100.5446, 13.7797],
    [100.5454, 13.7821],
    [100.5462, 13.7845],
  ],
  "thong-lo": [
    [100.5786, 13.7242],
    [100.58, 13.727],
    [100.5815, 13.73],
    [100.583, 13.733],
  ],
  "lat-krabang": [
    [100.772, 13.7273],
    [100.776, 13.7273],
    [100.779, 13.7274],
    [100.783, 13.7275],
  ],
  silom: [
    [100.534, 13.7285],
    [100.5318, 13.7274],
    [100.5296, 13.7263],
    [100.5274, 13.7252],
  ],
};

function place(
  areaId: string,
  id: string,
  name: string,
  category: MockPlace["category"],
  description: string,
  spineIndex: number,
  access: Coordinates[],
  featured = false,
  suggestedReference = false,
): MockPlace {
  const junction = MOCK_STREETS[areaId][spineIndex];
  const path = access.length ? [...access, junction] : [junction];
  return {
    id,
    areaId,
    name,
    category,
    description,
    coordinates: path[0],
    spineIndex,
    accessPath: path,
    featured,
    suggestedReference,
  };
}

// Realistic sample names and approximate placements, not a verified business
// directory. No hours, reviews, availability, or live journey claims.
export const MOCK_PLACES: MockPlace[] = [
  place(
    "ari",
    "ari-bus",
    "Phahon Yothin neighbourhood bus stop",
    "transport",
    "A sample street-level connection for shorter everyday trips.",
    0,
    [[100.5434, 13.7767]],
  ),
  place(
    "thong-lo",
    "thong-bus",
    "Sukhumvit neighbourhood bus stop",
    "transport",
    "A sample bus connection near the entrance to the neighbourhood.",
    0,
    [[100.578, 13.7245]],
  ),
  place(
    "silom",
    "silom-bus",
    "Silom neighbourhood bus stop",
    "transport",
    "A sample street-level connection along the main road.",
    1,
    [[100.5319, 13.7275]],
  ),
  place(
    "lat-krabang",
    "lat-learning",
    "Chalong Krung learning centre",
    "education",
    "A sample place for after-school classes and neighbourhood learning.",
    1,
    [[100.7757, 13.728]],
  ),
  place(
    "ari",
    "ari-bts",
    "Ari BTS station",
    "transport",
    "A rail connection for the everyday commute along the Sukhumvit line.",
    1,
    [],
    true,
    true,
  ),
  place(
    "ari",
    "ari-work",
    "Ari neighbourhood workspace",
    "office",
    "A sample office tucked along a quieter side street.",
    2,
    [
      [100.5435, 13.7824],
      [100.5434, 13.7827],
      [100.5456, 13.7827],
    ],
    false,
    true,
  ),
  place(
    "ari",
    "ari-home",
    "Ari garden residence",
    "home",
    "A sample residential reference point, a short walk from the main road.",
    0,
    [
      [100.5417, 13.7773],
      [100.5415, 13.7771],
    ],
    false,
    true,
  ),
  place(
    "ari",
    "ari-cafe",
    "Soi Ari corner café",
    "food",
    "Coffee, a simple breakfast, and a place to pause before work.",
    1,
    [
      [100.5428, 13.7804],
      [100.5426, 13.7805],
      [100.5448, 13.7804],
    ],
    true,
  ),
  place(
    "ari",
    "ari-kitchen",
    "Ari everyday kitchen",
    "food",
    "A casual neighbourhood lunch stop on the way home.",
    2,
    [
      [100.5435, 13.7814],
      [100.5437, 13.7825],
    ],
    false,
  ),
  place(
    "ari",
    "ari-market",
    "Ari community market",
    "shopping",
    "Groceries and small everyday errands close to the station.",
    1,
    [
      [100.5454, 13.7793],
      [100.545, 13.7791],
    ],
    true,
  ),
  place(
    "ari",
    "ari-clinic",
    "Ari family clinic",
    "health",
    "A sample primary-care stop for routine neighbourhood needs.",
    2,
    [[100.5466, 13.7817]],
    true,
  ),
  place(
    "ari",
    "ari-school",
    "Ari learning centre",
    "education",
    "A local learning space for after-school and weekend classes.",
    3,
    [[100.5444, 13.785]],
    false,
  ),
  place(
    "ari",
    "ari-park",
    "Ari pocket garden",
    "parks",
    "A small green pause away from the busier main street.",
    0,
    [[100.5418, 13.777]],
    false,
  ),
  place(
    "ari",
    "ari-gallery",
    "Ari neighbourhood gallery",
    "attractions",
    "A small cultural stop to explore on a free afternoon.",
    2,
    [
      [100.542, 13.783],
      [100.5418, 13.7833],
      [100.5458, 13.7832],
    ],
    false,
  ),

  place(
    "thong-lo",
    "thong-bts",
    "Thong Lo BTS station",
    "transport",
    "An easy reference point for a rail-based daily commute.",
    0,
    [],
    true,
    true,
  ),
  place(
    "thong-lo",
    "thong-work",
    "Thong Lo courtyard office",
    "office",
    "A sample workspace just off the main neighbourhood street.",
    1,
    [[100.5785, 13.7276]],
    false,
    true,
  ),
  place(
    "thong-lo",
    "thong-home",
    "Soi 38 residence",
    "home",
    "A sample home base on a residential side street.",
    0,
    [
      [100.5779, 13.7217],
      [100.577, 13.7221],
    ],
    false,
    true,
  ),
  place(
    "thong-lo",
    "thong-cafe",
    "Thong Lo morning café",
    "food",
    "Coffee and breakfast along the route to the station.",
    1,
    [[100.5791, 13.7273]],
    true,
  ),
  place(
    "thong-lo",
    "thong-noodles",
    "Soi 38 noodle kitchen",
    "food",
    "A casual dinner option a few side streets from the main road.",
    0,
    [
      [100.5782, 13.7226],
      [100.5775, 13.7229],
    ],
    false,
  ),
  place(
    "thong-lo",
    "thong-market",
    "Thong Lo fresh market",
    "shopping",
    "A compact grocery stop for everyday shopping.",
    2,
    [[100.5827, 13.7294]],
    true,
  ),
  place(
    "thong-lo",
    "thong-clinic",
    "Thong Lo neighbourhood clinic",
    "health",
    "Routine care close to the local shopping streets.",
    1,
    [[100.582, 13.7261]],
    true,
  ),
  place(
    "thong-lo",
    "thong-school",
    "Thong Lo language school",
    "education",
    "A sample language and evening learning centre.",
    2,
    [[100.5801, 13.7307]],
    false,
  ),
  place(
    "thong-lo",
    "thong-park",
    "Thong Lo courtyard garden",
    "parks",
    "A quiet green courtyard for a short outdoor break.",
    3,
    [[100.5817, 13.7336]],
    false,
  ),
  place(
    "thong-lo",
    "thong-art",
    "Thong Lo art space",
    "attractions",
    "A small exhibition space for a weekend wander.",
    3,
    [[100.584, 13.7324]],
    false,
  ),

  place(
    "lat-krabang",
    "lat-campus",
    "KMITL main entrance",
    "education",
    "A university reference point for exploring a study-day routine.",
    2,
    [[100.779, 13.7292]],
    true,
    true,
  ),
  place(
    "lat-krabang",
    "lat-home",
    "Lat Krabang student residence",
    "home",
    "A sample residence near the campus corridor.",
    1,
    [[100.776, 13.7254]],
    false,
    true,
  ),
  place(
    "lat-krabang",
    "lat-work",
    "Chalong Krung workspace",
    "office",
    "A sample workplace along the local neighbourhood corridor.",
    3,
    [[100.783, 13.7291]],
    false,
    true,
  ),
  place(
    "lat-krabang",
    "lat-canteen",
    "Campus-side canteen",
    "food",
    "An everyday lunch stop around the university.",
    2,
    [
      [100.7802, 13.728],
      [100.779, 13.728],
    ],
    true,
  ),
  place(
    "lat-krabang",
    "lat-cafe",
    "Lat Krabang reading café",
    "food",
    "A calm spot for coffee between study sessions.",
    1,
    [[100.776, 13.7285]],
    false,
  ),
  place(
    "lat-krabang",
    "lat-bus",
    "Chalong Krung bus stop",
    "transport",
    "A sample local bus connection; schedules are not available.",
    2,
    [[100.7792, 13.7274]],
    true,
  ),
  place(
    "lat-krabang",
    "lat-market",
    "Hua Takhe neighbourhood market",
    "shopping",
    "A sample market stop for groceries and prepared food.",
    0,
    [[100.772, 13.7258]],
    true,
  ),
  place(
    "lat-krabang",
    "lat-clinic",
    "Campus neighbourhood clinic",
    "health",
    "A local primary-care example close to the campus.",
    3,
    [[100.783, 13.7263]],
    false,
  ),
  place(
    "lat-krabang",
    "lat-park",
    "Campus lakeside garden",
    "parks",
    "A green space for an outdoor break after class.",
    2,
    [
      [100.7806, 13.7302],
      [100.779, 13.7302],
    ],
    false,
  ),
  place(
    "lat-krabang",
    "lat-art",
    "Canal-side craft house",
    "attractions",
    "A sample cultural stop along the older neighbourhood streets.",
    0,
    [
      [100.771, 13.7248],
      [100.772, 13.7248],
    ],
    false,
  ),

  place(
    "silom",
    "silom-bts",
    "Sala Daeng BTS station",
    "transport",
    "A central rail connection for a workday in Silom.",
    0,
    [],
    true,
    true,
  ),
  place(
    "silom",
    "silom-work",
    "Silom neighbourhood office",
    "office",
    "A sample workplace just off Silom Road.",
    1,
    [[100.5324, 13.7262]],
    false,
    true,
  ),
  place(
    "silom",
    "silom-food",
    "Silom lunch kitchen",
    "food",
    "A straightforward lunch stop between work and errands.",
    1,
    [[100.5314, 13.728]],
    true,
  ),
  place(
    "silom",
    "silom-shop",
    "Silom everyday market",
    "shopping",
    "Groceries and small daily essentials along the main road.",
    2,
    [[100.5292, 13.7269]],
    true,
  ),
  place(
    "silom",
    "silom-clinic",
    "Silom family clinic",
    "health",
    "A sample clinic for routine care in the neighbourhood.",
    2,
    [[100.5302, 13.7252]],
    true,
  ),
  place(
    "silom",
    "silom-school",
    "Silom evening learning centre",
    "education",
    "Classes for a study routine near the office district.",
    3,
    [[100.527, 13.7259]],
    false,
  ),
  place(
    "silom",
    "silom-park",
    "Silom courtyard garden",
    "parks",
    "A small outdoor break tucked away from the main road.",
    1,
    [
      [100.5328, 13.7257],
      [100.5325, 13.7263],
    ],
    false,
  ),
  place(
    "silom",
    "silom-gallery",
    "Silom community gallery",
    "attractions",
    "A small exhibition stop beyond the daily commute.",
    3,
    [[100.528, 13.7242]],
    false,
  ),
];

export function categoryLabel(category: MockPlace["category"]) {
  return (
    CATEGORIES.find((item) => item.id === category)?.label ??
    (category === "office" ? "Office" : "Residence")
  );
}

export function nearbyPlaces(
  areaId: string,
  referenceId: string | null,
  category: Category,
) {
  return MOCK_PLACES.filter(
    (place) =>
      place.areaId === areaId &&
      place.id !== referenceId &&
      (category === "essentials"
        ? place.featured
        : place.category === category),
  );
}

export type SearchResult = {
  id: string;
  kind: "area" | "place";
  areaId: string;
  name: string;
  subtitle: string;
  typeLabel: string;
  thaiName?: string;
};
export function searchLocations(query: string): SearchResult[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];
  const areas: SearchResult[] = MOCK_AREAS.map((area) => ({
    id: area.id,
    kind: "area",
    areaId: area.id,
    name: area.name,
    thaiName: area.thaiName,
    subtitle: `${area.district}, Bangkok`,
    typeLabel: "Area",
  }));
  const places: SearchResult[] = MOCK_PLACES.map((place) => ({
    id: place.id,
    kind: "place",
    areaId: place.areaId,
    name: place.name,
    subtitle: `${MOCK_AREAS.find((area) => area.id === place.areaId)?.name}, Bangkok`,
    typeLabel: categoryLabel(place.category),
  }));
  return [...areas, ...places]
    .filter((result) =>
      `${result.name} ${result.thaiName ?? ""} ${result.subtitle}`
        .toLowerCase()
        .includes(normalized),
    )
    .slice(0, 5);
}
