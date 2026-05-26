import { describe, expect, it } from "vitest";

describe("admin auth route flow", () => {
    it("rejects invalid login credentials", async () => {
        process.env.ADMIN_PASSWORD = "admin-pass";
        process.env.SESSION_SECRET = "session-secret-with-enough-entropy";

        const { POST } = await import("#/app/api/admin/login/route");
        const response = await POST(
            new Request("http://localhost/api/admin/login", {
                body: JSON.stringify({ password: "wrong" }),
                headers: { "content-type": "application/json" },
                method: "POST",
            })
        );

        expect(response.status).toBe(401);
    });

    it("sets and clears the admin session cookie", async () => {
        process.env.ADMIN_PASSWORD = "admin-pass";
        process.env.SESSION_SECRET = "session-secret-with-enough-entropy";

        const loginRoute = await import("#/app/api/admin/login/route");
        const logoutRoute = await import("#/app/api/admin/logout/route");

        const loginResponse = await loginRoute.POST(
            new Request("http://localhost/api/admin/login", {
                body: JSON.stringify({ password: "admin-pass" }),
                headers: { "content-type": "application/json" },
                method: "POST",
            })
        );

        expect(loginResponse.status).toBe(303);
        expect(loginResponse.headers.get("set-cookie")).toContain(
            "formalist_admin_session="
        );

        const logoutResponse = logoutRoute.POST(
            new Request("http://localhost/api/admin/logout", {
                method: "POST",
            })
        );

        expect(logoutResponse.status).toBe(303);
        expect(logoutResponse.headers.get("set-cookie")).toContain("Max-Age=0");
    });
});
