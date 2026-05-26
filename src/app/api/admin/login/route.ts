import { NextResponse } from "next/server";

import { env } from "#/env";
import {
    adminSessionCookieName,
    adminSessionCookieOptions,
    createAdminSession,
    verifyAdminPassword,
} from "#/server/auth/admin-session";

async function readPassword(request: Request): Promise<string> {
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
        const body = (await request.json()) as { password?: unknown };

        return typeof body.password === "string" ? body.password : "";
    }

    const formData = await request.formData();
    const password = formData.get("password");

    return typeof password === "string" ? password : "";
}

export async function POST(request: Request) {
    const password = await readPassword(request);
    const config = {
        adminPassword: env.ADMIN_PASSWORD,
        nodeEnv: env.NODE_ENV,
        sessionSecret: env.SESSION_SECRET,
    };

    if (!verifyAdminPassword(password, config)) {
        return NextResponse.json(
            { error: "Invalid admin password." },
            { status: 401 }
        );
    }

    const token = createAdminSession(config);
    const response = NextResponse.redirect(new URL("/admin", request.url), {
        status: 303,
    });

    response.cookies.set(
        adminSessionCookieName,
        token,
        adminSessionCookieOptions(config)
    );

    return response;
}
