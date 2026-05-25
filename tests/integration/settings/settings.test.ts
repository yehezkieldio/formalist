import { describe, expect, it, vi } from "vitest";

import { defaultAppSettings, mergeAppSettings } from "#/server/settings/schema";

const authMock = {
    requireAdmin: vi.fn(),
};
const settingsMock = {
    getAppSettings: vi.fn(),
    setAppSettings: vi.fn(),
};
const healthMock = {
    getHealthReport: vi.fn(),
};
const auditMock = {
    writeAuditLog: vi.fn(),
};

vi.mock("#/server/auth/require-admin", () => authMock);
vi.mock("#/server/db/queries/settings", () => settingsMock);
vi.mock("#/server/deployment/health", () => healthMock);
vi.mock("#/server/db/queries/audit", () => auditMock);

describe("settings schema and API", () => {
    it("merges partial settings with safe defaults", () => {
        const settings = mergeAppSettings({
            retrieval: { topK: 12 },
            storage: { storeOriginalFiles: true },
        });

        expect(settings.retrieval.topK).toBe(12);
        expect(settings.retrieval.vectorWeight).toBe(
            defaultAppSettings.retrieval.vectorWeight
        );
        expect(settings.storage.storeOriginalFiles).toBe(true);
        expect(settings.models.chatModel).toBe(
            defaultAppSettings.models.chatModel
        );
    });

    it("redacts through GET and audits PATCH updates", async () => {
        authMock.requireAdmin.mockImplementation(async () => {});
        settingsMock.getAppSettings.mockResolvedValue(defaultAppSettings);
        settingsMock.setAppSettings.mockResolvedValue({
            ...defaultAppSettings,
            retrieval: { ...defaultAppSettings.retrieval, topK: 10 },
        });
        healthMock.getHealthReport.mockResolvedValue({
            database: { message: "ok", state: "ok" },
            fullText: { message: "ok", state: "ok" },
            openRouter: { message: "ok", state: "ok" },
            queue: { message: "ok", state: "ok" },
            storage: { message: "ok", state: "ok" },
            vector: { message: "ok", state: "ok" },
        });

        const route = await import("#/app/api/settings/route");
        const getResponse = await route.GET();

        expect(getResponse.status).toBe(200);
        expect(await getResponse.json()).toHaveProperty("settings");

        const patchResponse = await route.PATCH(
            new Request("http://localhost/api/settings", {
                body: JSON.stringify({
                    ...defaultAppSettings,
                    retrieval: { ...defaultAppSettings.retrieval, topK: 10 },
                }),
                headers: { "content-type": "application/json" },
                method: "PATCH",
            })
        );

        expect(patchResponse.status).toBe(200);
        expect(auditMock.writeAuditLog).toHaveBeenCalledWith(
            expect.objectContaining({ action: "settings.update" })
        );
    });
});
