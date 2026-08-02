import { z } from "zod";

/**
 * Frontend env validation.
 * Only VITE_* values are available in the client bundle — never put secrets here.
 */
const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url().optional().or(z.literal("")),
  VITE_SUPABASE_ANON_KEY: z.string().optional().or(z.literal("")),
  VITE_API_BASE_URL: z.string().url().default("http://localhost:8000"),
  VITE_SITE_URL: z.string().url().default("https://rigscout.co"),
  VITE_BASE_PATH: z.string().default("/"),
  MODE: z.string().default("development"),
  DEV: z.boolean().default(true),
  PROD: z.boolean().default(false),
});

export type ClientEnv = z.infer<typeof envSchema> & {
  supabaseConfigured: boolean;
};

function parseEnv(): ClientEnv {
  const raw = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ?? "",
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ?? "",
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000",
    VITE_SITE_URL: import.meta.env.VITE_SITE_URL ?? "https://rigscout.co",
    VITE_BASE_PATH: import.meta.env.VITE_BASE_PATH ?? "/",
    MODE: import.meta.env.MODE,
    DEV: import.meta.env.DEV,
    PROD: import.meta.env.PROD,
  };

  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid RigScout environment configuration. Check .env against .env.example.");
  }

  const data = parsed.data;
  const supabaseConfigured = Boolean(data.VITE_SUPABASE_URL && data.VITE_SUPABASE_ANON_KEY);

  if (!supabaseConfigured && data.DEV) {
    console.info(
      "[RigScout] Supabase is not configured. Auth and data features run in demo/offline mode until VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.",
    );
  }

  return { ...data, supabaseConfigured };
}

export const env = parseEnv();
