import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  images: {
    // Imagens podem ser locais (/public, /api/uploads) ou URLs externas
    // informadas no painel (CDN do cliente). Lista cobre qualquer host https
    // — necessário porque o admin pode cadastrar novas fontes em runtime.
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
};

export default nextConfig;
