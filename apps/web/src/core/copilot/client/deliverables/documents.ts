/**
 * Documents the copilot hands the user.
 *
 * A copilot that only answers questions leaves the user with the same blank
 * page they arrived with. These builders turn a finding plus its evidence chain
 * into something that leaves the app: a citable dossier, a petition draft, a
 * bid checklist, a watchdog thread.
 *
 * Pure by design — no clock, no DOM, no model. Everything they assert comes
 * from the finding the agent already grounded, so a generated document can be
 * checked line by line against the sources. `generatedAt` is injected so the
 * output is reproducible in tests.
 */

import type { ConcentrationReport } from "@/core/copilot/client/analysis/concentration";
import { describeConcentration } from "@/core/copilot/client/analysis/concentration";
import type { Finding } from "@/core/finding/domain/types";

export const DOCUMENT_KINDS = [
    "dossier",
    "denuncia",
    "propuesta",
    "hilo",
] as const;
export type DocumentKind = (typeof DOCUMENT_KINDS)[number];

export type CentinelaDocument = {
    kind: DocumentKind;
    /** Shown as the card header in the chat. */
    title: string;
    /** Safe filename for the download, extension included. */
    filename: string;
    markdown: string;
};

export type DocumentOptions = {
    /** ISO timestamp; injected so documents are reproducible. */
    generatedAt: string;
    /** Award-concentration context, when the network has enough to say. */
    concentration?: ConcentrationReport | null;
    /** Who signs the petition. Placeholder when the user has not said. */
    requesterName?: string | null;
};

/** `Contraloría General` -> `contraloria-general`. */
export function slugify(value: string): string {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60);
}

function stamp(iso: string): string {
    return `${iso.slice(0, 16).replace("T", " ")}Z`;
}

function evidenceList(finding: Finding): string {
    if (finding.evidence.length === 0)
        return "_El hallazgo no registró evidencia citada._";
    return finding.evidence
        .map((e, i) => {
            const cite = e.url ? `${e.claim} (${e.url})` : e.claim;
            return `${i + 1}. **${e.source}** — ${cite}`;
        })
        .join("\n");
}

function header(finding: Finding, opts: DocumentOptions): string {
    const kind =
        finding.kind === "BANDERA_ROJA" ? "BANDERA ROJA" : "OPORTUNIDAD";
    return [
        `- **Proceso:** ${finding.tenderId}`,
        `- **Entidad contratante:** ${finding.entityName} (NIT ${finding.entityId})`,
        `- **Veredicto del agente:** ${kind} · score ${finding.score}/100`,
        `- **Detectado:** ${stamp(finding.createdAt)}`,
        `- **Documento generado:** ${stamp(opts.generatedAt)}`,
    ].join("\n");
}

const PROVENANCE =
    "> Generado por Centinela a partir de fuentes públicas consultadas vía la API de Croma " +
    "(SECOP, RUES, Supersociedades, Rama Judicial, sanciones). Cada afirmación remite a la " +
    "fuente citada; verifica los enlaces antes de darle uso oficial.";

/** Full evidence dossier — the export a journalist or an auditor can cite. */
export function buildDossier(
    finding: Finding,
    opts: DocumentOptions,
): CentinelaDocument {
    const md = [
        `# Dossier · ${finding.title}`,
        "",
        header(finding, opts),
        "",
        "## Veredicto del agente",
        "",
        finding.summary,
        "",
        `## Cadena de evidencia (${finding.evidence.length})`,
        "",
        evidenceList(finding),
        ...(opts.concentration && opts.concentration.totalAwards > 0
            ? [
                  "",
                  "## Concentración de adjudicaciones",
                  "",
                  describeConcentration(opts.concentration),
              ]
            : []),
        "",
        "---",
        "",
        PROVENANCE,
        "",
    ].join("\n");

    return {
        kind: "dossier",
        title: `Dossier · ${finding.tenderId}`,
        filename: `dossier-${slugify(finding.tenderId)}.md`,
        markdown: md,
    };
}

/**
 * Draft of a derecho de petición (Ley 1755 de 2015) over a flagged process.
 * Left as a draft with explicit placeholders: it is addressed to a real entity
 * and signed by a real person, and neither is Centinela's to invent.
 */
