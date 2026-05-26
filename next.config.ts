import type { NextConfig } from "next";
import { execSync } from "child_process";
import { readFileSync } from "fs";
import { join } from "path";

let version = "0.0.0";
try {
    const pkgPath = join(process.cwd(), "package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as {
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
    env: {
        NEXT_PUBLIC_APP_VERSION: version,
        NEXT_PUBLIC_GIT_COMMIT_HASH: gitHash,
    },
    output: "standalone",
    reactCompiler: true,
};

export default nextConfig;
