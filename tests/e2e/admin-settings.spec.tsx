import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DeploymentStatusPanel } from "#/components/admin/deployment-status-panel";
import { defaultAppSettings } from "#/server/settings/schema";

describe("admin settings UI", () => {
    it("renders deployment provider status and missing key state", () => {
        const markup = renderToStaticMarkup(
            <DeploymentStatusPanel
                health={{
                    database: { message: "Database ok", state: "ok" },
                    fullText: { message: "FTS ok", state: "ok" },
                    openRouter: {
                        message: "OpenRouter key is missing",
                        state: "degraded",
                    },
                    queue: { message: "Queue ok", state: "ok" },
                    storage: { message: "Storage ok", state: "ok" },
                    vector: { message: "Vector ok", state: "ok" },
                }}
                settings={defaultAppSettings}
            />
        );

        expect(markup).toContain("docker-local");
        expect(markup).toContain("postgres");
        expect(markup).toContain("OpenRouter key is missing");
    });
});
