import type {
  AdministrativeCoordinate,
  AdministrativeResolution,
  ResolverProvenance,
} from "./administrative-resolver";

/** A transport limit, not a geographic or dataset qualification rule. */
export const MAX_ADMINISTRATIVE_REQUEST_BYTES = 1024;

export type AdministrativeRequestBody = AdministrativeCoordinate;

/** Explicit conversion from map/GeoJSON order. Validation belongs to the receiver. */
export function administrativeRequestFromPosition(
  [longitude, latitude]: readonly [longitude: number, latitude: number],
): AdministrativeRequestBody {
  return { latitude, longitude };
}

/** Already collected bytes; a future HTTP wrapper must also bound stream reads. */
export type AdministrativeTransportRequest = {
  method: string;
  contentType: string | null;
  body: Uint8Array;
};

/** Public source description only; no activation, review references or audit pins. */
export type PublicAdministrativeDataset = Pick<ResolverProvenance,
  "id" | "version" | "publisher" | "sourceReference" | "official" | "knownLimitations" | "coverage"
> & { qualification: Pick<ResolverProvenance["qualification"], "status"> };

export type PublicAdministrativeSuccess =
  | (Omit<Extract<AdministrativeResolution, { status: "resolved" }>, "dataset"> & { dataset: PublicAdministrativeDataset })
  | (Omit<Extract<AdministrativeResolution, { status: "outside_coverage" }>, "dataset"> & { dataset: PublicAdministrativeDataset })
  | (Omit<Extract<AdministrativeResolution, { status: "ambiguous" }>, "dataset"> & { dataset: PublicAdministrativeDataset });

export type AdministrativeTransportResponse = {
  headers: { "Cache-Control": "no-store"; "Content-Type": "application/json; charset=utf-8" };
} & (
  | { status: 200; body: PublicAdministrativeSuccess }
  | { status: 400; body: Extract<AdministrativeResolution, { status: "invalid_input" }> }
  | { status: 503; body: Extract<AdministrativeResolution, { status: "unavailable" }> }
  | { status: 405; headers: { Allow: "POST" }; body: { error: "method_not_allowed" } }
  | { status: 415; body: { error: "unsupported_media_type" } }
  | { status: 413; body: { error: "request_too_large" } }
  | { status: 500; body: { error: "internal_error" } }
);
