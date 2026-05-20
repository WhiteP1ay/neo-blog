import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 启用 standalone 输出模式，用于 Docker 部署
  output: 'standalone',
  async redirects() {
    return [
      { source: '/search', destination: '/', permanent: true },
      { source: '/en/search', destination: '/en', permanent: true },
    ];
  },
  // 配置允许的外部图片域名
  images: {
    // 允许所有外部图片域名（用于专题封面图等）
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'phzdoc.oss-cn-beijing.aliyuncs.com',
      },
    ],
  },
};

export default nextConfig;
