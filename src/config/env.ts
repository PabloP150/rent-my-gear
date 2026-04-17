import { z } from "zod";

const serverEnvSchema = z.object({
  NANO_BANANA_API_KEY: z.string().min(1, "NANO_BANANA_API_KEY is required"),
  GCS_BUCKET_NAME: z.string().optional(),
  GCS_PROJECT_ID: z.string().optional(),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | null = null;

export function getEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`[env] Invalid environment configuration:\n${details}`);
  }
  cached = parsed.data;
  return cached;
}

export function isGcsConfigured(): boolean {
  const env = getEnv();
  return Boolean(env.GCS_BUCKET_NAME && env.GCS_PROJECT_ID);
}
