import type { MetadataRoute } from "next";
import { SITE_URL, SITE_INDEXABLE } from "@/lib/site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    // Test routes remain crawlable so Google can observe their noindex directive.
    rules: { userAgent: "*", allow: "/", disallow: ['/api/'] },
    ...(SITE_INDEXABLE ? { sitemap: `${SITE_URL}/sitemap.xml` } : {}),
  };
}
