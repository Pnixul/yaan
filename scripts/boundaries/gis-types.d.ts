// Narrow declarations for JSTS ESM entry points used by import scripts only.
declare module "jsts/org/locationtech/jts/geom/Geometry.js" {
  export default interface Geometry {
    getArea(): number;
    getGeometryType(): string;
    getNumGeometries(): number;
    getGeometryN(index: number): Geometry;
    getNumInteriorRing(): number;
    getInteriorRingN(index: number): Geometry;
    getCoordinates(): { x: number; y: number }[];
    getEnvelopeInternal(): {
      intersects(other: ReturnType<Geometry["getEnvelopeInternal"]>): boolean;
      getMinX(): number; getMinY(): number; getMaxX(): number; getMaxY(): number;
    };
  }
}
declare module "jsts/org/locationtech/jts/io/GeoJSONReader.js" {
  export default class GeoJSONReader {
    read(geometry: unknown): import("jsts/org/locationtech/jts/geom/Geometry.js").default;
  }
}
declare module "jsts/org/locationtech/jts/operation/overlay/OverlayOp.js" {
  import Geometry from "jsts/org/locationtech/jts/geom/Geometry.js";
  export default class OverlayOp {
    static INTERSECTION: number;
    static UNION: number;
    static overlayOp(a: Geometry, b: Geometry, operation: number): Geometry;
  }
}
declare module "jsts/org/locationtech/jts/operation/valid/IsValidOp.js" {
  export default class IsValidOp {
    constructor(geometry: object);
    isValid(): boolean;
    getValidationError(): { toString(): string } | null;
  }
}
