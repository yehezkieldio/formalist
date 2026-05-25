import { createHash } from "node:crypto";
import type { Readable } from "node:stream";

export function checksumBuffer(buffer: Buffer | Uint8Array): string {
    return createHash("sha256").update(buffer).digest("hex");
}

export async function checksumStream(stream: Readable): Promise<string> {
    const hash = createHash("sha256");

    for await (const chunk of stream) {
        hash.update(chunk);
    }

    return hash.digest("hex");
}
