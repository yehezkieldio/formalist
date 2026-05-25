import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { MessageList } from "#/components/ai/message-list";
import { PromptComposer } from "#/components/ai/prompt-composer";

const unexpectedSubmit = () => {
    throw new Error("Prompt composer submit should not run during render.");
};

describe("chat UI components", () => {
    it("renders assistant confidence, tool calls, and source evidence", () => {
        const markup = renderToStaticMarkup(
            <MessageList
                messages={[
                    {
                        content:
                            "Harga SMU reviewed aktif adalah Rp 18.000/kg.",
                        id: "assistant-1",
                        role: "assistant",
                        sources: [
                            {
                                id: "source-1",
                                snippet: "SUB CGK 18000 direct",
                                sourceId:
                                    "00000000-0000-0000-0000-000000000001",
                                sourceType: "tariff_row",
                                title: "Pelita pricelist page 2",
                            },
                        ],
                        toolCalls: [
                            {
                                id: "tool-1",
                                startedAt: new Date("2026-01-01T00:00:00Z"),
                                state: "success",
                                toolName: "searchTariffs",
                            },
                        ],
                        verification: {
                            confidenceState: "CONFIDENT",
                            mode: "verified_numeric",
                        },
                    },
                ]}
            />
        );

        expect(markup).toContain("Confident");
        expect(markup).toContain("searchTariffs");
        expect(markup).toContain("Pelita pricelist page 2");
    });

    it("keeps the composer disabled without an active session", () => {
        const markup = renderToStaticMarkup(
            <PromptComposer disabled onSubmit={unexpectedSubmit} />
        );

        expect(markup).toContain('aria-label="Message"');
        expect(markup).toContain('aria-label="Send message"');
        expect(markup).toContain('disabled=""');
    });
});
