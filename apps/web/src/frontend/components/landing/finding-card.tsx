import { CardSpotlight } from "@/frontend/components/aceternity/card-spotlight";
import { cn } from "@/frontend/lib/utils";

export interface EvidenceRow {
    fuente: string;
    estado: string;
}

export function FindingCard({
    kind,
    score,
    titulo,
    resumen,
    cadena,
    veredicto,
    tone,
}: {
    kind: string;
    score: number;
    titulo: string;
    resumen: string;
    cadena: readonly EvidenceRow[];
    veredicto: string;
    tone: "signal" | "flag";
}) {
    const isFlag = tone === "flag";
    return (
        <CardSpotlight
            className="p-7 shadow-[0_1px_2px_rgb(0_0_0/0.04),0_16px_48px_-20px_rgb(0_0_0/0.18)] sm:p-9"
            color={
                isFlag
                    ? "color-mix(in oklab, var(--color-flag) 8%, transparent)"
                    : undefined
            }
        >
            <div className="relative z-10">
                <div className="flex items-center justify-between gap-4">
                    <span
                        className={cn(
                            "label-ops inline-flex rounded-sm border px-2 py-1",
                            isFlag
                                ? "border-flag/40 bg-flag-soft text-flag"
                                : "border-signal/40 bg-signal-soft text-signal",
                        )}
                    >
                        {kind} · {score}
                    </span>
                    <span
                        className={cn(
                            "font-mono text-4xl leading-none font-semibold tabular-nums sm:text-5xl",
                            isFlag ? "text-flag" : "text-signal",
                        )}
                    >
                        {score}
                    </span>
                </div>
                <h3 className="mt-6 text-xl sm:text-2xl">{titulo}</h3>
                <p className="mt-3 max-w-[52ch] text-[15px] text-secondary-foreground">
                    {resumen}
                </p>
                <ul className="mt-6 border-t border-border font-mono text-[13px]">
                    {cadena.map((c) => (
                        <li
                            key={c.fuente}
                            className="grid grid-cols-1 gap-x-3 border-b border-border py-2 sm:grid-cols-[10rem_minmax(0,1fr)]"
                        >
                            <span className="font-semibold tracking-[0.05em]">
                                {c.fuente}
                            </span>
                            <span className="text-muted-foreground">
                                {c.estado}
                            </span>
                        </li>
                    ))}
                    <li className="grid grid-cols-1 gap-x-3 py-2 sm:grid-cols-[10rem_minmax(0,1fr)]">
                        <span className="font-semibold tracking-[0.05em]">
                            VEREDICTO
                        </span>
                        <span
                            className={cn(
                                "font-semibold",
                                isFlag ? "text-flag" : "text-signal",
                            )}
                        >
                            {veredicto}
                        </span>
                    </li>
                </ul>
            </div>
        </CardSpotlight>
    );
}
