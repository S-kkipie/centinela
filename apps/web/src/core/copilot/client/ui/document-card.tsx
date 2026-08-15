"use client";

import { CheckIcon, CopyIcon, DownloadIcon } from "lucide-react";
import { useState } from "react";
import type { CentinelaDocument } from "@/core/copilot/client/deliverables/documents";
import { ScrollArea } from "@/frontend/components/ui/scroll-area";

const KIND_LABEL: Record<CentinelaDocument["kind"], string> = {
    dossier: "Dossier de evidencia",
    denuncia: "Derecho de petición",
    propuesta: "Checklist de propuesta",
    hilo: "Hilo watchdog",
};

/** Triggers a client-side download; the document never leaves the browser. */
function download(doc: CentinelaDocument): void {
    const blob = new Blob([doc.markdown], {
        type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.filename;
    a.click();
    URL.revokeObjectURL(url);
}

/**
 * Generative-UI card for a generated document: the full text, plus the two
 * things the user actually wants to do with it. A copilot that only prints
 * prose into a chat leaves the work of getting it out to the user.
 */
export function DocumentCard({
    document: doc,
}: {
    document: CentinelaDocument;
}) {
    const [copied, setCopied] = useState(false);

    async function copy() {
        try {
            await navigator.clipboard.writeText(doc.markdown);
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
        } catch {
            // Clipboard blocked (insecure context / permission): the text is
            // right there to select by hand, so fail quietly.
        }
    }

    return (
        <article className="my-2 overflow-hidden rounded-md border border-rule bg-card">
            <header className="flex items-start justify-between gap-3 border-rule border-b bg-secondary/60 px-3.5 py-2.5">
                <div className="min-w-0">
                    <p className="label-ops text-signal">
                        {KIND_LABEL[doc.kind]}
                    </p>
                    <h4 className="mt-0.5 truncate font-display font-medium text-foreground text-sm">
                        {doc.title}
                    </h4>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                    <button
                        aria-label="Copiar el documento"
                        className="flex items-center gap-1 rounded-sm border border-rule px-2 py-1 text-muted-foreground transition-colors hover:text-foreground"
                        onClick={copy}
                        type="button"
                    >
                        {copied ? (
                            <CheckIcon className="size-3 text-signal" />
                        ) : (
                            <CopyIcon className="size-3" />
                        )}
                        <span className="label-ops">
                            {copied ? "Copiado" : "Copiar"}
                        </span>
                    </button>
                    <button
                        aria-label="Descargar el documento"
                        className="flex items-center gap-1 rounded-sm border border-rule px-2 py-1 text-muted-foreground transition-colors hover:text-foreground"
                        onClick={() => download(doc)}
                        type="button"
                    >
                        <DownloadIcon className="size-3" />
                        <span className="label-ops">.md</span>
                    </button>
                </div>
            </header>
            <ScrollArea className="max-h-64">
                <pre className="whitespace-pre-wrap px-3.5 py-3 font-mono text-[11px] text-muted-foreground leading-relaxed">
                    {doc.markdown}
                </pre>
            </ScrollArea>
        </article>
    );
}
