import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    serverExternalPackages: ["pg"],
    transpilePackages: ["@centinela/contracts"],
};

export default nextConfig;
