import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { NextConfig } from "next";

let version = "0.0.0";
try {
    const pkgPath = join(process.cwd(), "package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as {
        version?: string;
    };
    version = pkg.version || "0.0.0";
} catch {
    // fallback
}

let gitHash = "unknown";
try {
    gitHash = execSync("git rev-parse --short HEAD").toString().trim();
} catch {
    // fallback
}

const nextConfig: NextConfig = {
    allowedDevOrigins: ["192.168.137.2"],
    env: {
        NEXT_PUBLIC_APP_VERSION: version,
        NEXT_PUBLIC_GIT_COMMIT_HASH: gitHash,
    },
    output: "standalone",
    reactCompiler: true,
};

export default nextConfig;
