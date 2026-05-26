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
        <div className="border border-border/40 bg-muted/5 p-4 font-mono text-[10px] select-none my-3">
            <div className="flex items-center gap-2 border-b border-border/40 pb-2 mb-3">
                <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full bg-foreground/30 rounded-full opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-foreground/60"></span>
                </span>
                <span className="font-bold tracking-wider uppercase text-muted-foreground">
                    Execution Plan
                </span>
            </div>
            <ol className="space-y-2.5">
                {steps.map((step) => {
                    const Icon = getStepIcon(step.status);

                    return (
                        <li
                            className="flex items-start gap-2.5 text-[10px]"
                            key={step.label}
                        >
                            <Icon
                                aria-hidden="true"
                                className={cn(
                                    "mt-0.5 size-3 shrink-0 text-muted-foreground/60",
                                    step.status === "active" &&
                                        "animate-spin text-foreground",
                                    step.status === "complete" &&
                                        "text-emerald-500"
                                )}
                            />
                            <div className="min-w-0 flex-1 leading-normal">
                                <span
                                    className={cn(
                                        "font-medium",
                                        step.status === "active" &&
                                            "text-foreground",
                                        step.status === "complete" &&
                                            "text-muted-foreground/80",
                                        step.status === "pending" &&
                                            "text-muted-foreground/45"
                                    )}
                                >
                                    {step.label}
                                </span>
                                {step.description ? (
                                    <span
                                        className={cn(
                                            "block text-[9px] mt-0.5",
                                            step.status === "complete" &&
                                                "text-muted-foreground/50",
                                            step.status === "active" &&
                                                "text-muted-foreground/80",
                                            step.status === "pending" &&
                                                "text-muted-foreground/35"
                                        )}
                                    >
                                        &gt; {step.description}
                                    </span>
                                ) : null}
                            </div>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}
