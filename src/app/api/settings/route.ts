import { NextResponse } from "next/server";

import { requireAdmin } from "#/server/auth/require-admin";
import { writeAuditLog } from "#/server/db/queries/audit";
import { getAppSettings, setAppSettings } from "#/server/db/queries/settings";
import { getHealthReport } from "#/server/deployment/health";
import { redactSettingsSecrets } from "#/server/settings/schema";

export async function GET() {
    const unauthorized = await requireAdmin();

    if (unauthorized) {
        return unauthorized;
    }

    const [settings, health] = await Promise.all([
        getAppSettings(),
        getHealthReport(),
    ]);

    return NextResponse.json({
        health,
        settings: redactSettingsSecrets(settings),
    });
}

export async function PATCH(request: Request) {
    const unauthorized = await requireAdmin();

    if (unauthorized) {
        return unauthorized;
    }

    const before = await getAppSettings();
    const after = await setAppSettings(await request.json());

    await writeAuditLog({
        action: "settings.update",
        actor: "admin",
        after,
        before,
        entityType: "settings",
    });

    return NextResponse.json({ settings: redactSettingsSecrets(after) });
}
