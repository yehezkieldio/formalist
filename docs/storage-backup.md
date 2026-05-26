# Storage And Backup

Formalist is self-hosted-first for artifacts. It does not require S3, Supabase
Storage, R2, or another managed object store.

## Local Paths

`UPLOAD_ROOT` is the only artifact root. Helpers reject traversal and public
web-root paths.

Optional artifact layout:

- `original/{documentId}.{ext}`
- `pages/{documentId}/page-{n}.png`
- `extracted/{documentId}/raw.json`
- `debug/{documentId}/`

## Backup Scope

Always back up Postgres. It stores document text, page text, chunks, table
chunks, facts, tariff rows, fee rules, embeddings, chat history, settings, jobs,
and audit logs.

Back up `UPLOAD_ROOT` only if original files, page images, or debug artifacts
are enabled and needed. The core system should still work from stored text,
chunks, facts, and source metadata when original file storage is disabled.

## Persistence Caveat

Managed platforms with ephemeral disks should disable optional artifact storage
or mount a persistent local directory.
