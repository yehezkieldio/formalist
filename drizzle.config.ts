import { defineConfig } from "drizzle-kit";

const databaseUrl =
    process.env.SUPABASE_DATABASE_URL ?? process.env.DATABASE_URL;

export default defineConfig({
    dbCredentials: {
        url: databaseUrl ?? "",
    },
    dialect: "postgresql",
    out: "./drizzle/migrations",
    schema: "./src/server/db/schema.ts",
    strict: true,
    verbose: true,
});
