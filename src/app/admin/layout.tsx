import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { getAdminSessionFromCookies } from "#/server/auth/require-admin";

export const dynamic = "force-dynamic";

async function isLoginRoute() {
    const headerList = await headers();
    const pathname =
        headerList.get("x-next-url") ??
        headerList.get("x-matched-path") ??
        headerList.get("next-url") ??
        "";

    return pathname.endsWith("/admin/login");
}

export default async function AdminLayout({
    children,
}: Readonly<{ children: ReactNode }>) {
    const session = await getAdminSessionFromCookies();

    if (!session && !(await isLoginRoute())) {
        redirect("/admin/login");
    }

    return (
        <main className="min-h-dvh bg-background text-foreground">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-6 sm:px-8">
                {children}
            </div>
        </main>
    );
}
