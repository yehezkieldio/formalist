CREATE UNIQUE INDEX IF NOT EXISTS "embeddings_owner_uidx"
ON "embeddings" USING btree ("owner_type", "owner_id");

CREATE INDEX IF NOT EXISTS "embeddings_embedding_hnsw_idx"
ON "embeddings" USING hnsw ("embedding" vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
