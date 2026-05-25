import { KeyRoundIcon } from "lucide-react";

import { Button } from "#/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "#/components/ui/card";

export default function AdminLoginPage() {
    return (
        <div className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-md items-center">
            <Card className="w-full">
                <CardHeader>
                    <div className="mb-2 flex size-10 items-center justify-center rounded-md border bg-background">
                        <KeyRoundIcon aria-hidden="true" />
                    </div>
                    <CardTitle>Admin login</CardTitle>
                    <CardDescription>
                        Enter the operator password configured for this
                        deployment.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form
                        action="/api/admin/login"
                        className="flex flex-col gap-4"
                        method="post"
                    >
                        <div className="flex flex-col gap-2">
                            <label
                                className="font-medium text-sm"
                                htmlFor="password"
                            >
                                Password
                            </label>
                            <input
                                aria-label="Admin password"
                                autoComplete="current-password"
                                className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                id="password"
                                name="password"
                                required
                                type="password"
                            />
                        </div>
                        <Button type="submit">Sign in</Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
