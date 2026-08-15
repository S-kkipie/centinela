import { z } from "zod";
import type { CompanyRecord } from "@centinela/contracts/croma";
import { parse } from "../parse.ts";

const relatedPartySchema = z
  .object({
    document_number: z.string().nullish(),
    name: z.string().nullish(),
    role: z.string().nullish(),
  })
  .passthrough();

const entitySchema = z
  .object({
    nit: z.string().nullish(),
    name: z.string().nullish(),
    registration_status: z.string().nullish(),
    registration_date: z.string().nullish(),
    incorporation_date: z.string().nullish(),
  })
  .passthrough();

const ruesSchema = z
  .object({
    found: z.boolean().nullish(),
    document_number: z.string().nullish(),
    entity: entitySchema.nullish(),
    related_parties: z.array(relatedPartySchema).nullish(),
  })
  .passthrough();

/** `rues-entity-by-nit` → company registry record with its legal representatives. */
export function mapCompanyRecord(data: unknown): CompanyRecord | null {
  const d = parse(ruesSchema, data, "rues-entity-by-nit");
  if (d.found === false || !d.entity) return null;

  const legalRepresentatives = (d.related_parties ?? [])
    .filter((p) => (p.role ?? "").includes("Representante Legal") && p.document_number && p.name)
    .map((p) => ({ document: p.document_number ?? "", name: p.name ?? "" }));

  return {
    nit: d.entity.nit ?? d.document_number ?? "",
    name: d.entity.name ?? undefined,
    status: d.entity.registration_status ?? undefined,
    incorporationDate: d.entity.registration_date ?? d.entity.incorporation_date ?? undefined,
    legalRepresentatives,
    raw: d,
  };
}
