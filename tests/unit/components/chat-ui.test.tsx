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

    it("shows streaming status for an empty assistant message", () => {
        const markup = renderToStaticMarkup(
            <MessageList
                isStreaming
                messages={[
                    {
                        content: "Search active tariffs",
                        id: "user-1",
                        role: "user",
                    },
                    {
                        content: "",
                        id: "assistant-1",
                        role: "assistant",
                        statusLabel: "Starting model stream",
                    },
                ]}
            />
        );

        expect(markup).toContain("Starting model stream");
        expect(markup).not.toContain("No answer text was returned");
    });

    it("renders tool calls from streamed message state without answer text", () => {
        const markup = renderToStaticMarkup(
            <MessageList
                isStreaming
                messages={[
                    {
                        content: "",
                        id: "assistant-1",
                        role: "assistant",
                        toolCalls: [
                            {
                                id: "call-1",
                                input: { destination: "CGK" },
                                output: { rows: 2 },
                                startedAt: "1970-01-01T00:00:00.000Z",
                                state: "success",
                                toolName: "searchTariffs",
                            },
                        ],
                    },
                ]}
            />
        );

        expect(markup).toContain("searchTariffs");
        expect(markup).not.toContain("Working...");
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