export function buildDenuncia(
    finding: Finding,
    opts: DocumentOptions,
): CentinelaDocument {
    const requester = opts.requesterName?.trim() || "[NOMBRE DEL PETICIONARIO]";
    const md = [
        `# Derecho de petición · proceso ${finding.tenderId}`,
        "",
        `**Señores:** ${finding.entityName} (NIT ${finding.entityId})`,
        "**Copia:** Contraloría General de la República · Procuraduría General de la Nación",
        `**Referencia:** solicitud de información sobre el proceso ${finding.tenderId}`,
        `**Fecha:** ${stamp(opts.generatedAt)}`,
        "",
        `${requester}, identificado como aparece al pie de mi firma, en ejercicio del derecho de petición consagrado en el artículo 23 de la Constitución Política y reglamentado por la Ley 1755 de 2015, respetuosamente solicito la siguiente información sobre el proceso de la referencia.`,
        "",
        "## Hechos",
        "",
        finding.summary,
        "",
        "Los siguientes registros públicos sustentan la solicitud:",
        "",
        evidenceList(finding),
        ...(opts.concentration?.notable
            ? ["", describeConcentration(opts.concentration)]
            : []),
        "",
        "## Peticiones",
        "",
        `1. Copia íntegra del expediente contractual del proceso ${finding.tenderId}, incluidos estudios previos, pliegos definitivos y adendas.`,
        "2. Acta de evaluación de las propuestas recibidas y el informe de verificación de requisitos habilitantes de cada proponente.",
        "3. Relación de los contratos adjudicados por la entidad al adjudicatario de este proceso durante los últimos veinticuatro (24) meses, con cuantía y objeto.",
        "4. Justificación de la modalidad de selección empleada y, de ser contratación directa, el acto administrativo que la sustenta.",
        "5. Certificación sobre la verificación de inhabilidades e incompatibilidades del adjudicatario y de su representante legal.",
        "",
        "## Notificaciones",
        "",
        `Recibiré respuesta en: [CORREO ELECTRÓNICO] · [DIRECCIÓN FÍSICA]`,
        "",
        "Atentamente,",
        "",
        requester,
        "C.C. [NÚMERO DE DOCUMENTO]",
        "",
        "---",
        "",
        PROVENANCE,
        "",
        "> **Borrador.** Revísalo y complétalo antes de radicarlo. Centinela no radica documentos ni presta asesoría jurídica.",
        "",
    ].join("\n");

    return {
        kind: "denuncia",
        title: `Derecho de petición · ${finding.tenderId}`,
        filename: `peticion-${slugify(finding.tenderId)}.md`,
        markdown: md,
    };
}

/** Bid-readiness checklist for an OPORTUNIDAD. */
export function buildPropuesta(
    finding: Finding,
    opts: DocumentOptions,
): CentinelaDocument {
    const md = [
        `# Preparación de propuesta · ${finding.title}`,
        "",
        header(finding, opts),
        "",
        "## Por qué el agente lo marcó ganable",
        "",
        finding.summary,
        "",
        "## Lo que dicen las fuentes",
        "",
        evidenceList(finding),
        "",
        "## Requisitos habilitantes — verifica uno por uno",
        "",
        "- [ ] **Jurídico:** certificado de existencia y representación legal vigente (RUES), no mayor a 30 días.",
        "- [ ] **Jurídico:** RUP vigente y en firme, con las actividades del objeto contractual inscritas.",
        "- [ ] **Jurídico:** certificados de antecedentes fiscales, disciplinarios y judiciales del proponente y su representante legal.",
        "- [ ] **Financiero:** índices de liquidez, endeudamiento y razón de cobertura de intereses frente a lo exigido en el pliego.",
        "- [ ] **Financiero:** capacidad residual suficiente si el proceso es de obra.",
        "- [ ] **Técnico:** experiencia acreditada en contratos de objeto y cuantía similares, con certificaciones firmadas.",
        "- [ ] **Técnico:** personal mínimo con los perfiles y la dedicación que exige el pliego.",
        "- [ ] **Formal:** garantía de seriedad de la oferta por el porcentaje y la vigencia exigidos.",
        "- [ ] **Formal:** aportes a seguridad social y parafiscales al día (art. 50, Ley 789 de 2002).",
        "",
        "## Antes de presentarte",
        "",
        `- [ ] Lee el pliego definitivo y las adendas del proceso ${finding.tenderId} en el SECOP; este resumen no las reemplaza.`,
        "- [ ] Anota la fecha y hora exactas de cierre y programa la radicación con margen.",
        "- [ ] Presenta observaciones al pliego dentro del plazo si algún requisito parece dirigido.",
        "- [ ] Revisa quién ha ganado antes con esta entidad: mira la red de contratistas en Centinela.",
        "",
        "---",
        "",
        PROVENANCE,
        "",
    ].join("\n");

    return {
        kind: "propuesta",
        title: `Checklist de propuesta · ${finding.tenderId}`,
        filename: `propuesta-${slugify(finding.tenderId)}.md`,
        markdown: md,
    };
}

