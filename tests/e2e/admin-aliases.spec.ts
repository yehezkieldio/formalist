import { describe, expect, it, vi } from "vitest";

const authMock = {
    requireAdmin: vi.fn(() => Promise.resolve()),
};

const aliasQueryMock = {
    createAlias: vi.fn((input) => Promise.resolve({ ...input, id: "alias-1" })),
    deleteAlias: vi.fn(() =>
        Promise.resolve({
            alias: "sub",
            canonicalValue: "SUB",
            id: "alias-1",
            isAmbiguous: false,
            type: "airport",
        })
    ),
    findAliasByTypeAndAlias: vi.fn(() => Promise.resolve([])),
    findAliasesByType: vi.fn(() => Promise.resolve([])),
    listAliases: vi.fn(() =>
        Promise.resolve([
            {
                alias: "sub",
                canonicalValue: "SUB",
                id: "alias-1",
                isAmbiguous: false,
                type: "airport",
            },
        ])
    ),
    updateAlias: vi.fn((aliasId, input) =>
        Promise.resolve({ ...input, id: aliasId })
    ),
};

const auditMock = {
    writeAuditLog: vi.fn(() => Promise.resolve({ id: "audit-1" })),
};

vi.mock("#/server/auth/require-admin", () => authMock);
vi.mock("#/server/db/queries/aliases", () => aliasQueryMock);
vi.mock("#/server/db/queries/audit", () => auditMock);

describe("admin aliases API", () => {
    it("lists and creates aliases without seed tariff rows", async () => {
        const route = await import("#/app/api/aliases/route");

        const listResponse = await route.GET();
        const listBody = await listResponse.json();

        expect(listBody.aliases).toEqual([
            expect.objectContaining({ alias: "sub" }),
        ]);

        const createResponse = await route.POST(
            new Request("http://localhost/api/aliases", {
                body: JSON.stringify({
                    alias: "jogja",
                    canonicalValue: "Yogyakarta",
                    isAmbiguous: true,
                    type: "city",
                }),
                headers: { "content-type": "application/json" },
                method: "POST",
            })
        );

        expect(createResponse.status).toBe(201);
        expect(aliasQueryMock.createAlias).toHaveBeenCalledWith(
            expect.objectContaining({
                alias: "jogja",
                canonicalValue: "Yogyakarta",
            })
        );
    });

    it("updates and deletes aliases through dynamic route params", async () => {
        const route = await import("#/app/api/aliases/[aliasId]/route");

        const updateResponse = await route.PUT(
            new Request("http://localhost/api/aliases/alias-1", {
                body: JSON.stringify({
                    alias: "sub",
                    canonicalValue: "SUB",
                    isAmbiguous: false,
                    type: "airport",
                }),
                headers: { "content-type": "application/json" },
                method: "PUT",
            }),
            { params: Promise.resolve({ aliasId: "alias-1" }) }
        );
        const deleteResponse = await route.DELETE(
            new Request("http://localhost/api/aliases/alias-1", {
                method: "DELETE",
            }),
            { params: Promise.resolve({ aliasId: "alias-1" }) }
        );

        expect(updateResponse.status).toBe(200);
        expect(deleteResponse.status).toBe(200);
        expect(aliasQueryMock.updateAlias).toHaveBeenCalled();
        expect(aliasQueryMock.deleteAlias).toHaveBeenCalledWith("alias-1");
    });
});
