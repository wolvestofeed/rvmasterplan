import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard/", "/admin/", "/api/", "/renew/", "/welcome/", "/unsubscribe/"],
    },
    sitemap: "https://rvmasterplan.app/sitemap.xml",
  };
}
