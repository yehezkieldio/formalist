import { Readable } from "node:stream";

import { describe, expect, it } from "vitest";

import { checksumBuffer, checksumStream } from "#/server/storage/checksum";

describe("checksums", () => {
    it("creates stable SHA-256 checksums for buffers", () => {
        expect(checksumBuffer(Buffer.from("formalist"))).toBe(
            "9d6ce5201dca38d8861b6d13ccb6a2f105ed1516f9bb94ae8e37000dcc61cf56"
        );
    });

    it("creates stable SHA-256 checksums for streams", async () => {
        const stream = Readable.from([
            Buffer.from("formal"),
            Buffer.from("ist"),
        ]);

        await expect(checksumStream(stream)).resolves.toBe(
            "9d6ce5201dca38d8861b6d13ccb6a2f105ed1516f9bb94ae8e37000dcc61cf56"
        );
    });
});
