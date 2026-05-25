import { createAliasRecord } from "./aliases";
import { builtInAliases } from "./built-in-aliases";

export async function ensureBuiltInAliases() {
    const results = [];

    for (const alias of builtInAliases) {
        try {
            results.push(await createAliasRecord(alias));
        } catch (error) {
            if (
                error instanceof Error &&
                error.message.includes("already exists")
            ) {
                continue;
            }

            throw error;
        }
    }

    return results;
}
