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
        <div className="my-2 space-y-1.5">
            {toolCalls.map((toolCall) => (
                <ToolCallCard key={toolCall.id} toolCall={toolCall} />
            ))}
        </div>
    );
}
