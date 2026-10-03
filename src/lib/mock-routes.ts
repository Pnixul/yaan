import { MOCK_STREETS, type Coordinates, type MockPlace } from "./mock-places";

export type MockRoute = {
  coordinates: Coordinates[];
  meters: number;
  walkMinutes: number;
  driveMinutes: number;
};

export function buildMockRoute(
  origin: MockPlace,
  destination: MockPlace,
): MockRoute | null {
  if (origin.areaId !== destination.areaId || origin.id === destination.id)
    return null;
  const spine = MOCK_STREETS[origin.areaId];
  const from = origin.spineIndex;
  const to = destination.spineIndex;
  const between = spine.slice(Math.min(from, to), Math.max(from, to) + 1);
  if (from > to) between.reverse();
  const points = [
    ...origin.accessPath,
    ...between,
    ...destination.accessPath.toReversed(),
  ];
  const coordinates = points.filter(
    (point, i) =>
      i === 0 || point[0] !== points[i - 1][0] || point[1] !== points[i - 1][1],
  );
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  let meters = 0;
  for (let i = 1; i < coordinates.length; i++) {
    const [a, b] = [coordinates[i - 1], coordinates[i]];
    const hav =
      Math.sin(radians(b[1] - a[1]) / 2) ** 2 +
      Math.cos(radians(a[1])) *
        Math.cos(radians(b[1])) *
        Math.sin(radians(b[0] - a[0]) / 2) ** 2;
    meters += 6371000 * 2 * Math.atan2(Math.sqrt(hav), Math.sqrt(1 - hav));
  }
  // Display-only estimates along fictional geometry, not routing or traffic models.
  return {
    coordinates,
    meters: Math.max(10, Math.round(meters / 10) * 10),
    walkMinutes: Math.max(1, Math.ceil(meters / 75)),
    driveMinutes: Math.max(2, Math.ceil(meters / 250) + 2),
  };
}

export function formatDistance(meters: number) {
  return meters < 1000 ? `${meters} m` : `${(meters / 1000).toFixed(1)} km`;
}
