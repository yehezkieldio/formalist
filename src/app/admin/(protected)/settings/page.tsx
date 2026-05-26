import { AdminPageHeader } from "#/components/admin/admin-primitives";
import { DeploymentStatusPanel } from "#/components/admin/deployment-status-panel";
import { ModelRetrievalSettingsForm } from "#/components/admin/model-retrieval-settings-form";
import { StorageUiSettingsForm } from "#/components/admin/storage-ui-settings-form";
import { getAppSettings } from "#/server/db/queries/settings";
import { getHealthReport } from "#/server/deployment/health";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
    const [settings, health] = await Promise.all([
        getAppSettings(),
        getHealthReport(),
    ]);

    return (
        <div className="grid gap-6">
            <AdminPageHeader
                description="Configure deployment health, model routing, retrieval defaults, storage behavior, and quote defaults."
                eyebrow="System controls"
                title="Settings"
            />
            <DeploymentStatusPanel health={health} settings={settings} />
            <ModelRetrievalSettingsForm settings={settings} />
            <StorageUiSettingsForm settings={settings} />
        </div>
    );
}