/** Max characters per post — the common short-form limit. */
const POST_LIMIT = 280;

/**
 * Watchdog thread for a red flag. Each post is numbered and stays under the
 * limit; the last one carries the sources so the thread is checkable.
 */
export function buildHilo(
    finding: Finding,
    opts: DocumentOptions,
): CentinelaDocument {
    const sourceNames = [
        ...new Set(finding.evidence.map((e) => e.source)),
    ].slice(0, 4);
    const links = finding.evidence
        .map((e) => e.url)
        .filter((u): u is string => Boolean(u))
        .slice(0, 3);

    const raw = [
        `🚩 ${finding.entityName} · proceso ${finding.tenderId}. Centinela lo marcó BANDERA ROJA con score ${finding.score}/100 cruzando fuentes públicas. Abro hilo. 🧵`,
        finding.summary,
        sourceNames.length > 0
            ? `Esto no sale de una opinión: sale de ${sourceNames.join(", ")}. Todo es información pública, consultable por cualquiera.`
            : "Todo lo anterior sale de registros públicos consultables por cualquiera.",
        ...(opts.concentration?.notable
            ? [describeConcentration(opts.concentration)]
            : []),
        links.length > 0
            ? `Fuentes: ${links.join(" · ")}`
            : `Fuente: consulta el proceso ${finding.tenderId} en el SECOP.`,
    ];

    const posts = raw.flatMap((text) => splitForThread(text.trim()));
    const numbered = posts.map((p, i) => `**${i + 1}/${posts.length}**\n${p}`);

    const md = [
        `# Hilo · ${finding.entityName}`,
        "",
        header(finding, opts),
        "",
        ...numbered.flatMap((p) => [p, ""]),
        "---",
        "",
        PROVENANCE,
        "",
        "> **Borrador.** Verifica los enlaces antes de publicar: lo que publiques lo respondes tú.",
        "",
    ].join("\n");

    return {
        kind: "hilo",
        title: `Hilo · ${finding.tenderId}`,
        filename: `hilo-${slugify(finding.tenderId)}.md`,
        markdown: md,
    };
}

/** Splits on word boundaries so no post is truncated mid-word. */
export function splitForThread(text: string, limit = POST_LIMIT): string[] {
    if (text.length <= limit) return [text];
    const words = text.split(/\s+/);
    const posts: string[] = [];
    let current = "";
    for (const word of words) {
        // A single word longer than the limit would loop forever; let it stand
        // alone and overflow rather than mangle a URL.
        if (current.length === 0) {
            current = word;
            continue;
        }
        if (current.length + 1 + word.length <= limit) {
            current += ` ${word}`;
        } else {
            posts.push(current);
            current = word;
        }
    }
    if (current.length > 0) posts.push(current);
    return posts;
}

/** Picks the builder for a kind. */
export function buildDocument(
    kind: DocumentKind,
    finding: Finding,
    opts: DocumentOptions,
): CentinelaDocument {
    switch (kind) {
        case "denuncia":
            return buildDenuncia(finding, opts);
        case "propuesta":
            return buildPropuesta(finding, opts);
        case "hilo":
            return buildHilo(finding, opts);
        default:
            return buildDossier(finding, opts);
    }
}
