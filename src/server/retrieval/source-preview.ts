import { getDocument } from "#/server/db/queries/documents";
import { getSourceEvidence } from "#/server/retrieval/source-evidence";

export type SourceEvidenceLookup = typeof getSourceEvidence;
export type SourceDocumentLookup = typeof getDocument;

export async function buildSourcePreview(
    sourceType: string,
    sourceId: string,
    lookups: {
        getDocument?: SourceDocumentLookup;
        getSourceEvidence?: SourceEvidenceLookup;
    } = {}
) {
    const evidenceLookup = lookups.getSourceEvidence ?? getSourceEvidence;
    const documentLookup = lookups.getDocument ?? getDocument;
    const evidence = await evidenceLookup(sourceType, sourceId);

    if (!evidence) {
        return null;
    }

    const document = await documentLookup(evidence.documentId);

    return {
        document,
        evidence,
    };
}
