import { describe, expect, it } from "vitest";
import {
  CromaAuthError,
  CromaError,
  CromaNotFoundError,
  CromaRateLimitError,
  CromaValidationError,
  errorFromResponse,
} from "../src/errors.ts";

describe("CromaError hierarchy", () => {
  it("CromaError carries status, code and endpoint", () => {
    const err = new CromaError("boom", {
      status: 500,
      code: "server_error",
      endpoint: "/co/secop/process/v1",
    });
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("CromaError");
    expect(err.status).toBe(500);
    expect(err.code).toBe("server_error");
    expect(err.endpoint).toBe("/co/secop/process/v1");
  });

  it("subclasses are instanceof CromaError", () => {
    for (const err of [
      new CromaAuthError("no", { status: 401, endpoint: "/x" }),
      new CromaRateLimitError("slow", { status: 429, endpoint: "/x", retryAfterMs: 1000 }),
      new CromaNotFoundError("gone", { status: 404, endpoint: "/x" }),
      new CromaValidationError("bad shape", { endpoint: "/x", issues: ["a"] }),
    ]) {
      expect(err).toBeInstanceOf(CromaError);
    }
  });

  it("CromaRateLimitError exposes retryAfterMs", () => {
    const err = new CromaRateLimitError("slow", {
      status: 429,
      endpoint: "/x",
      retryAfterMs: 2500,
    });
    expect(err.retryAfterMs).toBe(2500);
  });

  it("CromaValidationError exposes issues", () => {
    const err = new CromaValidationError("bad", { endpoint: "/x", issues: ["a", "b"] });
    expect(err.issues).toEqual(["a", "b"]);
    expect(err.status).toBeUndefined();
  });
});

describe("errorFromResponse", () => {
  const base = { endpoint: "/co/secop/process/v1" };

  it("maps 401 to CromaAuthError", () => {
    const err = errorFromResponse(401, { error: { code: "unauthorized", message: "bad key" } }, base);
    expect(err).toBeInstanceOf(CromaAuthError);
    expect(err.status).toBe(401);
    expect(err.code).toBe("unauthorized");
  });

  it("maps 403 to CromaAuthError", () => {
    expect(errorFromResponse(403, {}, base)).toBeInstanceOf(CromaAuthError);
  });

  it("maps 429 to CromaRateLimitError with retryAfterMs from seconds", () => {
    const err = errorFromResponse(429, { error: { message: "slow down" } }, {
      ...base,
      retryAfterSeconds: 30,
    });
    expect(err).toBeInstanceOf(CromaRateLimitError);
    expect((err as CromaRateLimitError).retryAfterMs).toBe(30_000);
  });

  it("maps 404 to CromaNotFoundError", () => {
    expect(errorFromResponse(404, { error: { code: "not_found" } }, base)).toBeInstanceOf(
      CromaNotFoundError,
    );
  });

  it("maps other statuses to base CromaError with envelope message", () => {
    const err = errorFromResponse(500, { error: { code: "server_error", message: "kaboom" } }, base);
    expect(err.constructor).toBe(CromaError);
    expect(err.message).toContain("kaboom");
    expect(err.code).toBe("server_error");
  });
});
