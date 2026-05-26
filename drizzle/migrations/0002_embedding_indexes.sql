CREATE UNIQUE INDEX IF NOT EXISTS "embeddings_owner_uidx"
ON "embeddings" USING btree ("owner_type", "owner_id");
