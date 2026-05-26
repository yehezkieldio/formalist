import { describe, expect, it } from "vitest";

import { createDocumentChunks } from "#/server/ingestion/chunkers/document-chunker";
import { createTableChunks } from "#/server/ingestion/chunkers/table-chunker";
import { assertNoBlockingIssueRecords } from "#/server/ingestion/review/bulk-actions";
import { validateTariffRows } from "#/server/ingestion/validators/tariff-rows";

import { createSyntheticParserResult } from "../../helpers/document-fixtures";
import { tariffRowFixture } from "../../unit/tariff/fixtures";

describe("upload and review flow", () => {
    it("chunks a fixture, validates rows, and blocks approval while high issues remain", async () => {
        const documentId = "00000000-0000-0000-0000-000000000101";
        const parseResult = createSyntheticParserResult(documentId);
        const documentChunks = await createDocumentChunks(
            documentId,
            parseResult
        );
        const tableChunks = createTableChunks(documentId, parseResult);

        expect(documentChunks.length).toBeGreaterThan(0);
        expect(tableChunks).toHaveLength(2);
        expect(["extracted", "needs_review"]).toContain(tableChunks[0]?.status);

        const issues = validateTariffRows(documentId, [
            tariffRowFixture({
                airline: "Pelita",
                destinationCity: "Surabaya",
                destinationCode: "SUB",
                id: "row-1",
                priceStatus: "NUMERIC",
                smuPricePerKg: 18_000,
                status: "extracted",
            }),
            tariffRowFixture({
                airline: "Pelita",
                destinationCity: null,
                destinationCode: "UPG",
                id: "row-2",
                priceStatus: "MISSING",
                smuPricePerKg: null,
                status: "needs_review",
            }),
        ]);

        expect(issues.some((issue) => issue.severity === "high")).toBe(true);
        expect(() =>
            assertNoBlockingIssueRecords(
                [
                    {
                        severity: "high",
                        sourceId: "row-2",
                        sourceType: "tariff_row",
                        status: "open",
                    },
                ],
                { sourceIds: ["row-2"], sourceType: "tariff_row" }
            )
        ).toThrow("unresolved high severity issues");
    });
});
