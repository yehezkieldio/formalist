import * as z from "zod";

export const appSettingsSchema = z.object({
    deployment: z.object({
        databaseProvider: z.enum(["postgres", "supabase"]),
        deploymentMode: z.enum([
            "docker-local",
            "managed-fallback",
            "self-hosted",
        ]),
        queueProvider: z.enum(["db-fallback", "local-redis", "upstash-redis"]),
    }),
    models: z.object({
        chatModel: z.string().min(1),
        embeddingModel: z.string().min(1),
        maxToolSteps: z.number().int().positive().max(30),
        temperature: z.number().min(0).max(2),
    }),
    quote: z.object({
        defaultOriginAirport: z.string().optional(),
        defaultOriginCity: z.string().optional(),
        includePpnByDefault: z.boolean(),
    }),
    retrieval: z.object({
        ftsWeight: z.number().min(0).max(10),
        rerankerEnabled: z.boolean(),
        topK: z.number().int().positive().max(50),
        vectorWeight: z.number().min(0).max(10),
    }),
    storage: z.object({
        storeDebugArtifacts: z.boolean(),
        storeOriginalFiles: z.boolean(),
        storePageImages: z.boolean(),
    }),
    ui: z.object({
        showToolCallsByDefault: z.boolean(),
        theme: z.enum(["dark", "light", "system"]),
    }),
});

export type AppSettings = z.infer<typeof appSettingsSchema>;

export const defaultAppSettings = {
    deployment: {
        databaseProvider: "postgres",
        deploymentMode: "docker-local",
        queueProvider: "db-fallback",
    },
    models: {
        chatModel: "deepseek/deepseek-v4-flash",
        embeddingModel: "qwen/qwen3-embedding-8b",
        maxToolSteps: 8,
        temperature: 0.2,
    },
    quote: {
        defaultOriginAirport: "",
        defaultOriginCity: "",
        includePpnByDefault: true,
    },
    retrieval: {
        ftsWeight: 1,
        rerankerEnabled: false,
        topK: 8,
        vectorWeight: 1,
    },
    storage: {
        storeDebugArtifacts: false,
        storeOriginalFiles: false,
        storePageImages: false,
    },
    ui: {
        showToolCallsByDefault: true,
        theme: "system",
    },
} satisfies AppSettings;

export function mergeAppSettings(value: unknown): AppSettings {
    const partial = value && typeof value === "object" ? value : {};
    const parsedPartial = partial as Partial<AppSettings>;

    return appSettingsSchema.parse({
        ...defaultAppSettings,
        ...parsedPartial,
        deployment: {
            ...defaultAppSettings.deployment,
            ...parsedPartial.deployment,
        },
        models: {
            ...defaultAppSettings.models,
            ...parsedPartial.models,
        },
        quote: {
            ...defaultAppSettings.quote,
            ...parsedPartial.quote,
        },
        retrieval: {
            ...defaultAppSettings.retrieval,
            ...parsedPartial.retrieval,
        },
        storage: {
            ...defaultAppSettings.storage,
            ...parsedPartial.storage,
        },
        ui: {
            ...defaultAppSettings.ui,
            ...parsedPartial.ui,
        },
    });
}

export function redactSettingsSecrets(settings: AppSettings) {
    return settings;
}
