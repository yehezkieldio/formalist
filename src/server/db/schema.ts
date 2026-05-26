import { sql } from "drizzle-orm";
import {
    boolean,
    date,
    index,
    integer,
    jsonb,
    numeric,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
    uuid,
    vector,
} from "drizzle-orm/pg-core";

const embeddingDimensions = 4096;

export const documentStatuses = [
    "uploaded",
    "parsing",
    "chunked",
    "extracted",
    "needs_review",
    "active",
    "archived",
    "rejected",
    "failed",
] as const;

export const reviewStatuses = [
    "extracted",
    "needs_review",
    "active",
    "rejected",
    "archived",
] as const;

export const chunkStatuses = ["active", "archived"] as const;
export const chunkTypes = [
    "narrative",
    "note",
    "heading",
    "mixed",
    "unknown",
] as const;
export const routeTypes = ["DIRECT", "TRANSIT", "ANY", "UNKNOWN"] as const;
export const priceStatuses = ["NUMERIC", "NA", "MISSING"] as const;
export const issueSeverities = ["low", "medium", "high"] as const;
export const issueStatuses = ["open", "resolved", "ignored"] as const;
export const ingestionJobStatuses = [
    "queued",
    "running",
    "completed",
    "failed",
] as const;
export const toolCallStates = [
    "pending",
    "running",
    "success",
    "error",
] as const;
export const confidenceStates = [
    "CONFIDENT",
    "NEEDS_CONFIRMATION",
    "UNVERIFIED",
    "UNANSWERABLE",
] as const;
export const answerModes = ["general_rag", "verified_numeric"] as const;
export const factTypes = [
    "tariff_price",
    "fee_rule",
    "validity_rule",
    "schedule",
    "route",
    "destination",
    "document_metadata",
    "surcharge",
    "minimum_weight",
    "ppn",
    "other",
] as const;
export const aliasTypes = [
    "city",
    "airport",
    "airline",
    "route",
    "destination",
] as const;
export const embeddingOwnerTypes = [
    "document_chunk",
    "table_chunk",
    "extracted_fact",
    "tariff_row",
] as const;
export const chatSourceTypes = [
    "document_chunk",
    "table_chunk",
    "extracted_fact",
    "tariff_row",
    "fee_rule",
    "document",
    "document_page",
] as const;

export type DocumentStatus = (typeof documentStatuses)[number];
export type ReviewStatus = (typeof reviewStatuses)[number];
export type ChunkStatus = (typeof chunkStatuses)[number];
export type ChunkType = (typeof chunkTypes)[number];
export type RouteType = (typeof routeTypes)[number];
export type PriceStatus = (typeof priceStatuses)[number];
export type IssueSeverity = (typeof issueSeverities)[number];
export type IssueStatus = (typeof issueStatuses)[number];
export type IngestionJobStatus = (typeof ingestionJobStatuses)[number];
export type ToolCallState = (typeof toolCallStates)[number];
export type ConfidenceState = (typeof confidenceStates)[number];
export type AnswerMode = (typeof answerModes)[number];
export type FactType = (typeof factTypes)[number];
export type AliasType = (typeof aliasTypes)[number];
export type EmbeddingOwnerType = (typeof embeddingOwnerTypes)[number];
export type ChatSourceType = (typeof chatSourceTypes)[number];

function idColumn() {
    return uuid("id").defaultRandom().primaryKey();
}

function createdAtColumn() {
    return timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow();
}

function updatedAtColumn() {
    return timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow();
}

export const documents = pgTable(
    "documents",
    {
        checksum: text("checksum"),
        commodity: text("commodity"),
        createdAt: createdAtColumn(),
        documentKind: text("document_kind"),
        effectiveDate: date("effective_date"),
        fileType: text("file_type").notNull(),
        filename: text("filename").notNull(),
        id: idColumn(),
        ingestionError: text("ingestion_error"),
        isPromo: boolean("is_promo").notNull().default(false),
        mimeType: text("mime_type").notNull(),
        originAirport: text("origin_airport"),
        originCity: text("origin_city"),
        originalPath: text("original_path"),
        sourceName: text("source_name"),
        status: text("status")
            .$type<DocumentStatus>()
            .notNull()
            .default("uploaded"),
        storeOriginalFile: boolean("store_original_file")
            .notNull()
            .default(false),
        storePageImages: boolean("store_page_images").notNull().default(false),
        updatedAt: updatedAtColumn(),
        validFrom: date("valid_from"),
        validUntil: date("valid_until"),
    },
    (table) => [
        index("documents_checksum_idx").on(table.checksum),
        index("documents_status_idx").on(table.status),
        index("documents_airline_origin_idx").on(
            table.originCity,
            table.originAirport
        ),
    ]
);

