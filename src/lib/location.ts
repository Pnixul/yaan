// Provider-independent search/reference snapshot. Coordinates use MapLibre order.
export type Location = {
  id: string;
  name: string;
  localName?: string;
  englishName?: string;
  address: string;
  coordinates: [number, number];
  type?: string;
  category?: string;
  district?: string;
  subdistrict?: string;
  city?: string;
  province?: string;
  country: string;
};

export const SEARCH_LIMIT = 5;
export const MIN_QUERY_LENGTH = 2;
export const MAX_QUERY_LENGTH = 200;

export function normalizeQuery(query: string) {
  return query.normalize("NFC").replace(/\s+/gu, " ").trim();
}

// Coordinate range validation is not a Bangkok administrative boundary check.
export function validCoordinates(lon: unknown, lat: unknown): boolean {
  return (
    typeof lon === "number" &&
    Number.isFinite(lon) &&
    Math.abs(lon) <= 180 &&
    typeof lat === "number" &&
    Number.isFinite(lat) &&
    Math.abs(lat) <= 90
  );
}

const textFields = {
  id: 1024,
  name: 300,
  address: 600,
  localName: 300,
  englishName: 300,
  type: 80,
  category: 100,
  district: 150,
  subdistrict: 150,
  city: 150,
  province: 150,
  country: 100,
} as const;

export function readLocation(
  params: Pick<URLSearchParams, "getAll">,
): Location | null {
  const get = (key: string) => {
    const values = params.getAll(key);
    return values.length === 1 ? values[0] : null;
  };
  const fields: Record<string, string> = {};
  for (const [field, max] of Object.entries(textFields)) {
    const value = get(field === "id" ? "location" : field);
    if (params.getAll(field === "id" ? "location" : field).length > 1)
      return null;
    if (value !== null) {
      if (
        !value.trim() ||
        value.length > max ||
        /[\u0000-\u001f\u007f]/u.test(value)
      )
        return null;
      fields[field] = value;
    }
  }
  const lat = get("lat"),
    lon = get("lon");
  if (
    !lat?.trim() ||
    !lon?.trim() ||
    !validCoordinates(Number(lon), Number(lat)) ||
    !fields.id ||
    !fields.name ||
    !fields.address ||
    !fields.country
  )
    return null;
  return { ...fields, coordinates: [Number(lon), Number(lat)] } as Location;
}

export function locationParams(location: Location): URLSearchParams {
  const params = new URLSearchParams({
    lat: String(location.coordinates[1]),
    lon: String(location.coordinates[0]),
  });
  for (const field of Object.keys(textFields) as (keyof typeof textFields)[]) {
    const value = location[field];
    if (value) params.set(field === "id" ? "location" : field, value);
  }
  return params;
}

export function locationHref(location: Location) {
  return `/explore?${locationParams(location)}`;
}
