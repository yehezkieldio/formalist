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
        <>
            <header>
                <h1 className="font-semibold text-2xl">Settings</h1>
                <p className="text-muted-foreground text-sm">
                    Configure deployment, model, retrieval, storage, UI, and
                    quote defaults.
                </p>
            </header>
            <DeploymentStatusPanel health={health} settings={settings} />
            <ModelRetrievalSettingsForm settings={settings} />
            <StorageUiSettingsForm settings={settings} />
        </>
    );
}
