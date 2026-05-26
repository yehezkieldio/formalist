import { AlertTriangleIcon } from "lucide-react";

export function SetupRequiredMessage({ reason }: { reason: string }) {
    return (
        <div className="border border-destructive/25 bg-destructive/10 px-4 py-3 font-mono text-xs text-destructive select-none">
            <div className="flex items-center gap-2">
                <AlertTriangleIcon
                    aria-hidden="true"
                    className="size-3.5 shrink-0"
                />
                <span className="font-bold uppercase tracking-wider">
                    SETUP REQUIRED
                </span>
            </div>
            <p className="mt-2 text-destructive/80 leading-normal">{reason}</p>
        </div>
    );
}
