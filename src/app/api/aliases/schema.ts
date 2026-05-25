import * as z from "zod";

import { aliasTypes } from "#/server/db/schema";

export const aliasRequestSchema = z.object({
    alias: z.string().trim().min(1),
    canonicalValue: z.string().trim().min(1),
    isAmbiguous: z.boolean().default(false),
    metadata: z.unknown().optional(),
    type: z.enum(aliasTypes),
});
