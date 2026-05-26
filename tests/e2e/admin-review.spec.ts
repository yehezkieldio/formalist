import { describe, expect, it, vi } from "vitest";

const authMock = {
    requireAdmin: vi.fn(() => Promise.resolve()),
};

const reviewQueryMock = {
    listFeeRulesForReview: vi.fn(() => Promise.resolve([])),
    listTariffRowsForReview: vi.fn(() => Promise.resolve([])),
    updateExtractedFact: vi.fn((id, input) =>
        Promise.resolve({ ...input, id })
    ),
    updateFeeRule: vi.fn((id, input) => Promise.resolve({ ...input, id })),
    updateTariffRow: vi.fn((id, input) => Promise.resolve({ ...input, id })),
};

const auditMock = {
    writeReviewAuditLog: vi.fn(() => Promise.resolve({ id: "audit-1" })),
};

vi.mock("#/server/auth/require-admin", () => authMock);
vi.mock("#/server/db/queries/review", () => reviewQueryMock);
vi.mock("#/server/audit/audit-log", () => auditMock);

describe("admin review API", () => {
    it("updates tariff rows, fee rules, and facts with audit logging", async () => {
        const tariffRoute =
            await import("#/app/api/review/tariff-rows/[rowId]/route");
        const feeRoute =
            await import("#/app/api/review/fee-rules/[ruleId]/route");
        const factRoute = await import("#/app/api/facts/[factId]/route");

        await tariffRoute.PUT(
            new Request("http://localhost/api/review/tariff-rows/row-1", {
                body: JSON.stringify({ status: "rejected" }),
                headers: { "content-type": "application/json" },
                method: "PUT",
            }),
            { params: Promise.resolve({ rowId: "row-1" }) }
        );
        await feeRoute.PUT(
            new Request("http://localhost/api/review/fee-rules/fee-1", {
                body: JSON.stringify({ status: "rejected" }),
                headers: { "content-type": "application/json" },
                method: "PUT",
            }),
            { params: Promise.resolve({ ruleId: "fee-1" }) }
        );
        await factRoute.PUT(
            new Request("http://localhost/api/facts/fact-1", {
                body: JSON.stringify({ status: "archived" }),
                headers: { "content-type": "application/json" },
                method: "PUT",
            }),
            { params: Promise.resolve({ factId: "fact-1" }) }
        );

        expect(reviewQueryMock.updateTariffRow).toHaveBeenCalledWith("row-1", {
            status: "rejected",
        });
        expect(reviewQueryMock.updateFeeRule).toHaveBeenCalledWith("fee-1", {
            status: "rejected",
        });
        expect(reviewQueryMock.updateExtractedFact).toHaveBeenCalledWith(
            "fact-1",
            { status: "archived" }
        );
        expect(auditMock.writeReviewAuditLog).toHaveBeenCalledTimes(3);
    });
});
