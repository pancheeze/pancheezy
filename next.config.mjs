import path from "node:path";
import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pin the project root (a stray package-lock.json higher up confuses detection).
  turbopack: {
    root: path.dirname(fileURLToPath(import.meta.url)),
  },
  images: {
    formats: ["image/avif", "image/webp"],
    // SVGs are served as-is (`unoptimized`), never through the image optimizer.
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error"] } : false,
  },
};

export default nextConfig;
