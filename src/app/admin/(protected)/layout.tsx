import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AdminShell } from "#/components/admin/admin-shell";
import { getAdminSessionFromCookies } from "#/server/auth/require-admin";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({
    children,
}: Readonly<{ children: ReactNode }>) {
    const session = await getAdminSessionFromCookies();

    if (!session) {
        redirect("/admin/login");
    }

    return <AdminShell>{children}</AdminShell>;
}
