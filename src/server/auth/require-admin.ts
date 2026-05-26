import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { env } from "#/env";
import {
    adminSessionCookieName,
    verifyAdminSession,
} from "#/server/auth/admin-session";

export async function getAdminSessionFromCookies() {
    const cookieStore = await cookies();
    const token = cookieStore.get(adminSessionCookieName)?.value;

    return verifyAdminSession(token, {
        sessionSecret: env.SESSION_SECRET,
    });
}

export async function requireAdmin() {
    const session = await getAdminSessionFromCookies();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
}
