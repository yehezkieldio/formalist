import { createHmac, timingSafeEqual } from "node:crypto";

export const adminSessionCookieName = "formalist_admin_session";
const sessionTtlSeconds = 60 * 60 * 12;

export interface AdminSessionPayload {
    actor: "admin";
    expiresAt: number;
    issuedAt: number;
}

export interface AdminSessionConfig {
    adminPassword?: string;
    nodeEnv?: string;
    sessionSecret?: string;
}

function encode(value: unknown): string {
    return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function decode<T>(value: string): T {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf-8")) as T;
}

function sign(value: string, secret: string): string {
    return createHmac("sha256", secret).update(value).digest("base64url");
}

function hasConfiguredAuth(config: AdminSessionConfig): boolean {
    return Boolean(config.adminPassword && config.sessionSecret);
}

function safeEqual(left: string, right: string): boolean {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);

    if (leftBuffer.length !== rightBuffer.length) {
        return false;
    }

    return timingSafeEqual(leftBuffer, rightBuffer);
}

export function verifyAdminPassword(
    password: string,
    config: AdminSessionConfig
): boolean {
    if (!hasConfiguredAuth(config)) {
        return false;
    }

    return safeEqual(password, config.adminPassword as string);
}

export function createAdminSession(
    config: AdminSessionConfig,
    now = new Date()
): string {
    if (!config.sessionSecret) {
        throw new Error("SESSION_SECRET is required for admin sessions.");
    }

    const issuedAt = Math.floor(now.getTime() / 1000);
    const payload: AdminSessionPayload = {
        actor: "admin",
        expiresAt: issuedAt + sessionTtlSeconds,
        issuedAt,
    };
    const encodedPayload = encode(payload);
    const signature = sign(encodedPayload, config.sessionSecret);

    return `${encodedPayload}.${signature}`;
}

export function verifyAdminSession(
    token: string | undefined,
    config: AdminSessionConfig,
    now = new Date()
): AdminSessionPayload | undefined {
    if (!token || !config.sessionSecret) {
        return;
    }

    const [encodedPayload, signature] = token.split(".");

    if (!encodedPayload || !signature) {
        return;
    }

    const expectedSignature = sign(encodedPayload, config.sessionSecret);

    if (!safeEqual(signature, expectedSignature)) {
        return;
    }

    const payload = decode<AdminSessionPayload>(encodedPayload);
    const nowSeconds = Math.floor(now.getTime() / 1000);

    if (payload.actor !== "admin" || payload.expiresAt <= nowSeconds) {
        return;
    }

    return payload;
}

export function adminSessionCookieOptions(config: AdminSessionConfig) {
    return {
        httpOnly: true,
        maxAge: sessionTtlSeconds,
        path: "/",
        sameSite: "lax" as const,
        secure: config.nodeEnv === "production",
    };
}
