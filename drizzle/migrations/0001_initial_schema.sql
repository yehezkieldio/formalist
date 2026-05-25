CREATE TABLE "aliases" (
	"alias" text NOT NULL,
	"canonical_value" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"is_ambiguous" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"type" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "answer_verifications" (
	"checks" jsonb NOT NULL,
	"confidence_state" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" uuid NOT NULL,
	"mode" text NOT NULL,
	"session_id" uuid NOT NULL,
	"warnings" jsonb
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"action" text NOT NULL,
	"actor" text NOT NULL,
	"after" jsonb,
	"before" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"entity_id" uuid,
	"entity_type" text NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"metadata" jsonb,
	"parts" jsonb,
	"role" text NOT NULL,
	"session_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_sessions" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_label" text
);
--> statement-breakpoint
CREATE TABLE "chat_sources" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" uuid NOT NULL,
	"metadata" jsonb,
	"session_id" uuid NOT NULL,
	"snippet" text,
	"source_id" uuid NOT NULL,
	"source_type" text NOT NULL,
	"title" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_tool_calls" (
	"completed_at" timestamp with time zone,
	"error" text,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"input" jsonb,
	"message_id" uuid,
	"output" jsonb,
	"session_id" uuid NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"state" text DEFAULT 'pending' NOT NULL,
	"tool_name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_chunks" (
	"chunk_index" integer NOT NULL,
	"chunk_type" text DEFAULT 'unknown' NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"document_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"metadata" jsonb,
	"page_number" integer,
	"status" text DEFAULT 'active' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_pages" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"document_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_image_path" text,
	"page_number" integer NOT NULL,
	"raw_text" text
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"checksum" text,
	"commodity" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"document_kind" text,
	"effective_date" date,
	"file_type" text NOT NULL,
	"filename" text NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ingestion_error" text,
	"is_promo" boolean DEFAULT false NOT NULL,
	"mime_type" text NOT NULL,
	"origin_airport" text,
	"origin_city" text,
	"original_path" text,
	"source_name" text,
	"status" text DEFAULT 'uploaded' NOT NULL,
	"store_original_file" boolean DEFAULT false NOT NULL,
	"store_page_images" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"valid_from" date,
	"valid_until" date
);
--> statement-breakpoint
CREATE TABLE "embeddings" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"embedding" vector(4096),
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"owner_type" text NOT NULL,
	"searchable_text" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "extracted_facts" (
	"airline" text,
	"confidence" numeric,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"currency" text,
	"destination_city" text,
	"destination_code" text,
	"document_id" uuid NOT NULL,
	"effective_date" date,
	"fact_type" text NOT NULL,
	"flight_number" text,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"is_promo" boolean,
	"origin_airport" text,
	"origin_city" text,
	"predicate" text,
	"raw_evidence" text,
	"route_type" text,
	"schedule" text,
	"source_chunk_id" uuid,
	"source_table_chunk_id" uuid,
	"status" text DEFAULT 'extracted' NOT NULL,
	"subject" text,
	"transit_route" text,
	"unit" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"valid_from" date,
	"valid_until" date,
	"value_number" numeric,
	"value_text" text
);
--> statement-breakpoint
CREATE TABLE "extraction_issues" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"document_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"issue_type" text NOT NULL,
	"message" text NOT NULL,
	"severity" text NOT NULL,
	"source_id" uuid,
	"source_type" text,
	"status" text DEFAULT 'open' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fee_rules" (
	"admin_fee_per_smu" integer,
	"airline" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"dg_surcharge" integer,
	"document_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"min_weight_kg" numeric,
	"notes" text,
	"ppn_percent" numeric,
	"quarantine_note" text,
	"shipdec_note" text,
	"source_chunk_id" uuid,
	"source_table_chunk_id" uuid,
	"status" text DEFAULT 'extracted' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"warehouse_admin_per_smu" integer,
	"warehouse_fee_per_kg" integer
);
--> statement-breakpoint
CREATE TABLE "ingestion_jobs" (
	"attempts" integer DEFAULT 0 NOT NULL,
	"available_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"document_id" uuid NOT NULL,
	"error" text,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"payload" jsonb,
	"started_at" timestamp with time zone,
	"status" text DEFAULT 'queued' NOT NULL,
	"type" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"value" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "table_chunks" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"document_id" uuid NOT NULL,
	"header_text" text,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"markdown" text,
	"metadata" jsonb,
	"page_number" integer,
	"row_index" integer,
	"row_text" text NOT NULL,
	"status" text DEFAULT 'extracted' NOT NULL,
	"table_index" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tariff_rows" (
	"airline" text,
	"commodity" text,
	"confidence" numeric,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"destination_city" text,
	"destination_code" text,
	"document_id" uuid NOT NULL,
	"effective_date" date,
	"flight_number" text,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"is_promo" boolean DEFAULT false NOT NULL,
	"origin_airport" text,
	"origin_city" text,
	"page_number" integer,
	"price_status" text DEFAULT 'MISSING' NOT NULL,
	"raw_row_text" text,
	"route_type" text DEFAULT 'UNKNOWN' NOT NULL,
	"row_number" integer,
	"schedule" text,
	"smu_price_per_kg" integer,
	"source_table_chunk_id" uuid,
	"source_text" text,
	"status" text DEFAULT 'extracted' NOT NULL,
	"transit_route" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"valid_from" date,
	"valid_until" date
);
--> statement-breakpoint
ALTER TABLE "answer_verifications" ADD CONSTRAINT "answer_verifications_message_id_chat_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."chat_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "answer_verifications" ADD CONSTRAINT "answer_verifications_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_sources" ADD CONSTRAINT "chat_sources_message_id_chat_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."chat_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_sources" ADD CONSTRAINT "chat_sources_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_tool_calls" ADD CONSTRAINT "chat_tool_calls_message_id_chat_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."chat_messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_tool_calls" ADD CONSTRAINT "chat_tool_calls_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_chunks" ADD CONSTRAINT "document_chunks_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_pages" ADD CONSTRAINT "document_pages_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extracted_facts" ADD CONSTRAINT "extracted_facts_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extracted_facts" ADD CONSTRAINT "extracted_facts_source_chunk_id_document_chunks_id_fk" FOREIGN KEY ("source_chunk_id") REFERENCES "public"."document_chunks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extracted_facts" ADD CONSTRAINT "extracted_facts_source_table_chunk_id_table_chunks_id_fk" FOREIGN KEY ("source_table_chunk_id") REFERENCES "public"."table_chunks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extraction_issues" ADD CONSTRAINT "extraction_issues_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_rules" ADD CONSTRAINT "fee_rules_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_rules" ADD CONSTRAINT "fee_rules_source_chunk_id_document_chunks_id_fk" FOREIGN KEY ("source_chunk_id") REFERENCES "public"."document_chunks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_rules" ADD CONSTRAINT "fee_rules_source_table_chunk_id_table_chunks_id_fk" FOREIGN KEY ("source_table_chunk_id") REFERENCES "public"."table_chunks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingestion_jobs" ADD CONSTRAINT "ingestion_jobs_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "table_chunks" ADD CONSTRAINT "table_chunks_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tariff_rows" ADD CONSTRAINT "tariff_rows_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tariff_rows" ADD CONSTRAINT "tariff_rows_source_table_chunk_id_table_chunks_id_fk" FOREIGN KEY ("source_table_chunk_id") REFERENCES "public"."table_chunks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "aliases_type_alias_canonical_uidx" ON "aliases" USING btree ("type",lower("alias"),"canonical_value");--> statement-breakpoint
CREATE INDEX "answer_verifications_message_idx" ON "answer_verifications" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "chat_messages_session_created_idx" ON "chat_messages" USING btree ("session_id","created_at");--> statement-breakpoint
CREATE INDEX "chat_sessions_updated_idx" ON "chat_sessions" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "chat_sources_message_idx" ON "chat_sources" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "chat_tool_calls_session_idx" ON "chat_tool_calls" USING btree ("session_id","started_at");--> statement-breakpoint
CREATE INDEX "document_chunks_document_page_idx" ON "document_chunks" USING btree ("document_id","page_number");--> statement-breakpoint
CREATE UNIQUE INDEX "document_chunks_document_index_uidx" ON "document_chunks" USING btree ("document_id","chunk_index");--> statement-breakpoint
CREATE UNIQUE INDEX "document_pages_document_page_uidx" ON "document_pages" USING btree ("document_id","page_number");--> statement-breakpoint
CREATE INDEX "documents_checksum_idx" ON "documents" USING btree ("checksum");--> statement-breakpoint
CREATE INDEX "documents_status_idx" ON "documents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "documents_airline_origin_idx" ON "documents" USING btree ("origin_city","origin_airport");--> statement-breakpoint
CREATE UNIQUE INDEX "embeddings_owner_uidx" ON "embeddings" USING btree ("owner_type","owner_id");--> statement-breakpoint
CREATE INDEX "extracted_facts_document_idx" ON "extracted_facts" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "extracted_facts_lookup_idx" ON "extracted_facts" USING btree ("status","fact_type","airline","destination_city","destination_code");--> statement-breakpoint
CREATE INDEX "extraction_issues_document_status_idx" ON "extraction_issues" USING btree ("document_id","status","severity");--> statement-breakpoint
CREATE INDEX "fee_rules_lookup_idx" ON "fee_rules" USING btree ("status","airline","document_id");--> statement-breakpoint
CREATE INDEX "ingestion_jobs_claim_idx" ON "ingestion_jobs" USING btree ("status","available_at");--> statement-breakpoint
CREATE INDEX "ingestion_jobs_document_idx" ON "ingestion_jobs" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "table_chunks_document_page_idx" ON "table_chunks" USING btree ("document_id","page_number");--> statement-breakpoint
CREATE INDEX "table_chunks_status_idx" ON "table_chunks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tariff_rows_active_lookup_idx" ON "tariff_rows" USING btree ("status","airline","destination_city","destination_code","route_type","is_promo");--> statement-breakpoint
CREATE INDEX "tariff_rows_document_idx" ON "tariff_rows" USING btree ("document_id");