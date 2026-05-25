import { Badge } from "#/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import type { HealthReport, HealthState } from "#/server/deployment/health";
import type { AppSettings } from "#/server/settings/schema";

const stateVariant = {
    degraded: "outline",
    error: "destructive",
    ok: "secondary",
} satisfies Record<HealthState, "destructive" | "outline" | "secondary">;

function StatusFact({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-md border p-3">
            <p className="text-muted-foreground text-xs">{label}</p>
            <p className="font-medium text-sm">{value}</p>
        </div>
    );
}

export function DeploymentStatusPanel({
    health,
    settings,
}: {
    health: HealthReport;
    settings: AppSettings;
}) {
    const checks = [
        ["Database", health.database],
        ["Vector", health.vector],
        ["Queue", health.queue],
        ["Storage", health.storage],
        ["OpenRouter", health.openRouter],
    ] as const;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Deployment Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-2 text-sm sm:grid-cols-3">
                    <StatusFact
                        label="Mode"
                        value={settings.deployment.deploymentMode}
                    />
                    <StatusFact
                        label="Database"
                        value={settings.deployment.databaseProvider}
                    />
                    <StatusFact
                        label="Queue"
                        value={settings.deployment.queueProvider}
                    />
                </div>
                <div className="grid gap-2">
                    {checks.map(([label, check]) => (
                        <div
                            className="flex items-start justify-between gap-3 rounded-md border p-3"
                            key={label}
                        >
                            <div>
                                <p className="font-medium text-sm">{label}</p>
                                <p className="text-muted-foreground text-xs">
                                    {check.message}
                                </p>
                            </div>
                            <Badge variant={stateVariant[check.state]}>
                                {check.state}
                            </Badge>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
