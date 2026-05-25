import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ToolCallCard } from "#/components/ai/tool-call-card";

describe("tool-call UI", () => {
    it("renders state, duration-ready metadata, and safe expandable labels", () => {
        const markup = renderToStaticMarkup(
            <ToolCallCard
                toolCall={{
                    completedAt: new Date("2026-01-01T00:00:01Z"),
                    id: "tool-1",
                    input: { destination: "SUB" },
                    output: { count: 1 },
                    startedAt: new Date("2026-01-01T00:00:00Z"),
                    state: "success",
                    toolName: "searchTariffs",
                }}
            />
        );

        expect(markup).toContain("searchTariffs");
        expect(markup).toContain("Success");
        expect(markup).toContain("1000 ms");
    });
});
