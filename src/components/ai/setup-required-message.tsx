import { AlertTriangleIcon } from "lucide-react";

export function SetupRequiredMessage({ reason }: { reason: string }) {
    return (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-destructive text-sm">
            <AlertTriangleIcon
                aria-hidden="true"
                className="mr-2 inline size-4"
            />
            {reason}
        </div>
    );
}
