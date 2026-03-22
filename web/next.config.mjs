/** GitHub Pages 项目页需设置 NEXT_PUBLIC_BASE_PATH=/仓库名；本地开发勿设 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: { unoptimized: true },
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
  trailingSlash: true,
  transpilePackages: ["@xenova/transformers"],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "onnxruntime-node": false,
    };
    return config;
  },
};

export default nextConfig;
