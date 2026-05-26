import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
    plugins: [react()],
    resolve: {
        tsconfigPaths: true,
    },
    test: {
        environment: "node",
        exclude: [
            "**/node_modules/**",
            "**/.next/**",
            "**/formalist-smoke.spec.ts",
            "**/tests/e2e/formalist-smoke.spec.ts",
        ],
        setupFiles: ["tests/setup.ts"],
    },
});
