// Narrow declarations for the two JSTS ESM entry points used by import scripts.
declare module "jsts/org/locationtech/jts/io/GeoJSONReader.js" {
  export default class GeoJSONReader {
    read(geometry: unknown): object;
  }
}
declare module "jsts/org/locationtech/jts/operation/valid/IsValidOp.js" {
  export default class IsValidOp {
    constructor(geometry: object);
    isValid(): boolean;
    getValidationError(): { toString(): string } | null;
  }
}
