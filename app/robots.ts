import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://whitemeta.cn'

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/login/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
