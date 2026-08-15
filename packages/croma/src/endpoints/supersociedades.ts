import { z } from "zod";
import type { FinancialRecord } from "@centinela/contracts/croma";
import { parse } from "../parse.ts";

/** Supersociedades reports amounts in a stated unit; normalize everything to COP. */
function unitMultiplier(unit: string | null | undefined): number {
  const u = (unit ?? "").toUpperCase();
  if (u.includes("MILLONES")) return 1_000_000;
  if (u.includes("MILES")) return 1_000;
  return 1;
}

const statementSchema = z
  .object({
    year: z.number().nullish(),
    reporting_unit: z.string().nullish(),
    income_statement: z.object({ revenue: z.number().nullish() }).passthrough().nullish(),
    balance_sheet: z
      .object({ total_assets: z.number().nullish(), total_equity: z.number().nullish() })
      .passthrough()
      .nullish(),
  })
  .passthrough();

const financialsSchema = z
  .object({
    found: z.boolean().nullish(),
    document_number: z.string().nullish(),
    statements: z.array(statementSchema).nullish(),
  })
  .passthrough();

/** `supersociedades-financial-statements` → per-year statements, amounts in COP. */
export function mapFinancials(data: unknown): FinancialRecord[] {
  const d = parse(financialsSchema, data, "supersociedades-financial-statements");
  if (d.found === false || !d.statements) return [];

  const nit = d.document_number ?? "";
  return d.statements.map((s) => {
    const multiplier = unitMultiplier(s.reporting_unit);
    const toCop = (v: number | null | undefined): number | undefined =>
      v == null ? undefined : v * multiplier;
    return {
      nit,
      year: s.year ?? undefined,
      totalAssetsCop: toCop(s.balance_sheet?.total_assets),
      totalEquityCop: toCop(s.balance_sheet?.total_equity),
      operatingIncomeCop: toCop(s.income_statement?.revenue),
      raw: s,
    };
  });
}
