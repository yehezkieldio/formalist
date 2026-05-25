"use client";

import { CheckCircle2Icon, CircleIcon, LoaderCircleIcon } from "lucide-react";

import { cn } from "#/lib/utils";

export interface ChainOfThoughtStep {
    description?: string;
    label: string;
    status?: "active" | "complete" | "pending";
}

function getStepIcon(status: ChainOfThoughtStep["status"]) {
    if (status === "complete") {
        return CheckCircle2Icon;
    }

    if (status === "active") {
        return LoaderCircleIcon;
    }

    return CircleIcon;
}

export function ChainOfThought({ steps }: { steps?: ChainOfThoughtStep[] }) {
    if (!steps?.length) {
        return null;
    }

    return (
        <div className="rounded-md border bg-background p-3">
            <p className="mb-2 font-medium text-sm">Plan</p>
            <ol className="space-y-2">
                {steps.map((step) => {
                    const Icon = getStepIcon(step.status);

                    return (
                        <li className="flex gap-2 text-sm" key={step.label}>
                            <Icon
                                aria-hidden="true"
                                className={cn(
                                    "mt-0.5 size-4 text-muted-foreground",
                                    step.status === "active" &&
                                        "animate-spin text-foreground",
                                    step.status === "complete" &&
                                        "text-foreground"
                                )}
                            />
                            <span>
                                <span className="block font-medium">
                                    {step.label}
                                </span>
                                {step.description ? (
                                    <span className="block text-muted-foreground">
                                        {step.description}
                                    </span>
                                ) : null}
                            </span>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}
