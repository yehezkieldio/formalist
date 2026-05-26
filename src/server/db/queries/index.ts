import {
    createAlias,
    deleteAlias,
    findAliasesByType,
    listAliases,
} from "./aliases";
import { listAuditLogs, writeAuditLog } from "./audit";
import {
    attachChatSource,
    createAnswerVerification,
    createChatMessage,
    createChatSession,
    listChatSessions,
    updateChatToolCallState,
} from "./chat";
import {
    createDocument,
    getDocument,
    listDocuments,
    updateDocumentOriginalPath,
    updateDocumentStatus,
} from "./documents";
import {
    claimNextIngestionJob,
    enqueueIngestionJob,
    updateIngestionJobStatus,
} from "./ingestion-jobs";
import {
    searchActiveFacts,
    searchActiveTariffRows,
    updateFactReviewStatus,
    updateFeeRuleReviewStatus,
    updateTariffRowReviewStatus,
} from "./review";
import { getSetting, setSetting } from "./settings";

export const queryHelpers = {
    attachChatSource,
    claimNextIngestionJob,
    createAlias,
    createAnswerVerification,
    createChatMessage,
    createChatSession,
    createDocument,
    deleteAlias,
    enqueueIngestionJob,
    findAliasesByType,
    getDocument,
    getSetting,
    listAliases,
    listAuditLogs,
    listChatSessions,
    listDocuments,
    searchActiveFacts,
    searchActiveTariffRows,
    setSetting,
    updateChatToolCallState,
    updateDocumentOriginalPath,
    updateDocumentStatus,
    updateFactReviewStatus,
    updateFeeRuleReviewStatus,
    updateIngestionJobStatus,
    updateTariffRowReviewStatus,
    writeAuditLog,
} as const;
