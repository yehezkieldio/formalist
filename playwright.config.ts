import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT ?? 3100);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;

export default defineConfig({
    expect: {
        timeout: 5000,
    },
    forbidOnly: Boolean(process.env.CI),
    fullyParallel: true,
    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
    ],
    retries: process.env.CI ? 2 : 0,
    testDir: "tests/e2e",
    testMatch: "formalist-smoke.playwright.ts",
    use: {
        baseURL,
        trace: "on-first-retry",
    },
    webServer: {
        command: `ADMIN_PASSWORD=admin-pass SESSION_SECRET=session-secret-with-enough-entropy OPENROUTER_API_KEY= QUEUE_PROVIDER=db-fallback bun run dev --hostname 127.0.0.1 --port ${port}`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        url: baseURL,
    },
});
