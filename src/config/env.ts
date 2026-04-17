import { z } from "zod";

const envSchema = z.object({
  // GCS is optional — only required when using storageService (Option A)
  GCS_BUCKET_NAME: z.string().min(1).optional(),
  GCS_PROJECT_ID: z.string().min(1).optional(),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().min(1).optional(),
  // Required for AI image generation
  NANO_BANANA_API_KEY: z.string().min(1, "NANO_BANANA_API_KEY is required"),
});

export type Env = z.infer<typeof envSchema>;

let _env: Env | null = null;

/**
 * Lazily validates and returns environment variables.
 * Throws a descriptive error on first call if any required variable is missing.
 */
export function getEnv(): Env {
  if (_env) return _env;

  const result = envSchema.safeParse({
    GCS_BUCKET_NAME: process.env.GCS_BUCKET_NAME,
    GCS_PROJECT_ID: process.env.GCS_PROJECT_ID,
    GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    NANO_BANANA_API_KEY: process.env.NANO_BANANA_API_KEY,
  });

  if (!result.success) {
    const missing = result.error.issues
      .map((e) => `  • ${String(e.path[0])}: ${e.message}`)
      .join("\n");
    throw new Error(
      `[Config] Missing or invalid environment variables:\n${missing}\n\nPlease check your .env.local file.`
    );
  }

  _env = result.data;
  return _env;
}

/** Reset cached env — used in tests only */
export function resetEnv(): void {
  _env = null;
}
