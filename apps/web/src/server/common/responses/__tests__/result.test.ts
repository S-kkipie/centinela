import { describe, expect, it } from "vitest";
import { err, isErr, isOk, matchResult, ok } from "../result";

describe("Result", () => {
    it("ok() wraps data and narrows via isOk", () => {
        const r = ok(42);
        expect(isOk(r)).toBe(true);
        expect(isErr(r)).toBe(false);
        if (isOk(r)) expect(r.data).toBe(42);
    });

    it("err() wraps error and narrows via isErr", () => {
        const r = err("boom");
        expect(isErr(r)).toBe(true);
        if (isErr(r)) expect(r.error).toBe("boom");
    });

    it("matchResult dispatches on variant", () => {
        expect(matchResult(ok(2), { ok: (d) => d * 2, err: () => -1 })).toBe(4);
        expect(
            matchResult(err("x"), { ok: () => -1, err: (e) => e.length }),
        ).toBe(1);
    });
});
