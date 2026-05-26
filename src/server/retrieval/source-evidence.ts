import { eq } from "drizzle-orm";

import { getDatabase } from "#/server/db";
import {
    documentChunks,
    documentPages,
    documents,
    extractedFacts,
    feeRules,
    tableChunks,
    tariffRows,
} from "#/server/db/schema";

export async function getSourceEvidence(sourceType: string, sourceId: string) {
    if (sourceType === "tariff_row") {
        const [row] = await getDatabase()
            .select()
            .from(tariffRows)
            .where(eq(tariffRows.id, sourceId));

        return row
            ? {
                  documentId: row.documentId,
                  effectiveDate: row.effectiveDate,
                  routeType: row.routeType,
                  snippet: row.rawRowText ?? row.sourceText,
                  source: row,
                  sourceType,
                  validFrom: row.validFrom,
                  validUntil: row.validUntil,
              }
            : null;
    }

    if (sourceType === "fee_rule") {
        const [rule] = await getDatabase()
            .select()
            .from(feeRules)
            .where(eq(feeRules.id, sourceId));

        return rule
            ? { documentId: rule.documentId, source: rule, sourceType }
            : null;
    }

    if (sourceType === "extracted_fact") {
        const [fact] = await getDatabase()
            .select()
            .from(extractedFacts)
            .where(eq(extractedFacts.id, sourceId));

        return fact
            ? {
                  documentId: fact.documentId,
                  effectiveDate: fact.effectiveDate,
                  snippet: fact.rawEvidence,
                  source: fact,
                  sourceType,
                  validFrom: fact.validFrom,
                  validUntil: fact.validUntil,
              }
            : null;
    }

    if (sourceType === "document_chunk") {
        const [chunk] = await getDatabase()
            .select()
            .from(documentChunks)
            .where(eq(documentChunks.id, sourceId));

        return chunk
            ? {
                  documentId: chunk.documentId,
                  pageNumber: chunk.pageNumber,
                  snippet: chunk.content,
                  source: chunk,
                  sourceType,
              }
            : null;
    }

    if (sourceType === "table_chunk") {
        const [chunk] = await getDatabase()
            .select()
            .from(tableChunks)
            .where(eq(tableChunks.id, sourceId));

        return chunk
            ? {
                  documentId: chunk.documentId,
                  pageNumber: chunk.pageNumber,
                  snippet: chunk.rowText,
                  source: chunk,
                  sourceType,
              }
            : null;
    }

    if (sourceType === "document") {
        const [document] = await getDatabase()
            .select()
            .from(documents)
            .where(eq(documents.id, sourceId));

        return document
            ? { documentId: document.id, source: document, sourceType }
            : null;
    }

    if (sourceType === "document_page") {
        const [page] = await getDatabase()
            .select()
            .from(documentPages)
            .where(eq(documentPages.id, sourceId));

        return page
            ? {
                  documentId: page.documentId,
                  pageNumber: page.pageNumber,
                  snippet: page.rawText,
                  source: page,
                  sourceType,
              }
            : null;
    }

    return null;
}
