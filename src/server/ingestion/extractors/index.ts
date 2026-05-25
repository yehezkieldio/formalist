import type { ParserResult } from "#/server/ingestion/parsers/types";

import { extractDocumentMetadata } from "./document-metadata";
import { extractFacts } from "./facts";
import { extractFeeRules } from "./fee-rules";
import type { ExtractionSourceContext } from "./prompt";
import type { StructuredExtraction } from "./schemas";
import { extractTariffRows } from "./tariff-rows";

export async function extractStructuredRecords(
    parseResult: ParserResult,
    context?: ExtractionSourceContext
): Promise<StructuredExtraction> {
    const [documentMetadata, facts, tariffRows, feeRules] = await Promise.all([
        extractDocumentMetadata(parseResult, context),
        extractFacts(parseResult, context),
        extractTariffRows(parseResult, context),
        extractFeeRules(parseResult, context),
    ]);

    return {
        documentMetadata,
        facts,
        feeRules,
        tariffRows,
    };
}
