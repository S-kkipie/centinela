import type { ZodType } from "zod";
import { CromaValidationError } from "./errors.ts";

/**
 * Parse a Croma `data` payload against a schema, raising a typed
 * `CromaValidationError` (never a bare Zod error) when the live shape drifts.
 * Schemas are deliberately permissive (`.passthrough()`, most fields nullish) so
 * only the structure we actually map is enforced.
 */
export function parse<T>(schema: ZodType<T>, data: unknown, endpoint: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new CromaValidationError(`Unexpected response shape from ${endpoint}`, {
      endpoint,
      issues: result.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`),
    });
  }
  return result.data;
}
