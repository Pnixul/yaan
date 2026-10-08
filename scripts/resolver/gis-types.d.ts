// Offline resolver declarations; no GIS dependency is added to application runtime.
declare module "jsts/org/locationtech/jts/geom/Coordinate.js" {
  export default class Coordinate {
    constructor(x: number, y: number);
  }
}
declare module "jsts/org/locationtech/jts/geom/Location.js" {
  export default class Location {
    static INTERIOR: number;
    static BOUNDARY: number;
    static EXTERIOR: number;
  }
}
declare module "jsts/org/locationtech/jts/algorithm/locate/SimplePointInAreaLocator.js" {
  import Coordinate from "jsts/org/locationtech/jts/geom/Coordinate.js";
  import Geometry from "jsts/org/locationtech/jts/geom/Geometry.js";
  export default class SimplePointInAreaLocator {
    static locate(point: Coordinate, geometry: Geometry): number;
  }
}
declare module "jsts/org/locationtech/jts/operation/relate/RelateOp.js" {
  import Geometry from "jsts/org/locationtech/jts/geom/Geometry.js";
  export default class RelateOp {
    static covers(a: Geometry, b: Geometry): boolean;
  }
}
