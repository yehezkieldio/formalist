import { describe, expect, it } from "vitest";

import {
    adminSessionCookieOptions,
    createAdminSession,
    verifyAdminPassword,
    verifyAdminSession,
} from "#/server/auth/admin-session";

const config = {
    adminPassword: "correct-password",
    nodeEnv: "test",
    sessionSecret: "test-secret-with-enough-entropy",
};

describe("admin sessions", () => {
    it("verifies the configured admin password", () => {
        expect(verifyAdminPassword("correct-password", config)).toBe(true);
        expect(verifyAdminPassword("wrong-password", config)).toBe(false);
    });

    it("does not authenticate when auth is not configured", () => {
        expect(verifyAdminPassword("correct-password", {})).toBe(false);
    });

    it("creates and verifies a signed admin session", () => {
        const now = new Date("2026-05-25T00:00:00.000Z");
        const token = createAdminSession(config, now);
        const session = verifyAdminSession(token, config, now);

        expect(session).toMatchObject({
            actor: "admin",
            issuedAt: Math.floor(now.getTime() / 1000),
        });
    });

    it("rejects tampered sessions", () => {
        const token = createAdminSession(config);
        const [payload] = token.split(".");
        const tampered = `${payload}.bad`;

        expect(verifyAdminSession(tampered, config)).toBeUndefined();
    });

    it("rejects expired sessions", () => {
        const now = new Date("2026-05-25T00:00:00.000Z");
        const token = createAdminSession(config, now);
        const later = new Date("2026-05-26T00:00:00.000Z");

        expect(verifyAdminSession(token, config, later)).toBeUndefined();
    });

    it("uses secure cookies only in production", () => {
        expect(adminSessionCookieOptions({ nodeEnv: "test" })).toMatchObject({
            httpOnly: true,
            path: "/",
            sameSite: "lax",
            secure: false,
        });
        expect(
            adminSessionCookieOptions({ nodeEnv: "production" }).secure
        ).toBe(true);
    });
});
