"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { getBlogs } from "@/lib/services/blogsService";
import { getCategories } from "@/lib/services/categoriesService";
import { calculateReadTime, stripHtml } from "@/lib/seo-utils";
import type { InsightArticle } from "@/data/insights";

interface DisplayInsight {
  id: string;
  slug: string;
  title: string;
  category: string;
  date: string;
  readTime: string;
  excerpt: string;
  imageSrc: string;
  featured?: boolean;
}

function formatDisplayDate(raw: string): string {
  if (!raw) return "";
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function mapStaticToDisplay(article: InsightArticle): DisplayInsight {
  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    category: article.category,
    date: article.date,
    readTime: article.readTime,
    excerpt: article.lead,
    imageSrc: article.imageSrc || "/about_hero_office.jpg",
    featured: false,
  };
}

export default function InsightsGrid({
  staticArticles,
}: {
  staticArticles: InsightArticle[];
}) {
  const [firestoreArticles, setFirestoreArticles] = useState<DisplayInsight[]>([]);
  const [dbCategoryNames, setDbCategoryNames] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [loadingDynamic, setLoadingDynamic] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    async function loadPublished() {
      try {
        const [{ blogs }, dbCats] = await Promise.all([
          getBlogs(),
          getCategories(),
        ]);
        if (!active) return;

        const mapped: DisplayInsight[] = blogs.map((b) => {
          const excerptSource =
            b.subtitle?.trim() || stripHtml(b.description || "");
          return {
            id: b.id || b.slug,
            slug: b.slug,
            title: b.title,
            category: b.category || "Advisory",
            date: formatDisplayDate(b.publishDate),
            readTime: b.readTime || calculateReadTime(b.description || ""),
            excerpt:
              excerptSource.length > 220
                ? `${excerptSource.slice(0, 217)}...`
                : excerptSource,
            imageSrc: b.coverImage || "/about_hero_office.jpg",
            featured: Boolean(b.featured),
          };
        });
        setFirestoreArticles(mapped);
        setDbCategoryNames(dbCats.map((c) => c.name));
      } catch (err) {
        console.error("Failed to fetch dynamic insights:", err);
      } finally {
        if (active) setLoadingDynamic(false);
      }
    }
    loadPublished();
    return () => {
      active = false;
    };
  }, []);

  // Dynamically serve Firestore blogs once populated; fall back to static editorial data only when empty
  const allArticles = useMemo(() => {
    if (firestoreArticles.length > 0) {
      return firestoreArticles;
    }
    return staticArticles.map(mapStaticToDisplay);
  }, [firestoreArticles, staticArticles]);

  // Dynamically combine Firestore categories with active article categories
  const categories = useMemo(() => {
    const activeCats = new Set(allArticles.map((a) => a.category).filter(Boolean));
    const ordered: string[] = [];
    const seen = new Set<string>();

    // Preserve dynamic DB categories that currently have articles, or all DB categories
    for (const catName of dbCategoryNames) {
      const lower = catName.toLowerCase();
      if (!seen.has(lower) && activeCats.has(catName)) {
        seen.add(lower);
        ordered.push(catName);
      }
    }
    for (const a of allArticles) {
      if (!a.category) continue;
      const lower = a.category.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        ordered.push(a.category);
      }
    }
    return ["All", ...ordered];
  }, [allArticles, dbCategoryNames]);

  const visibleArticles = useMemo(() => {
    if (selectedCategory === "All") return allArticles;
    return allArticles.filter(
      (a) => a.category.toLowerCase() === selectedCategory.toLowerCase()
    );
  }, [allArticles, selectedCategory]);

  return (
    <div>
      {/* Category Filter Pills */}
      {categories.length > 2 && (
        <div className="flex flex-wrap items-center gap-2 mb-10">
          {categories.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-sans uppercase tracking-wider transition-all border cursor-pointer ${
                  active
                    ? "bg-[#C89949] text-[#071A2E] border-[#C89949] font-semibold shadow-md shadow-[#C89949]/15"
                    : "bg-[#0a233d]/65 text-[#E9E8E3]/80 border-[#B7873A]/25 hover:border-[#C89949]/50 hover:text-white"
                }`}
              >
                {cat}
              </button>
            );
          })}
          {loadingDynamic && (
            <span className="ml-2 text-xs text-[#E9E8E3]/45">
              Syncing latest publications...
            </span>
          )}
        </div>
      )}

      {/* 3-Column Editorial Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
        {visibleArticles.map((article) => (
          <article
            key={article.id}
            className="flex flex-col justify-between group bg-[#0a233d]/65 backdrop-blur-md rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-[#B7873A]/25 hover:border-[#C89949]/50 transition-all duration-300 shadow-xl shadow-black/25 hover:shadow-[#C89949]/10"
          >
            <div>
              {/* Image Banner */}
              <Link href={`/insights/${article.slug}`} className="block">
                <div className="relative w-full aspect-[16/10] rounded-xl sm:rounded-2xl overflow-hidden mb-5 bg-[#071A2E] border border-white/10 shadow-sm">
                  <Image
                    src={article.imageSrc}
                    alt={article.title}
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#071A2E]/60 via-transparent to-transparent pointer-events-none" />
                  {article.featured && (
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#C89949] text-[#071A2E] text-[10px] font-semibold uppercase tracking-wider shadow">
                      Featured
                    </span>
                  )}
                </div>
              </Link>

              {/* Category & Date Row */}
              <div className="flex items-center gap-2.5 text-xs text-[#E9E8E3]/75 mb-3 font-sans">
                <span className="px-2.5 py-1 rounded-md bg-[#071A2E]/90 border border-[#B7873A]/30 text-[#E0B669] font-medium text-[11px] uppercase tracking-wider">
                  {article.category}
                </span>
                {article.date && (
                  <>
                    <span className="text-white/30">•</span>
                    <span className="text-[#E9E8E3]/70">{article.date}</span>
                  </>
                )}
              </div>

              {/* Article Title */}
              <h2 className="text-xl sm:text-[22px] font-normal leading-[1.25] text-[#FFFFFF] font-heading mb-3 group-hover:text-[#E0B669] transition-colors">
                <Link
                  href={`/insights/${article.slug}`}
                  className="hover:underline decoration-[#C89949]/50 underline-offset-4"
                >
                  {article.title}
                </Link>
              </h2>

              {/* Excerpt */}
              <p className="text-sm text-[#E9E8E3]/75 leading-relaxed mb-6 line-clamp-3">
                {article.excerpt}
              </p>
            </div>

            {/* Bottom Row: Read Time & Arrow Button */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-auto">
              <span className="text-xs text-[#E9E8E3]/60 font-medium">
                {article.readTime}
              </span>

              <Link
                href={`/insights/${article.slug}`}
                className="w-10 h-10 rounded-full border border-[#B7873A]/30 bg-[#071A2E]/80 flex items-center justify-center text-[#E0B669] group-hover:bg-[#C89949] group-hover:text-[#071A2E] group-hover:border-[#C89949] transition-all duration-200 shadow-md"
                aria-label={`Read article: ${article.title}`}
              >
                <HugeiconsIcon
                  icon={ArrowUpRight01Icon}
                  size={16}
                  strokeWidth={2}
                  className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
