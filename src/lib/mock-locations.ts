export type MockReport = {
  id: string;
  street: string;
  date: string;
  coordinates: [number, number];
};

export type MockArea = {
  id: string;
  name: string;
  thaiName: string;
  district: string;
  place: string;
  coordinates: [number, number];
  category: "Moderate flood risk" | "Insufficient information";
  explanation: string;
  reports: MockReport[];
  illustration: [number, number][];
};

// Entirely fictional fixtures for evaluating the interface. Categories are
// editorial examples, not calculated scores. Polygons are illustrative shapes,
// not validated analysis boundaries, flood extents, or a geographic radius.
export const MOCK_AREAS: MockArea[] = [
  {
    id: "lat-krabang",
    name: "Lat Krabang",
    thaiName: "ลาดกระบัง",
    district: "Lat Krabang",
    place: "KMITL main entrance",
    coordinates: [100.7788, 13.7274],
    category: "Insufficient information",
    explanation:
      "This sample has no flood records for the area. Missing information is not evidence of low risk.",
    reports: [],
    illustration: [
      [100.77, 13.733],
      [100.781, 13.735],
      [100.787, 13.729],
      [100.783, 13.722],
      [100.771, 13.722],
      [100.77, 13.733],
    ],
  },
  {
    id: "ari",
    name: "Ari",
    thaiName: "อารีย์",
    district: "Phaya Thai",
    place: "Ari BTS station",
    coordinates: [100.5446, 13.7797],
    category: "Moderate flood risk",
    explanation:
      "In this example, nearby streets have occasional flood reports, mostly during the wetter months.",
    reports: [
      {
        id: "ari-1",
        street: "Soi Ari 1",
        date: "2024-10-08",
        coordinates: [100.5433, 13.7809],
      },
      {
        id: "ari-2",
        street: "Soi Ari 2",
        date: "2024-09-21",
        coordinates: [100.5419, 13.7819],
      },
      {
        id: "ari-3",
        street: "Phahonyothin Road",
        date: "2023-10-12",
        coordinates: [100.5463, 13.7825],
      },
      {
        id: "ari-4",
        street: "Soi Ari Samphan",
        date: "2023-09-17",
        coordinates: [100.5397, 13.7795],
      },
      {
        id: "ari-5",
        street: "Soi Phahonyothin 7",
        date: "2022-09-10",
        coordinates: [100.5425, 13.7782],
      },
      {
        id: "ari-6",
        street: "Phahonyothin Road",
        date: "2022-08-25",
        coordinates: [100.5464, 13.7774],
      },
    ],
    illustration: [
      [100.5382, 13.7832],
      [100.5425, 13.785],
      [100.5486, 13.7835],
      [100.5495, 13.7793],
      [100.5473, 13.7758],
      [100.541, 13.7755],
      [100.5375, 13.7789],
      [100.5382, 13.7832],
    ],
  },
  {
    id: "thong-lo",
    name: "Thong Lo",
    thaiName: "ทองหล่อ",
    district: "Watthana",
    place: "Thong Lo BTS station",
    coordinates: [100.5786, 13.7242],
    category: "Moderate flood risk",
    explanation:
      "This fictional example shows a few nearby street-flooding reports. It does not describe current conditions.",
    reports: [
      {
        id: "thong-1",
        street: "Sukhumvit Soi 55",
        date: "2024-10-04",
        coordinates: [100.5802, 13.7274],
      },
      {
        id: "thong-2",
        street: "Sukhumvit Road",
        date: "2024-09-15",
        coordinates: [100.5764, 13.7253],
      },
      {
        id: "thong-3",
        street: "Soi Thong Lo 2",
        date: "2023-09-28",
        coordinates: [100.5823, 13.7262],
      },
      {
        id: "thong-4",
        street: "Sukhumvit Soi 38",
        date: "2022-10-19",
        coordinates: [100.5779, 13.7217],
      },
    ],
    illustration: [
      [100.573, 13.727],
      [100.577, 13.7295],
      [100.5839, 13.729],
      [100.585, 13.724],
      [100.5805, 13.7202],
      [100.574, 13.7209],
      [100.573, 13.727],
    ],
  },
  {
    id: "silom",
    name: "Silom",
    thaiName: "สีลม",
    district: "Bang Rak",
    place: "Sala Daeng BTS station",
    coordinates: [100.534, 13.7285],
    category: "Insufficient information",
    explanation:
      "This example has no report data. Missing reports do not mean an area is safe from flooding.",
    reports: [],
    illustration: [
      [100.5275, 13.731],
      [100.533, 13.733],
      [100.5395, 13.731],
      [100.54, 13.726],
      [100.5335, 13.724],
      [100.528, 13.726],
      [100.5275, 13.731],
    ],
  },
];

export const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function monthCounts(reports: MockReport[]) {
  return MONTHS.map(
    (_, month) =>
      reports.filter((report) => Number(report.date.slice(5, 7)) === month + 1)
        .length,
  );
}

export function formatReportDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}
