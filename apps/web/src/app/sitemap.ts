import type { MetadataRoute } from "next";
import { PRODUCT_IDS } from "@/lib/catalog";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://stayflow-web-livid.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE}/`, changeFrequency: "weekly", priority: 1 },
    ...PRODUCT_IDS.map((id) => ({ url: `${SITE}/products/${id}`, changeFrequency: "monthly" as const, priority: 0.8 })),
  ];
}
