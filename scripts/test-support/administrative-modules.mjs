import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import * as inspection from "../boundaries/inspect.mjs";
import * as topology from "../boundaries/topology.mjs";

// Shared TS domain-test convention with the actual installed GIS modules.
const dependencies = {
  "../boundaries/inspect.mjs": inspection,
  "../boundaries/topology.mjs": topology,
};
for (const path of ["io/GeoJSONReader", "geom/Coordinate", "geom/Location", "algorithm/locate/SimplePointInAreaLocator", "operation/relate/RelateOp"]) {
  const name = `jsts/org/locationtech/jts/${path}.js`;
  dependencies[name] = await import(name);
}
export function loadAdministrativeModule(path, overrides = {}) {
  const url = new URL(path, new URL("../", import.meta.url));
  const { outputText } = ts.transpileModule(readFileSync(url, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: false },
  });
  const exports = {};
  runInNewContext(outputText, { exports, structuredClone, TextDecoder, require: (name) =>
    overrides[name] ?? dependencies[name] ?? loadAdministrativeModule(new URL(`${name}.ts`, url).href, overrides) });
  return exports;
}
