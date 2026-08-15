import { z } from "zod";
import type { JudicialProcess } from "@centinela/contracts/croma";
import { parse } from "../parse.ts";

const caseSchema = z
  .object({
    id: z.number().nullish(),
    registration_number: z.string().nullish(),
    court: z.string().nullish(),
    parties_text: z.string().nullish(),
  })
  .passthrough();

const casesSchema = z.object({ cases: z.array(caseSchema).default([]) }).passthrough();

/** `rama-judicial-cases-by-entity` → judicial cases for a party name. */
export function mapJudicialProcesses(data: unknown): JudicialProcess[] {
  const d = parse(casesSchema, data, "rama-judicial-cases-by-entity");
  return (d.cases ?? []).map((c) => ({
    caseId: c.registration_number ?? (c.id != null ? String(c.id) : ""),
    court: c.court ?? undefined,
    parties: (c.parties_text ?? "")
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean),
    raw: c,
  }));
}
