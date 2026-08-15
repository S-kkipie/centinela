import { z } from "zod";
import type {
  ProviderContract,
  Sanction,
  Tender,
  TenderDetail,
} from "@centinela/contracts/croma";
import { parse } from "../parse.ts";

/** A SECOP process/notice row. Only the mapped fields are named; the rest ride in `raw`. */
const processSchema = z
  .object({
    notice_uid: z.string().nullish(),
    process_id: z.string().nullish(),
    entity_nit: z.string().nullish(),
    entity: z.string().nullish(),
    name: z.string().nullish(),
    base_price: z.number().nullish(),
    procedure_status: z.string().nullish(),
    published_date: z.string().nullish(),
    bid_deadline: z.string().nullish(),
  })
  .passthrough();

type Process = z.infer<typeof processSchema>;

function toTender(p: Process): Tender {
  return {
    // Draft processes can lack a notice UID; process_id is the stable fallback.
    noticeUid: p.notice_uid ?? p.process_id ?? "",
    entityNit: p.entity_nit ?? "",
    entityName: p.entity ?? "",
    title: p.name ?? "",
    valueCop: p.base_price ?? undefined,
    status: p.procedure_status ?? undefined,
    publishedAt: p.published_date ?? undefined,
    closesAt: p.bid_deadline ?? undefined,
    raw: p,
  };
}

const processesByEntitySchema = z
  .object({ processes: z.array(processSchema).default([]) })
  .passthrough();

/** `secop-processes-by-entity` → the tenders swept for a watched entity. */
export function mapTenders(data: unknown): Tender[] {
  const d = parse(processesByEntitySchema, data, "secop-processes-by-entity");
  return (d.processes ?? []).map(toTender);
}

const processDetailContractSchema = z
  .object({
    provider_document: z.string().nullish(),
    provider: z.string().nullish(),
  })
  .passthrough();

const processDetailSchema = z
  .object({
    found: z.boolean().nullish(),
    process: processSchema.nullish(),
    contracts: z.array(processDetailContractSchema).nullish(),
  })
  .passthrough();

/** `secop-process` → one notice with the providers derived from its contracts. */
export function mapTenderDetail(data: unknown): TenderDetail | null {
  const d = parse(processDetailSchema, data, "secop-process");
  if (d.found === false || !d.process) return null;

  const seen = new Set<string>();
  const providers: TenderDetail["providers"] = [];
  for (const c of d.contracts ?? []) {
    const nit = c.provider_document;
    if (!nit || seen.has(nit)) continue;
    seen.add(nit);
    providers.push({ nit, name: c.provider ?? undefined, awarded: true });
  }

  return { ...toTender(d.process), providers };
}

const contractSchema = z
  .object({
    contract_id: z.string(),
    entity_nit: z.string().nullish(),
    entity: z.string().nullish(),
    value: z.number().nullish(),
    sign_date: z.string().nullish(),
  })
  .passthrough();

const contractsByProviderSchema = z
  .object({ contracts: z.array(contractSchema).default([]) })
  .passthrough();

/**
 * `secop-contracts-by-provider` → a provider's contracts (concentration signal).
 */
export function mapProviderContracts(data: unknown): ProviderContract[] {
  const d = parse(contractsByProviderSchema, data, "secop-contracts-by-provider");
  return (d.contracts ?? []).map((c) => ({
    contractId: c.contract_id,
    entityNit: c.entity_nit ?? "",
    entityName: c.entity ?? undefined,
    valueCop: c.value ?? undefined,
    awardedAt: c.sign_date ?? undefined,
    raw: c,
  }));
}

const secopSanctionSchema = z
  .object({
    provider: z.string().nullish(),
    resolution_number: z.string().nullish(),
    contract_number: z.string().nullish(),
    published_date: z.string().nullish(),
  })
  .passthrough();

const secopSanctionsSchema = z
  .object({
    document_number: z.string().nullish(),
    sanctions: z.array(secopSanctionSchema).default([]),
  })
  .passthrough();

/** `secop-sanctions-by-provider` → fines against a provider. */
export function mapSecopSanctions(data: unknown): Sanction[] {
  const d = parse(secopSanctionsSchema, data, "secop-sanctions-by-provider");
  const subjectDocument = d.document_number ?? "";
  return (d.sanctions ?? []).map((s) => ({
    registry: "secop",
    subjectDocument,
    description:
      [s.resolution_number, s.provider, s.contract_number].filter(Boolean).join(" — ") || undefined,
    date: s.published_date ?? undefined,
    raw: s,
  }));
}
