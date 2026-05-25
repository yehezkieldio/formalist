import { env } from "#/env";

function main() {
    process.stdout.write(
        `Formalist worker booting in ${env.DEPLOYMENT_MODE} mode with ${env.QUEUE_PROVIDER} queue\n`
    );
}

main();
