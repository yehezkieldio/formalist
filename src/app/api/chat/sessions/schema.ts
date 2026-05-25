import * as z from "zod";

export const createSessionSchema = z.object({
    title: z.string().trim().min(1).optional(),
});

export const renameSessionSchema = z.object({
    title: z.string().trim().min(1),
});

export const createMessageSchema = z.object({
    content: z.string(),
    metadata: z.unknown().optional(),
    parts: z.unknown().optional(),
    role: z.enum(["user", "assistant", "system", "tool"]),
});
