import { INSIGHT_ARTICLES, type InsightArticle } from "@/data/insights";
import { createBlog, getBlogs } from "@/lib/services/blogsService";
import { seedCategoriesFromNames } from "@/lib/services/categoriesService";
import {
  calibrateMetaDescription,
  calibrateMetaTitle,
} from "@/lib/seo-utils";
import { SOLV_BLOG_CATEGORIES } from "@/lib/constants/admin";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function parsePublishDateToIso(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().split("T")[0];
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString().split("T")[0];
  }
  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, "0");
  const d = String(parsed.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function convertInsightToHtml(article: InsightArticle): string {
  const parts: string[] = [];

  if (article.keyTakeaways && article.keyTakeaways.length > 0) {
    parts.push("<h2>Executive Summary &amp; Key Takeaways</h2>");
    const items = article.keyTakeaways
      .map((item) => `<li><p>${escapeHtml(item)}</p></li>`)
      .join("");
    parts.push(`<ul>${items}</ul>`);
  }

  for (const section of article.sections) {
    parts.push(`<h2>${escapeHtml(section.heading)}</h2>`);
    for (const para of section.body) {
      parts.push(`<p>${escapeHtml(para)}</p>`);
    }
  }

  if (article.quote) {
    parts.push(
      `<blockquote><p>&ldquo;${escapeHtml(article.quote.text)}&rdquo;</p><p><strong>&mdash; ${escapeHtml(article.quote.attribution)}</strong></p></blockquote>`
    );
  }

  return parts.join("\n");
}

export interface SeedInsightsResult {
  importedCount: number;
  skippedCount: number;
  categoriesSeeded: number;
}

/**
 * Idempotently imports all articles from `INSIGHT_ARTICLES` into Firestore `blogs`
 * and seeds all blog categories into `blogCategories`.
 */
export async function importStaticInsightsToFirestore(): Promise<SeedInsightsResult> {
  const allCategoryNames = Array.from(
    new Set<string>([
      ...SOLV_BLOG_CATEGORIES,
      ...INSIGHT_ARTICLES.map((a) => a.category),
    ])
  );
  const categoriesSeeded = await seedCategoriesFromNames(allCategoryNames);

  const { blogs: existingBlogs } = await getBlogs();
  const existingSlugs = new Set(
    existingBlogs.map((b) => b.slug.trim().toLowerCase())
  );

  let importedCount = 0;
  let skippedCount = 0;

  for (const article of INSIGHT_ARTICLES) {
    const normalizedSlug = article.slug.trim().toLowerCase();
    if (existingSlugs.has(normalizedSlug)) {
      skippedCount++;
      continue;
    }

    const htmlBody = convertInsightToHtml(article);
    await createBlog({
      title: article.title,
      subtitle: article.lead,
      slug: normalizedSlug,
      category: article.category,
      publishDate: parsePublishDateToIso(article.date),
      authorName: article.author.name,
      authorRole: article.author.role,
      authorAvatar: "",
      coverImage: article.imageSrc,
      description: htmlBody,
      metaTitle: calibrateMetaTitle(article.title),
      metaDescription: calibrateMetaDescription(article.lead, article.title),
      featured: article.id === "1" || article.id === "4",
      readTime: article.readTime,
    });

    existingSlugs.add(normalizedSlug);
    importedCount++;
  }

  return { importedCount, skippedCount, categoriesSeeded };
}

