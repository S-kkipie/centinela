import { z } from "zod";
import type { Sanction } from "@centinela/contracts/croma";
import { parse } from "../parse.ts";

const procuraduriaSchema = z
  .object({
    document_number: z.string().nullish(),
    has_records: z.boolean().nullish(),
    records: z
      .array(
        z
          .object({
            type: z.string().nullish(),
            description: z.string().nullish(),
            date: z.string().nullish(),
          })
          .passthrough(),
      )
      .nullish(),
  })
  .passthrough();

/** `procuraduria-disciplinary-records` → disciplinary sanctions for a document. */
export function mapProcuraduriaSanctions(data: unknown): Sanction[] {
  const d = parse(procuraduriaSchema, data, "procuraduria-disciplinary-records");
  if (!d.has_records || !d.records) return [];
  const subjectDocument = d.document_number ?? "";
  return d.records.map((r) => ({
    registry: "procuraduria",
    subjectDocument,
    description: r.description ?? r.type ?? undefined,
    date: r.date ?? undefined,
    raw: r,
  }));
}

const contraloriaSchema = z
  .object({
    document_number: z.string().nullish(),
    is_fiscal_responsible: z.boolean().nullish(),
    status: z.string().nullish(),
    certified_at: z.string().nullish(),
  })
  .passthrough();

/** `contraloria-fiscal-records` → fiscal responsibility (a single verdict). */
export function mapContraloriaSanctions(data: unknown): Sanction[] {
  const d = parse(contraloriaSchema, data, "contraloria-fiscal-records");
  if (!d.is_fiscal_responsible) return [];
  return [
    {
      registry: "contraloria",
      subjectDocument: d.document_number ?? "",
      description: d.status ?? undefined,
      date: d.certified_at ?? undefined,
      raw: d,
    },
  ];
}
