import { relations } from "drizzle-orm";

import {
    answerVerifications,
    auditLogs,
    chatMessages,
    chatSessions,
    chatSources,
    chatToolCalls,
    documentChunks,
    documentPages,
    documents,
    extractedFacts,
    extractionIssues,
    feeRules,
    ingestionJobs,
    tableChunks,
    tariffRows,
} from "#/server/db/schema";

export const documentsRelations = relations(documents, ({ many }) => ({
    auditLogs: many(auditLogs),
    chunks: many(documentChunks),
    extractionIssues: many(extractionIssues),
    facts: many(extractedFacts),
    feeRules: many(feeRules),
    ingestionJobs: many(ingestionJobs),
    pages: many(documentPages),
    tableChunks: many(tableChunks),
    tariffRows: many(tariffRows),
}));

export const documentPagesRelations = relations(documentPages, ({ one }) => ({
    document: one(documents, {
        fields: [documentPages.documentId],
        references: [documents.id],
    }),
}));

export const documentChunksRelations = relations(
    documentChunks,
    ({ many, one }) => ({
        document: one(documents, {
            fields: [documentChunks.documentId],
            references: [documents.id],
        }),
        facts: many(extractedFacts),
        feeRules: many(feeRules),
    })
);

export const tableChunksRelations = relations(tableChunks, ({ many, one }) => ({
    document: one(documents, {
        fields: [tableChunks.documentId],
        references: [documents.id],
    }),
    facts: many(extractedFacts),
    feeRules: many(feeRules),
    tariffRows: many(tariffRows),
}));

export const extractedFactsRelations = relations(extractedFacts, ({ one }) => ({
    document: one(documents, {
        fields: [extractedFacts.documentId],
        references: [documents.id],
    }),
    sourceChunk: one(documentChunks, {
        fields: [extractedFacts.sourceChunkId],
        references: [documentChunks.id],
    }),
    sourceTableChunk: one(tableChunks, {
        fields: [extractedFacts.sourceTableChunkId],
        references: [tableChunks.id],
    }),
}));

export const tariffRowsRelations = relations(tariffRows, ({ one }) => ({
    document: one(documents, {
        fields: [tariffRows.documentId],
        references: [documents.id],
    }),
    sourceTableChunk: one(tableChunks, {
        fields: [tariffRows.sourceTableChunkId],
        references: [tableChunks.id],
    }),
}));

export const feeRulesRelations = relations(feeRules, ({ one }) => ({
    document: one(documents, {
        fields: [feeRules.documentId],
        references: [documents.id],
    }),
    sourceChunk: one(documentChunks, {
        fields: [feeRules.sourceChunkId],
        references: [documentChunks.id],
    }),
    sourceTableChunk: one(tableChunks, {
        fields: [feeRules.sourceTableChunkId],
        references: [tableChunks.id],
    }),
}));

export const extractionIssuesRelations = relations(
    extractionIssues,
    ({ one }) => ({
        document: one(documents, {
            fields: [extractionIssues.documentId],
            references: [documents.id],
        }),
    })
);

export const ingestionJobsRelations = relations(ingestionJobs, ({ one }) => ({
    document: one(documents, {
        fields: [ingestionJobs.documentId],
        references: [documents.id],
    }),
}));

export const chatSessionsRelations = relations(chatSessions, ({ many }) => ({
    messages: many(chatMessages),
    sources: many(chatSources),
    toolCalls: many(chatToolCalls),
    verifications: many(answerVerifications),
}));

export const chatMessagesRelations = relations(
    chatMessages,
    ({ many, one }) => ({
        session: one(chatSessions, {
            fields: [chatMessages.sessionId],
            references: [chatSessions.id],
        }),
        sources: many(chatSources),
        toolCalls: many(chatToolCalls),
        verifications: many(answerVerifications),
    })
);

export const chatToolCallsRelations = relations(chatToolCalls, ({ one }) => ({
    message: one(chatMessages, {
        fields: [chatToolCalls.messageId],
        references: [chatMessages.id],
    }),
    session: one(chatSessions, {
        fields: [chatToolCalls.sessionId],
        references: [chatSessions.id],
    }),
}));

export const chatSourcesRelations = relations(chatSources, ({ one }) => ({
    message: one(chatMessages, {
        fields: [chatSources.messageId],
        references: [chatMessages.id],
    }),
    session: one(chatSessions, {
        fields: [chatSources.sessionId],
        references: [chatSessions.id],
    }),
}));

export const answerVerificationsRelations = relations(
    answerVerifications,
    ({ one }) => ({
        message: one(chatMessages, {
            fields: [answerVerifications.messageId],
            references: [chatMessages.id],
        }),
        session: one(chatSessions, {
            fields: [answerVerifications.sessionId],
            references: [chatSessions.id],
        }),
    })
);

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
    document: one(documents, {
        fields: [auditLogs.entityId],
        references: [documents.id],
    }),
}));
