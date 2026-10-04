import type { LayerSpecification, Map } from "maplibre-gl";

type PaintProperty = Parameters<Map["setPaintProperty"]>[1];
type PaintTokens = Partial<Record<PaintProperty, string>>;

// Adapter for the existing OpenFreeMap Positron style. Keep its filters, widths,
// zoom hierarchy, labels, sources, sprites and attribution; only change paint.
export function mapPaintTokens(layer: LayerSpecification): PaintTokens {
  const id = layer.id;
  if (id === "area-fill") return { "fill-color": "map-area" };
  if (id === "area-border") return { "line-color": "map-area" };
  if (id === "route-line") return { "line-color": "map-route" };
  if (id === "route-casing") return { "line-color": "map-route-casing" };
  // Do not accidentally theme future application layers as geographic data.
  if (layer.type !== "background" && (!("source" in layer) || layer.source !== "openmaptiles")) return {};
  const source = "source-layer" in layer ? layer["source-layer"] : "";
  if (layer.type === "background") return { "background-color": "map-land" };
  if (layer.type === "fill") {
    if (source === "water") return { "fill-color": "map-water" };
    if (source === "park" || id === "landcover_wood") return { "fill-color": "map-park" };
    if (source === "building") return {
      "fill-color": "map-building", "fill-outline-color": "map-building-border",
    };
    return { "fill-color": source === "landuse" ? "map-residential" : "map-land" };
  }
  if (layer.type === "line") {
    let token = "map-road-minor";
    if (source === "waterway") token = "map-water";
    else if (source === "boundary" || id.includes("casing")) token = "map-road-casing";
    else if (id.includes("railway")) token = "map-rail";
    else if (/major|motorway/.test(id)) token = "map-road-major";
    return { "line-color": token };
  }
  if (layer.type === "symbol") {
    // Raster shield sprites cannot be recolored through text paint. Keep their
    // dark numerals on the provider's light shield, including in Dark Mode.
    if (id.includes("shield")) return {};
    return {
      "text-color": source?.startsWith("water") ? "map-water-label" : "map-label",
      "text-halo-color": "map-label-halo",
    };
  }
  return {};
}

export function mapColor(token: string, styles = getComputedStyle(document.documentElement)) {
  return styles.getPropertyValue(`--${token}`).trim();
}

export function applyMapTheme(map: Map) {
  const styles = getComputedStyle(document.documentElement);
  for (const layer of map.getStyle()?.layers ?? []) {
    for (const [property, token] of Object.entries(mapPaintTokens(layer))) {
      map.setPaintProperty(layer.id, property as PaintProperty, mapColor(token, styles));
    }
  }
}
