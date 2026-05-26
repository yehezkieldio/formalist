export interface RetrievalSource {
    componentScores?: Record<string, number>;
    documentId?: string | null;
    ownerId: string;
    ownerType: string;
    pageNumber?: number | null;
    score: number;
    snippet: string;
    title: string;
}
