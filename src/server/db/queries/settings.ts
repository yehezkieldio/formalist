import { eq } from "drizzle-orm";

import { getDatabase } from "#/server/db";
import { settings } from "#/server/db/schema";

export async function getSetting(key: string) {
    const [setting] = await getDatabase()
        .select()
        .from(settings)
        .where(eq(settings.key, key))
        .limit(1);

    return setting;
}

export async function setSetting(key: string, value: unknown) {
    const [setting] = await getDatabase()
        .insert(settings)
        .values({ key, updatedAt: new Date(), value })
        .onConflictDoUpdate({
            set: { updatedAt: new Date(), value },
            target: settings.key,
        })
        .returning();

    return setting;
}
