import { copyFile, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

// MapLibre v6 ships a module worker with a sibling shared module. Serve both
// locally so Next's bundler does not break their relative import or need a CDN.
const require = createRequire(import.meta.url);
const source = dirname(require.resolve("maplibre-gl/package.json"));
const destination = new URL("../public/maplibre/", import.meta.url);
await mkdir(destination, { recursive: true });
for (const file of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) {
  await copyFile(join(source, "dist", file), new URL(file, destination));
}
await copyFile(
  join(source, "LICENSE.txt"),
  new URL("LICENSE.txt", destination),
);