export const documentPages = pgTable(
    "document_pages",
    {
        createdAt: createdAtColumn(),
        documentId: uuid("document_id")
            .notNull()
            .references(() => documents.id, { onDelete: "cascade" }),
        id: idColumn(),
        pageImagePath: text("page_image_path"),
        pageNumber: integer("page_number").notNull(),
        rawText: text("raw_text"),
    },
    (table) => [
        uniqueIndex("document_pages_document_page_uidx").on(
            table.documentId,
            table.pageNumber
        ),
    ]
);

export const documentChunks = pgTable(
    "document_chunks",
    {
        chunkIndex: integer("chunk_index").notNull(),
        chunkType: text("chunk_type")
            .$type<ChunkType>()
            .notNull()
            .default("unknown"),
        content: text("content").notNull(),
        createdAt: createdAtColumn(),
        documentId: uuid("document_id")
            .notNull()
            .references(() => documents.id, { onDelete: "cascade" }),
        id: idColumn(),
        metadata: jsonb("metadata"),
        pageNumber: integer("page_number"),
        status: text("status").$type<ChunkStatus>().notNull().default("active"),
        updatedAt: updatedAtColumn(),
    },
    (table) => [
        index("document_chunks_document_page_idx").on(
            table.documentId,
            table.pageNumber
        ),
        uniqueIndex("document_chunks_document_index_uidx").on(
            table.documentId,
            table.chunkIndex
        ),
    ]
);

export const tableChunks = pgTable(
    "table_chunks",
    {
        createdAt: createdAtColumn(),
        documentId: uuid("document_id")
            .notNull()
            .references(() => documents.id, { onDelete: "cascade" }),
        headerText: text("header_text"),
        id: idColumn(),
        markdown: text("markdown"),
        metadata: jsonb("metadata"),
        pageNumber: integer("page_number"),
        rowIndex: integer("row_index"),
        rowText: text("row_text").notNull(),
        status: text("status")
            .$type<ReviewStatus>()
            .notNull()
            .default("extracted"),
        tableIndex: integer("table_index"),
        updatedAt: updatedAtColumn(),
    },
    (table) => [
        index("table_chunks_document_page_idx").on(
            table.documentId,
            table.pageNumber
        ),
        index("table_chunks_status_idx").on(table.status),
    ]
);

export const extractedFacts = pgTable(
    "extracted_facts",
    {
        airline: text("airline"),
        confidence: numeric("confidence"),
        createdAt: createdAtColumn(),
        currency: text("currency"),
        destinationCity: text("destination_city"),
        destinationCode: text("destination_code"),
        documentId: uuid("document_id")
            .notNull()
            .references(() => documents.id, { onDelete: "cascade" }),
        effectiveDate: date("effective_date"),
        factType: text("fact_type").$type<FactType>().notNull(),
        flightNumber: text("flight_number"),
        id: idColumn(),
        isPromo: boolean("is_promo"),
        originAirport: text("origin_airport"),
        originCity: text("origin_city"),
        predicate: text("predicate"),
        rawEvidence: text("raw_evidence"),
        routeType: text("route_type"),
        schedule: text("schedule"),
        sourceChunkId: uuid("source_chunk_id").references(
            () => documentChunks.id,
            {
                onDelete: "set null",
            }
        ),
        sourceTableChunkId: uuid("source_table_chunk_id").references(
            () => tableChunks.id,
            { onDelete: "set null" }
        ),
        status: text("status")
            .$type<ReviewStatus>()
            .notNull()
            .default("extracted"),
        subject: text("subject"),
        transitRoute: text("transit_route"),
        unit: text("unit"),
        updatedAt: updatedAtColumn(),
        validFrom: date("valid_from"),
        validUntil: date("valid_until"),
        valueNumber: numeric("value_number"),
        valueText: text("value_text"),
    },
    (table) => [
        index("extracted_facts_document_idx").on(table.documentId),
        index("extracted_facts_lookup_idx").on(
            table.status,
            table.factType,
            table.airline,
            table.destinationCity,
            table.destinationCode
        ),
    ]
);

