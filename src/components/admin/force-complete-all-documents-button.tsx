"use client";

import { ShieldCheckIcon } from "lucide-react";
import { useActionState } from "react";

import { Button } from "#/components/ui/button";

export function ForceCompleteAllDocumentsButton({
    action,
    disabled,
    issueCount,
    recordCount,
}: {
    action: () => Promise<void>;
    disabled: boolean;
    issueCount: number;
    recordCount: number;
}) {
    const [actionError, submitAction, pending] = useActionState(
        async (_currentError: string | null) => {
            try {
                await action();
                return null;
            } catch (error) {
                return error instanceof Error
                    ? error.message
                    : "Could not resolve and approve all documents.";
            }
        },
        null
    );

    return (
        <form action={submitAction} className="grid gap-1">
            <Button
                disabled={disabled || pending}
                size="sm"
                title={`${recordCount} records, ${issueCount} issues`}
                type="submit"
                variant="destructive"
            >
                <ShieldCheckIcon aria-hidden="true" />
                {pending ? "Completing..." : "Resolve and approve all"}
            </Button>
            {actionError ? (
                <p className="max-w-72 text-destructive text-xs">
                    {actionError}
                </p>
            ) : null}
        </form>
    );
}
