import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { MessageList } from "#/components/ai/message-list";
import { PromptComposer } from "#/components/ai/prompt-composer";

const unexpectedSubmit = () => {
    throw new Error("Prompt composer submit should not run during render.");
};

describe("chat UI components", () => {
    it("renders assistant tool calls and source evidence without confidence badges", () => {
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

        expect(markup).not.toContain("Confident");
        expect(markup).toContain("searchTariffs");
        expect(markup).toContain("Pelita pricelist page 2");
    });

    it("renders tariff answer metadata as a structured result panel", () => {
        const markup = renderToStaticMarkup(
            <MessageList
                messages={[
                    {
                        content:
                            "Tarif aktif Garuda / Citilink ke JAKARTA tersedia dari Rp 17.300/kg.",
                        id: "assistant-1",
                        metadata: {
                            tariffAnswer: {
                                airline: "Garuda / Citilink",
                                destination: "JAKARTA",
                                rows: [
                                    {
                                        airline: "Garuda / Citilink",
                                        destinationCity: "JAKARTA",
                                        destinationCode: "CGK",
                                        documentId:
                                            "46c10b9f-ca6a-4246-a22c-970d510e5069",
                                        isPromo: false,
                                        originCity: "origin tidak tercatat",
                                        pageNumber: 1,
                                        routeType: "DIRECT",
                                        smuPricePerKg: 17_300,
                                        transitRoute: null,
                                    },
                                ],
                            },
                        },
                        role: "assistant",
                    },
                ]}
            />
        );

        expect(markup).toContain("Tarif aktif");
        expect(markup).toContain("Garuda / Citilink");
        expect(markup).toContain("Rp 17.300/kg");
        expect(markup).toContain("origin tidak tercatat");
        expect(markup).toContain("tersedia dari Rp");
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
