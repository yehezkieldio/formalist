import { eq } from "drizzle-orm";

import { getDatabase } from "#/server/db";
import { settings } from "#/server/db/schema";
import { defaultAppSettings, mergeAppSettings } from "#/server/settings/schema";
import type { AppSettings } from "#/server/settings/schema";

export const appSettingsKey = "app";

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

export async function getAppSettings(): Promise<AppSettings> {
    const setting = await getSetting(appSettingsKey);

    return setting ? mergeAppSettings(setting.value) : defaultAppSettings;
}

export async function setAppSettings(value: unknown) {
    const parsed = mergeAppSettings(value);

    await setSetting(appSettingsKey, parsed);

    return parsed;
}