export const tariffRows = pgTable(
    "tariff_rows",
    {
        airline: text("airline"),
        commodity: text("commodity"),
        confidence: numeric("confidence"),
        createdAt: createdAtColumn(),
        destinationCity: text("destination_city"),
        destinationCode: text("destination_code"),
        documentId: uuid("document_id")
            .notNull()
            .references(() => documents.id, { onDelete: "cascade" }),
        effectiveDate: date("effective_date"),
        flightNumber: text("flight_number"),
        id: idColumn(),
        isPromo: boolean("is_promo").notNull().default(false),
        originAirport: text("origin_airport"),
        originCity: text("origin_city"),
        pageNumber: integer("page_number"),
        priceStatus: text("price_status")
            .$type<PriceStatus>()
            .notNull()
            .default("MISSING"),
        rawRowText: text("raw_row_text"),
        routeType: text("route_type")
            .$type<RouteType>()
            .notNull()
            .default("UNKNOWN"),
        rowNumber: integer("row_number"),
        schedule: text("schedule"),
        smuPricePerKg: integer("smu_price_per_kg"),
        sourceTableChunkId: uuid("source_table_chunk_id").references(
            () => tableChunks.id,
            { onDelete: "set null" }
        ),
        sourceText: text("source_text"),
        status: text("status")
            .$type<ReviewStatus>()
            .notNull()
            .default("extracted"),
        transitRoute: text("transit_route"),
        updatedAt: updatedAtColumn(),
        validFrom: date("valid_from"),
        validUntil: date("valid_until"),
    },
    (table) => [
        index("tariff_rows_active_lookup_idx").on(
            table.status,
            table.airline,
            table.destinationCity,
            table.destinationCode,
            table.routeType,
            table.isPromo
        ),
        index("tariff_rows_document_idx").on(table.documentId),
    ]
);

export const feeRules = pgTable(
    "fee_rules",
    {
        adminFeePerSmu: integer("admin_fee_per_smu"),
        airline: text("airline"),
        createdAt: createdAtColumn(),
        dgSurcharge: integer("dg_surcharge"),
        documentId: uuid("document_id")
            .notNull()
            .references(() => documents.id, { onDelete: "cascade" }),
        id: idColumn(),
        minWeightKg: numeric("min_weight_kg"),
        notes: text("notes"),
        ppnPercent: numeric("ppn_percent"),
        quarantineNote: text("quarantine_note"),
        shipdecNote: text("shipdec_note"),
        sourceChunkId: uuid("source_chunk_id").references(
            () => documentChunks.id,
            {
                onDelete: "set null",
            }
        ),
        sourceTableChunkId: uuid("source_table_chunk_id").references(
            () => tableChunks.id,
            { onDelete: "set null" }
        ),
        status: text("status")
            .$type<ReviewStatus>()
            .notNull()
            .default("extracted"),
        updatedAt: updatedAtColumn(),
        warehouseAdminPerSmu: integer("warehouse_admin_per_smu"),
        warehouseFeePerKg: integer("warehouse_fee_per_kg"),
    },
    (table) => [
        index("fee_rules_lookup_idx").on(
            table.status,
            table.airline,
            table.documentId
        ),
    ]
);

export const aliases = pgTable(
    "aliases",
    {
        alias: text("alias").notNull(),
        canonicalValue: text("canonical_value").notNull(),
        createdAt: createdAtColumn(),
        id: idColumn(),
        isAmbiguous: boolean("is_ambiguous").notNull().default(false),
        metadata: jsonb("metadata"),
        type: text("type").$type<AliasType>().notNull(),
        updatedAt: updatedAtColumn(),
    },
    (table) => [
        uniqueIndex("aliases_type_alias_canonical_uidx").on(
            table.type,
            sql`lower(${table.alias})`,
            table.canonicalValue
        ),
    ]
);

export const embeddings = pgTable(
    "embeddings",
    {
        createdAt: createdAtColumn(),
        embedding: vector("embedding", { dimensions: embeddingDimensions }),
        id: idColumn(),
        ownerId: uuid("owner_id").notNull(),
        ownerType: text("owner_type").$type<EmbeddingOwnerType>().notNull(),
        searchableText: text("searchable_text").notNull(),
        updatedAt: updatedAtColumn(),
    },
    (table) => [
        uniqueIndex("embeddings_owner_uidx").on(table.ownerType, table.ownerId),
    ]
);

export const extractionIssues = pgTable(
    "extraction_issues",
    {
        createdAt: createdAtColumn(),
        documentId: uuid("document_id")
            .notNull()
            .references(() => documents.id, { onDelete: "cascade" }),
        id: idColumn(),
        issueType: text("issue_type").notNull(),
        message: text("message").notNull(),
        severity: text("severity").$type<IssueSeverity>().notNull(),
        sourceId: uuid("source_id"),
        sourceType: text("source_type"),
        status: text("status").$type<IssueStatus>().notNull().default("open"),
        updatedAt: updatedAtColumn(),
    },
    (table) => [
        index("extraction_issues_document_status_idx").on(
            table.documentId,
            table.status,
            table.severity
        ),
    ]
);

