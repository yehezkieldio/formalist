# Self-Hosted VPS

This is the no-Docker deployment path for a single VPS. Run Postgres, pgvector,
Redis, the Next.js app, and the ingestion worker directly on the host.

## Runtime Services

- Postgres stores documents, chunks, extracted facts, tariff rows, chat history,
  settings, and audit logs.
- Redis backs BullMQ ingestion jobs when `QUEUE_PROVIDER=local-redis`.
- The Next.js app listens on loopback by default and should sit behind nginx or
  Caddy.
- The worker is a separate long-running process.
- Uploaded source artifacts live outside the public web root.

## Environment

```bash
cp .env.vps.example .env
```

Set these before booting production:

- `DATABASE_URL`: local Postgres URL for the `formalist` database.
- `REDIS_URL`: local Redis URL.
- `UPLOAD_ROOT`: durable upload directory, for example
  `/var/lib/formalist/uploads`.
- `ADMIN_PASSWORD`: admin login password.
- `SESSION_SECRET`: at least 32 random characters.
- `OPENROUTER_SITE_URL`: public HTTPS URL.
- `OPENROUTER_API_KEY`: optional at boot, required for chat and LLM extraction.

## First Deploy

Install dependencies and build:

```bash
bun install --frozen-lockfile
just self-hosted-build
```

Run migrations:

```bash
just self-hosted-migrate
```

Start app and worker in separate process manager units:

```bash
just self-hosted-app
just self-hosted-worker
```

For local non-Docker development against host Postgres and Redis:

```bash
just host-db-migrate
just host-all
```

## systemd Example

App unit:

```ini
[Unit]
Description=Formalist web app
After=network.target postgresql.service redis-server.service

[Service]
Type=simple
User=formalist
WorkingDirectory=/srv/formalist
EnvironmentFile=/srv/formalist/.env
ExecStart=/home/formalist/.bun/bin/bun run self-hosted:app
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Worker unit:

```ini
[Unit]
Description=Formalist ingestion worker
After=network.target postgresql.service redis-server.service

[Service]
Type=simple
User=formalist
WorkingDirectory=/srv/formalist
EnvironmentFile=/srv/formalist/.env
ExecStart=/home/formalist/.bun/bin/bun run self-hosted:worker
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Use a reverse proxy in front of the app. Next.js self-hosting recommends a
reverse proxy rather than exposing `next start` directly, and `HOST=127.0.0.1`
keeps the app private to the VPS.

## Upgrade

```bash
git pull
bun install --frozen-lockfile
just self-hosted-build
just self-hosted-migrate
sudo systemctl restart formalist-app formalist-worker
```

Back up both Postgres and `UPLOAD_ROOT`.
