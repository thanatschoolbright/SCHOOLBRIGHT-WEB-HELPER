import { ZodSchema } from "zod";

export type ValidationError = {
  status: number;
  message: string;
  validationErrors?: unknown;
};

/**
 * Generic parameter validator using Zod schemas.
 * Throws an object with { status, message, validationErrors } on failure so
 * callers can use the same error handling pattern as the project.
 */
export function validateParams<T = any>(schema: ZodSchema<any>, body: unknown): T {
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    throw {
      status: 400,
      message: "Invalid request",
      validationErrors: parsed.error.format(),
    } as ValidationError;
  }

  return parsed.data as unknown as T;
}
