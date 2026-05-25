import { createEnv } from "@t3-oss/env-nextjs";
import * as z from "zod";

const booleanString = z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true");

const optionalUrl = z
    .string()
    .url()
    .optional()
    .or(z.literal("").transform(() => void 0));

const optionalSecret = z
    .string()
    .min(1)
    .optional()
    .or(z.literal("").transform(() => void 0));

export const env = createEnv({
    client: {},
    runtimeEnv: {
        ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
        CHAT_MODEL: process.env.CHAT_MODEL,
        DATABASE_PROVIDER: process.env.DATABASE_PROVIDER,
        DATABASE_URL: process.env.DATABASE_URL,
        DEPLOYMENT_MODE: process.env.DEPLOYMENT_MODE,
        EMBEDDING_MODEL: process.env.EMBEDDING_MODEL,
        MAX_UPLOAD_MB: process.env.MAX_UPLOAD_MB,
        NODE_ENV: process.env.NODE_ENV,
        OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
        OPENROUTER_APP_NAME: process.env.OPENROUTER_APP_NAME,
        OPENROUTER_SITE_URL: process.env.OPENROUTER_SITE_URL,
        QUEUE_PROVIDER: process.env.QUEUE_PROVIDER,
        REDIS_URL: process.env.REDIS_URL,
        SESSION_SECRET: process.env.SESSION_SECRET,
        STORE_DEBUG_ARTIFACTS: process.env.STORE_DEBUG_ARTIFACTS,
        STORE_ORIGINAL_FILES: process.env.STORE_ORIGINAL_FILES,
        STORE_PAGE_IMAGES: process.env.STORE_PAGE_IMAGES,
        SUPABASE_DATABASE_URL: process.env.SUPABASE_DATABASE_URL,
        UPLOAD_ROOT: process.env.UPLOAD_ROOT,
        UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
        UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    },
    server: {
        ADMIN_PASSWORD: optionalSecret,
        CHAT_MODEL: z.string().min(1).default("deepseek/deepseek-v4-flash"),
        DATABASE_PROVIDER: z.enum(["postgres", "supabase"]).default("postgres"),
        DATABASE_URL: optionalUrl,
        DEPLOYMENT_MODE: z
            .enum(["docker-local", "managed-fallback"])
            .default("docker-local"),
        EMBEDDING_MODEL: z.string().min(1).default("qwen/qwen3-embedding-8b"),
        MAX_UPLOAD_MB: z.coerce.number().int().positive().default(50),
        NODE_ENV: z
            .enum(["development", "test", "production"])
            .default("development"),
        OPENROUTER_API_KEY: optionalSecret,
        OPENROUTER_APP_NAME: z.string().min(1).default("Formalist"),
        OPENROUTER_SITE_URL: optionalUrl,
        QUEUE_PROVIDER: z
            .enum(["local-redis", "upstash-redis", "db-fallback"])
            .default("db-fallback"),
        REDIS_URL: optionalUrl,
        SESSION_SECRET: optionalSecret,
        STORE_DEBUG_ARTIFACTS: booleanString,
        STORE_ORIGINAL_FILES: booleanString,
        STORE_PAGE_IMAGES: booleanString,
        SUPABASE_DATABASE_URL: optionalUrl,
        UPLOAD_ROOT: z.string().min(1).default("/data/uploads"),
        UPSTASH_REDIS_REST_TOKEN: optionalSecret,
        UPSTASH_REDIS_REST_URL: optionalUrl,
    },
});