export const chatSessions = pgTable(
    "chat_sessions",
    {
        createdAt: createdAtColumn(),
        deletedAt: timestamp("deleted_at", { withTimezone: true }),
        id: idColumn(),
        title: text("title"),
        updatedAt: updatedAtColumn(),
        userLabel: text("user_label"),
    },
    (table) => [index("chat_sessions_updated_idx").on(table.updatedAt)]
);

export const chatMessages = pgTable(
    "chat_messages",
    {
        content: text("content").notNull(),
        createdAt: createdAtColumn(),
        id: idColumn(),
        metadata: jsonb("metadata"),
        parts: jsonb("parts"),
        role: text("role").notNull(),
        sessionId: uuid("session_id")
            .notNull()
            .references(() => chatSessions.id, { onDelete: "cascade" }),
    },
    (table) => [
        index("chat_messages_session_created_idx").on(
            table.sessionId,
            table.createdAt
        ),
    ]
);

export const chatToolCalls = pgTable(
    "chat_tool_calls",
    {
        completedAt: timestamp("completed_at", { withTimezone: true }),
        error: text("error"),
        id: idColumn(),
        input: jsonb("input"),
        messageId: uuid("message_id").references(() => chatMessages.id, {
            onDelete: "set null",
        }),
        output: jsonb("output"),
        sessionId: uuid("session_id")
            .notNull()
            .references(() => chatSessions.id, { onDelete: "cascade" }),
        startedAt: timestamp("started_at", { withTimezone: true })
            .notNull()
            .defaultNow(),
        state: text("state")
            .$type<ToolCallState>()
            .notNull()
            .default("pending"),
        toolName: text("tool_name").notNull(),
    },
    (table) => [
        index("chat_tool_calls_session_idx").on(
            table.sessionId,
            table.startedAt
        ),
    ]
);

export const chatSources = pgTable(
    "chat_sources",
    {
        createdAt: createdAtColumn(),
        id: idColumn(),
        messageId: uuid("message_id")
            .notNull()
            .references(() => chatMessages.id, { onDelete: "cascade" }),
        metadata: jsonb("metadata"),
        sessionId: uuid("session_id")
            .notNull()
            .references(() => chatSessions.id, { onDelete: "cascade" }),
        snippet: text("snippet"),
        sourceId: uuid("source_id").notNull(),
        sourceType: text("source_type").$type<ChatSourceType>().notNull(),
        title: text("title").notNull(),
    },
    (table) => [index("chat_sources_message_idx").on(table.messageId)]
);

export const answerVerifications = pgTable(
    "answer_verifications",
    {
        checks: jsonb("checks").notNull(),
        confidenceState: text("confidence_state")
            .$type<ConfidenceState>()
            .notNull(),
        createdAt: createdAtColumn(),
        id: idColumn(),
        messageId: uuid("message_id")
            .notNull()
            .references(() => chatMessages.id, { onDelete: "cascade" }),
        mode: text("mode").$type<AnswerMode>().notNull(),
        sessionId: uuid("session_id")
            .notNull()
            .references(() => chatSessions.id, { onDelete: "cascade" }),
        warnings: jsonb("warnings"),
    },
    (table) => [index("answer_verifications_message_idx").on(table.messageId)]
);

export const settings = pgTable("settings", {
    key: text("key").primaryKey(),
    updatedAt: updatedAtColumn(),
    value: jsonb("value").notNull(),
});

export const auditLogs = pgTable(
    "audit_logs",
    {
        action: text("action").notNull(),
        actor: text("actor").notNull(),
        after: jsonb("after"),
        before: jsonb("before"),
        createdAt: createdAtColumn(),
        entityId: uuid("entity_id"),
        entityType: text("entity_type").notNull(),
        id: idColumn(),
    },
    (table) => [
        index("audit_logs_entity_idx").on(table.entityType, table.entityId),
    ]
);

export const ingestionJobs = pgTable(
    "ingestion_jobs",
    {
        attempts: integer("attempts").notNull().default(0),
        availableAt: timestamp("available_at", { withTimezone: true })
            .notNull()
            .defaultNow(),
        completedAt: timestamp("completed_at", { withTimezone: true }),
        createdAt: createdAtColumn(),
        documentId: uuid("document_id")
            .notNull()
            .references(() => documents.id, { onDelete: "cascade" }),
        error: text("error"),
        id: idColumn(),
        maxAttempts: integer("max_attempts").notNull().default(3),
        payload: jsonb("payload"),
        startedAt: timestamp("started_at", { withTimezone: true }),
        status: text("status")
            .$type<IngestionJobStatus>()
            .notNull()
            .default("queued"),
        type: text("type").notNull(),
        updatedAt: updatedAtColumn(),
    },
    (table) => [
        index("ingestion_jobs_claim_idx").on(table.status, table.availableAt),
        index("ingestion_jobs_document_idx").on(table.documentId),
    ]
);
