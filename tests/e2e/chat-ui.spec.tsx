import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { MessageList } from "#/components/ai/message-list";
import { PromptComposer } from "#/components/ai/prompt-composer";
import { ThemeToggle } from "#/components/theme-toggle";

describe("chat UI browser-facing coverage", () => {
    it("renders responsive chat chrome, examples, confidence, and dark-mode controls", () => {
        const markup = renderToStaticMarkup(
            <>
                <MessageList
                    messages={[
                        {
                            content: "**Harga** reviewed aktif.",
                            id: "assistant-1",
                            role: "assistant",
                            verification: {
                                confidenceState: "CONFIDENT",
                                mode: "verified_numeric",
                            },
                        },
                    ]}
                />
                <PromptComposer disabled onSubmit={() => {}} />
                <ThemeToggle />
            </>
        );

        expect(markup).toContain("Confident");
        expect(markup).toContain("Harga");
        expect(markup).toContain("Send message");
        expect(markup).toContain("Toggle theme");
    });
});
