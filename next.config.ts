import type { NextConfig } from "next";

if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith("postgresql://")) {
  process.env.DATABASE_URL = "postgresql://postgres.vdbrdgheycebtgxavpst:sayankarmakar159%40gmail.com@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true";
}
if (process.env.DIRECT_URL && !process.env.DIRECT_URL.startsWith("postgresql://")) {
  process.env.DIRECT_URL = "postgresql://postgres.vdbrdgheycebtgxavpst:sayankarmakar159%40gmail.com@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres";
}

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  compress: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "pub-064092c35db54f89beea391363a73a8e.r2.dev" },
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "i.pravatar.cc" },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
  headers: async () => [
    {
      source: "/_next/static/:path*",
      headers: [
        { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        { key: "X-Content-Type-Options", value: "nosniff" },
      ],
    },
    {
      source: "/_next/static/:path*/:file.(woff|woff2|ttf|otf|eot)",
      headers: [
        { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        { key: "X-Content-Type-Options", value: "nosniff" },
      ],
    },
    {
      source: "/_next/image",
      headers: [
        { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        { key: "X-Content-Type-Options", value: "nosniff" },
      ],
    },
    {
      source: "/api/:path*",
      headers: [
        { key: "Access-Control-Allow-Origin", value: "*" },
        { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, OPTIONS" },
        { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
      ],
    },
  ],
  allowedDevOrigins: [
    "localhost",
    ".space-z.ai",
    ".z.ai",
    "preview-chat-900d3c0a-ed11-4efc-9561-1c70c4fb2190.space-z.ai",
  ],
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ["framer-motion", "lucide-react", "recharts", "date-fns"],
  },
};

export default nextConfig;
