import { configure, getConsoleSink } from "@logtape/logtape";

let configured = false;

/** Configure LogTape once (idempotent). Called from `instrumentation.ts`. */
export async function configureLogging() {
    if (configured) return;
    configured = true;
    await configure({
        sinks: { console: getConsoleSink() },
        loggers: [
            { category: ["server"], lowestLevel: "debug", sinks: ["console"] },
            {
                category: ["logtape", "meta"],
                lowestLevel: "warning",
                sinks: ["console"],
            },
        ],
    });
}
