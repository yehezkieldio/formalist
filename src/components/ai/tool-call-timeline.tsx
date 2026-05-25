import { ToolCallCard } from "#/components/ai/tool-call-card";
import type { ChatToolCallData } from "#/components/ai/types";

export function ToolCallTimeline({
    toolCalls,
}: {
    toolCalls?: ChatToolCallData[];
}) {
    if (!toolCalls?.length) {
        return null;
    }

    return (
        <div className="space-y-2">
            <p className="font-medium text-muted-foreground text-xs uppercase tracking-normal">
                Tool calls
            </p>
            {toolCalls.map((toolCall) => (
                <ToolCallCard key={toolCall.id} toolCall={toolCall} />
            ))}
        </div>
    );
}
