import { createEnv } from "@t3-oss/env-nextjs";
import * as z from "zod";

// REMINDER
// Do not use the env object directly in this file, as it will cause issues with Next.js interpreting as using server env in client code.
// Instead, only export the validated env object and use it in other files, so that Next.js can properly tree-shake and remove server code from client bundles.

export const env = createEnv({
    client: {},
    runtimeEnv: {
        NODE_ENV: process.env.NODE_ENV,
    },
    server: {
        NODE_ENV: z
            .enum(["development", "test", "production"])
            .default("development"),
    },
});
