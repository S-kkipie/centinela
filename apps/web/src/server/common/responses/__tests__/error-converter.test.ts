import { describe, expect, it } from "vitest";
import { AppErrors } from "../app-error";
import { errorToResponse } from "../error-converter";

describe("errorToResponse", () => {
    it("maps a 404 to the wire shape with targets, no cause leak", () => {
        const wire = errorToResponse(AppErrors.notFound({ targets: ["id"] }));
        expect(wire).toEqual({
            code: "NOT_FOUND",
            status: 404,
            targets: ["id"],
        });
    });

    it("maps a 500 without exposing the cause on the wire", () => {
        const wire = errorToResponse(
            AppErrors.unexpected(new Error("db down")),
        );
        expect(wire.code).toBe("INTERNAL_SERVER_ERROR");
        expect(wire.status).toBe(500);
        expect("cause" in wire).toBe(false);
    });
});
