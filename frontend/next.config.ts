import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["localhost", "127.0.0.1", "10.200.9.226", "10.132.115.226"],
  async redirects() {
    return [
      {
        source: "/doctor/login",
        destination: "/staff-login",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
