import { createOpenRouter } from "@openrouter/ai-sdk-provider";

import { env } from "#/env";

export type AiProviderState =
    | {
          openrouter: ReturnType<typeof createOpenRouter>;
          status: "ready";
      }
    | {
          reason: string;
          status: "setup-required";
      };

export function getOpenRouterProvider(): AiProviderState {
    if (!env.OPENROUTER_API_KEY) {
        return {
            reason: "OPENROUTER_API_KEY is not configured.",
            status: "setup-required",
        };
    }

    return {
        openrouter: createOpenRouter({
            apiKey: env.OPENROUTER_API_KEY,
            appName: env.OPENROUTER_APP_NAME,
            appUrl: env.OPENROUTER_SITE_URL,
            compatibility: "compatible",
        }),
        status: "ready",
    };
}
