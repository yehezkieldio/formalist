import { ShieldCheckIcon } from "lucide-react";

import { Badge } from "#/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "#/components/ui/card";

const sections = [
    "Documents",
    "Chunks",
    "Facts",
    "Tariff review",
    "Fee rules",
    "Aliases",
    "Extraction issues",
    "Audit logs",
    "Settings",
] as const;

export default function AdminDashboardPage() {
    return (
        <>
            <header className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="font-semibold text-2xl">Admin dashboard</h1>
                    <p className="text-muted-foreground text-sm">
                        Review extracted cargo tariff memory before it becomes
                        trusted.
                    </p>
                </div>
                <Badge variant="secondary">Protected</Badge>
            </header>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {sections.map((section) => (
                    <Card key={section}>
                        <CardHeader>
                            <ShieldCheckIcon aria-hidden="true" />
                            <CardTitle>{section}</CardTitle>
                            <CardDescription>
                                First-version admin surface placeholder for the
                                implementation phase.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground text-sm">
                                Review workflow controls are added in later
                                slices.
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </section>
        </>
    );
}
