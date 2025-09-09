import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "scontent-iad4-1.choicecdn.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.choicecdn.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "magic.decentralized-content.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.zora.co",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "github.com",
        port: "",
        pathname: "/**",
      }
    ],
  },
};

export default nextConfig;
