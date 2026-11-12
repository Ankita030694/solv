import type { MetadataRoute } from "next";
import { INSIGHT_ARTICLES } from "@/data/insights";
import { getBlogs } from "@/lib/services/blogsService";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://solvpartners.in";

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/insights`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/contactus`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/real-estate`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/corporate-advisory`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/litigation-management`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/family-legacy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  const seenSlugs = new Set<string>();
  const insightRoutes: MetadataRoute.Sitemap = [];

  try {
    const { blogs } = await getBlogs();
    for (const blog of blogs) {
      if (!blog.slug || seenSlugs.has(blog.slug)) continue;
      seenSlugs.add(blog.slug);
      insightRoutes.push({
        url: `${baseUrl}/insights/${blog.slug}`,
        lastModified: blog.updatedAt ? new Date(blog.updatedAt) : new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  } catch (err) {
    console.error("Failed to load Firestore blogs for sitemap:", err);
  }

  for (const article of INSIGHT_ARTICLES) {
    if (seenSlugs.has(article.slug)) continue;
    seenSlugs.add(article.slug);
    insightRoutes.push({
      url: `${baseUrl}/insights/${article.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }

  return [...staticRoutes, ...insightRoutes];
}
