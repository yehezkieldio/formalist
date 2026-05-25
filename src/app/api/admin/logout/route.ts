import { NextResponse } from "next/server";

import { env } from "#/env";
import {
    adminSessionCookieName,
    adminSessionCookieOptions,
} from "#/server/auth/admin-session";

export function POST(request: Request) {
    const response = NextResponse.redirect(
        new URL("/admin/login", request.url),
        {
            status: 303,
        }
    );

    response.cookies.set(adminSessionCookieName, "", {
        ...adminSessionCookieOptions({ nodeEnv: env.NODE_ENV }),
        maxAge: 0,
    });

    return response;
}
