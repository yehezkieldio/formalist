import { env } from "#/env";
import { startIngestionWorker } from "#/server/ingestion/worker";

async function main() {
    const abortController = new AbortController();

    process.on("SIGINT", () => {
        abortController.abort();
    });
    process.on("SIGTERM", () => {
        abortController.abort();
    });

    process.stdout.write(
        `Formalist worker booting in ${env.DEPLOYMENT_MODE} mode with ${env.QUEUE_PROVIDER} queue\n`
    );
    await startIngestionWorker({ signal: abortController.signal });
}

try {
    await main();
} catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Formalist worker failed: ${message}\n`);
    process.exitCode = 1;
}
