import React, { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import Navbar from "@/app/component/nav";
import Footer from "@/app/component/footer";
import CTASection from "@/app/component/cta";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons";
import { INSIGHT_ARTICLES } from "@/data/insights";
import { getBlogBySlug, getBlogs } from "@/lib/services/blogsService";
import {
  calculateReadTime,
  calibrateMetaDescription,
  calibrateMetaTitle,
  cleanInternalNofollow,
  stripHtml,
} from "@/lib/seo-utils";
import type { BlogPost } from "@/lib/types/blog";
import {
  ArticleFAQsSection,
  ArticleReviewsSection,
  ArticleShareButton,
} from "./DynamicArticleClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const instant = false;

function formatPublishDate(raw: string): string {
  if (!raw) return "";
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export async function generateStaticParams() {
  return INSIGHT_ARTICLES.map((article) => ({
    slug: article.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  const staticArticle = INSIGHT_ARTICLES.find((a) => a.slug === slug);
  if (staticArticle) {
    const pageUrl = `https://solvpartners.in/insights/${staticArticle.slug}`;
    return {
      title: `${staticArticle.title} | SOLV Insights`,
      description: staticArticle.lead,
      keywords: [
        staticArticle.category,
        "SOLV Insights",
        "Strategic Advisory",
        "Commercial Advisory",
        "Corporate Insights India",
        staticArticle.title,
      ],
      alternates: {
        canonical: `/insights/${staticArticle.slug}`,
      },
      openGraph: {
        title: staticArticle.title,
        description: staticArticle.lead,
        url: pageUrl,
        siteName: "SOLV",
        images: [
          {
            url: staticArticle.imageSrc,
            width: 1200,
            height: 630,
            alt: staticArticle.title,
          },
        ],
        locale: "en_IN",
        type: "article",
        publishedTime: staticArticle.date,
        authors: [staticArticle.author.name],
      },
      twitter: {
        card: "summary_large_image",
        title: staticArticle.title,
        description: staticArticle.lead,
        images: [staticArticle.imageSrc],
      },
    };
  }

  let dynamicBlog: BlogPost | null = null;
  try {
    dynamicBlog = await getBlogBySlug(slug);
  } catch (err) {
    console.error("generateMetadata getBlogBySlug failed:", err);
  }

  if (dynamicBlog) {
    const pageUrl = `https://solvpartners.in/insights/${dynamicBlog.slug}`;
    const metaTitle = dynamicBlog.metaTitle?.trim()
      ? dynamicBlog.metaTitle.trim()
      : calibrateMetaTitle(dynamicBlog.title);
    const rawDesc =
      dynamicBlog.metaDescription?.trim() ||
      dynamicBlog.subtitle?.trim() ||
      stripHtml(dynamicBlog.description || "");
    const metaDesc = calibrateMetaDescription(rawDesc, dynamicBlog.title);
    const ogImage = dynamicBlog.coverImage || "/about_hero_office.jpg";

    return {
      title: metaTitle,
      description: metaDesc,
      keywords: [
        dynamicBlog.category,
        "SOLV Insights",
        "Strategic Advisory",
        "Corporate Insights India",
        dynamicBlog.title,
      ],
      alternates: {
        canonical: `/insights/${dynamicBlog.slug}`,
      },
      openGraph: {
        title: dynamicBlog.title,
        description: metaDesc,
        url: pageUrl,
        siteName: "SOLV",
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: dynamicBlog.title,
          },
        ],
        locale: "en_IN",
        type: "article",
        publishedTime: dynamicBlog.publishDate,
        authors: [dynamicBlog.authorName || "SOLV Advisory"],
      },
      twitter: {
        card: "summary_large_image",
        title: dynamicBlog.title,
        description: metaDesc,
        images: [ogImage],
      },
    };
  }

  return {
    title: "Article Not Found | SOLV",
    description: "The requested insight article could not be found.",
  };
}

function ArticleLoadingSkeleton() {
  return (
    <main className="flex-1 w-full pt-32 sm:pt-40 lg:pt-44 pb-20 sm:pb-28">
      <div className="max-w-4xl mx-auto px-6 sm:px-10 animate-pulse space-y-6">
        <div className="h-4 w-48 bg-white/10 rounded" />
        <div className="h-12 w-3/4 bg-white/10 rounded-xl" />
        <div className="h-6 w-full bg-white/10 rounded-lg" />
        <div className="aspect-[16/9] w-full bg-[#0a233d] rounded-3xl border border-[#B7873A]/20" />
        <div className="space-y-3 pt-4">
          <div className="h-4 w-full bg-white/10 rounded" />
          <div className="h-4 w-5/6 bg-white/10 rounded" />
          <div className="h-4 w-4/6 bg-white/10 rounded" />
        </div>
      </div>
    </main>
  );
}

interface RelatedItem {
  id: string;
  slug: string;
  title: string;
  category: string;
  readTime: string;
  imageSrc: string;
}

async function getRelatedItems(currentSlug: string): Promise<RelatedItem[]> {
  const seen = new Set<string>([currentSlug]);
  const results: RelatedItem[] = [];

  try {
    const { blogs } = await getBlogs();
    for (const b of blogs) {
      if (!b.slug || seen.has(b.slug)) continue;
      seen.add(b.slug);
      results.push({
        id: b.id || b.slug,
        slug: b.slug,
        title: b.title,
        category: b.category || "Advisory",
        readTime: b.readTime || calculateReadTime(b.description || ""),
        imageSrc: b.coverImage || "/about_hero_office.jpg",
      });
      if (results.length >= 3) return results;
    }
  } catch {
    // Fallback to static articles
  }

  for (const a of INSIGHT_ARTICLES) {
    if (seen.has(a.slug)) continue;
    seen.add(a.slug);
    results.push({
      id: a.id,
      slug: a.slug,
      title: a.title,
      category: a.category,
      readTime: a.readTime,
      imageSrc: a.imageSrc,
    });
    if (results.length >= 3) break;
  }

  return results;
}

async function InsightSlugContent({ params }: { params: Promise<{ slug: string }> }) {
  await connection();
  const { slug } = await params;

  let dynamicBlog: BlogPost | null = null;
  try {
    dynamicBlog = await getBlogBySlug(slug);
  } catch (err) {
    console.error("Failed to load dynamic blog:", err);
  }

  const relatedArticles = await getRelatedItems(slug);

  if (dynamicBlog) {
    const readTime =
      dynamicBlog.readTime || calculateReadTime(dynamicBlog.description || "");
    const displayDate = formatPublishDate(dynamicBlog.publishDate);
    const heroImage = dynamicBlog.coverImage || "/about_hero_office.jpg";
    const processedHtml = cleanInternalNofollow(dynamicBlog.description || "");
    const authorInitial = (dynamicBlog.authorName || "S").charAt(0).toUpperCase();

    const blogJsonLd = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: dynamicBlog.title,
      description:
        dynamicBlog.metaDescription ||
        dynamicBlog.subtitle ||
        stripHtml(dynamicBlog.description || "").slice(0, 160),
      image: heroImage.startsWith("http")
        ? heroImage
        : `https://solvpartners.in${heroImage}`,
      datePublished: dynamicBlog.publishDate,
      dateModified: dynamicBlog.updatedAt || dynamicBlog.publishDate,
      author: {
        "@type": "Person",
        name: dynamicBlog.authorName || "SOLV Strategic Advisory",
      },
      publisher: {
        "@type": "Organization",
        name: "SOLV Strategic Advisory",
        url: "https://solvpartners.in",
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": `https://solvpartners.in/insights/${dynamicBlog.slug}`,
      },
    };

    const faqJsonLd =
      dynamicBlog.faqs && dynamicBlog.faqs.length > 0
        ? {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: dynamicBlog.faqs.map((f) => ({
              "@type": "Question",
              name: f.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: f.answer,
              },
            })),
          }
        : null;

    return (
      <main className="flex-1 w-full pt-32 sm:pt-40 lg:pt-44 pb-20 sm:pb-28">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
        />
        {faqJsonLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
          />
        )}

        {/* Breadcrumbs */}
        <div className="max-w-4xl mx-auto px-6 sm:px-10 mb-8 sm:mb-12">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-[#E9E8E3]/65 font-sans">
            <Link href="/" className="hover:text-[#E0B669] transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/insights" className="hover:text-[#E0B669] transition-colors">
              Insights
            </Link>
            <span>/</span>
            <span className="text-[#E0B669] truncate max-w-[200px] sm:max-w-xs">
              {dynamicBlog.title}
            </span>
          </div>
        </div>

        <article className="max-w-4xl mx-auto px-6 sm:px-10">
          <header className="mb-10 sm:mb-14">
            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-[13px] text-[#E9E8E3]/75 mb-5 font-sans">
              <span className="px-3 py-1 rounded-md bg-[#0a233d] border border-[#B7873A]/40 text-[#E0B669] font-medium uppercase tracking-wider text-[11px]">
                {dynamicBlog.category}
              </span>
              {displayDate && (
                <>
                  <span className="text-white/30">•</span>
                  <span>{displayDate}</span>
                </>
              )}
              <span className="text-white/30">•</span>
              <span>{readTime}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-[56px] font-normal leading-[1.1] tracking-tight text-[#FFFFFF] font-heading mb-6 sm:mb-8">
              {dynamicBlog.title}
            </h1>

            {dynamicBlog.subtitle && (
              <p className="text-lg sm:text-xl lg:text-[22px] leading-relaxed text-[#E9E8E3]/85 font-normal mb-8 pb-8 border-b border-white/10">
                {dynamicBlog.subtitle}
              </p>
            )}

            {/* Author Byline + Share */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-3.5">
                {dynamicBlog.authorAvatar ? (
                  <Image
                    src={dynamicBlog.authorAvatar}
                    alt={dynamicBlog.authorName}
                    width={44}
                    height={44}
                    unoptimized
                    className="w-11 h-11 rounded-full object-cover border border-[#B7873A]/40 shadow-md shrink-0"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-[#0a233d] border border-[#B7873A]/40 flex items-center justify-center text-[#E0B669] font-heading font-semibold text-sm shadow-md shrink-0">
                    {authorInitial}
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-sm sm:text-[15px] font-medium text-white">
                    {dynamicBlog.authorName}
                  </span>
                  <span className="text-xs text-[#E9E8E3]/60">
                    {dynamicBlog.authorRole || "Senior Advisor"} • SOLV Strategic Advisory
                  </span>
                </div>
              </div>

              <ArticleShareButton title={dynamicBlog.title} />
            </div>
          </header>

          {/* Featured Hero Image */}
          <div className="relative w-full aspect-[16/9] rounded-2xl sm:rounded-3xl overflow-hidden mb-12 sm:mb-16 border border-[#B7873A]/25 shadow-2xl bg-[#0a233d]/50">
            <Image
              src={heroImage}
              alt={dynamicBlog.title}
              fill
              priority
              unoptimized
              sizes="(max-width: 1200px) 100vw, 1200px"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#071A2E]/70 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* Rich Text TipTap Content */}
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: processedHtml }}
          />

          {/* Interactive FAQs & Client Reviews */}
          {dynamicBlog.faqs && dynamicBlog.faqs.length > 0 && (
            <ArticleFAQsSection faqs={dynamicBlog.faqs} />
          )}

          {dynamicBlog.reviews && dynamicBlog.reviews.length > 0 && (
            <ArticleReviewsSection reviews={dynamicBlog.reviews} />
          )}

          {/* Back to Insights & Consult CTA */}
          <div className="mt-14 pt-8 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
            <Link
              href="/insights"
              className="inline-flex items-center gap-2 text-sm text-[#E0B669] hover:text-white transition-colors group"
            >
              <HugeiconsIcon
                icon={ArrowLeft01Icon}
                size={16}
                strokeWidth={2}
                className="transition-transform group-hover:-translate-x-1"
              />
              <span>Back to all Insights</span>
            </Link>

            <Link
              href="/contactus"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C89949] hover:bg-[#E0B669] text-[#071A2E] text-xs sm:text-sm font-semibold transition-all shadow-md group"
            >
              <span>Consult on Your Matter</span>
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                size={14}
                strokeWidth={2.5}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          </div>
        </article>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <section className="max-w-8xl mx-auto px-6 sm:px-10 lg:px-12 mt-24 sm:mt-32 pt-16 border-t border-white/10">
            <div className="flex flex-col items-start mb-10">
              <span className="text-xs uppercase tracking-[0.24em] text-[#E0B669] font-medium mb-2">
                MORE PERSPECTIVES
              </span>
              <h2 className="text-2xl sm:text-4xl font-normal text-white font-heading">
                Related Advisory Insights
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {relatedArticles.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/insights/${rel.slug}`}
                  className="group flex flex-col justify-between rounded-2xl border border-[#B7873A]/25 bg-[#0a233d]/60 backdrop-blur-md p-5 hover:border-[#C89949]/50 transition-all duration-300 shadow-lg"
                >
                  <div>
                    <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden mb-4 bg-[#071A2E]">
                      <Image
                        src={rel.imageSrc}
                        alt={rel.title}
                        fill
                        unoptimized
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                      />
                    </div>
                    <div className="text-[11px] uppercase tracking-wider text-[#E0B669] font-medium mb-2">
                      {rel.category}
                    </div>
                    <h3 className="text-lg font-normal text-white font-heading leading-snug group-hover:text-[#E0B669] transition-colors mb-2">
                      {rel.title}
                    </h3>
                  </div>
                  <div className="text-xs text-[#E9E8E3]/60 pt-3 border-t border-white/10 mt-4 flex items-center justify-between">
                    <span>{rel.readTime}</span>
                    <span className="text-[#E0B669] group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    );
  }

  // Fallback: Static editorial article
  const article = INSIGHT_ARTICLES.find((a) => a.slug === slug);

  if (!article) {
    notFound();
  }

  return (
    <main className="flex-1 w-full pt-32 sm:pt-40 lg:pt-44 pb-20 sm:pb-28">
      {/* Breadcrumbs */}
      <div className="max-w-4xl mx-auto px-6 sm:px-10 mb-8 sm:mb-12">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-[#E9E8E3]/65 font-sans">
          <Link href="/" className="hover:text-[#E0B669] transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/insights" className="hover:text-[#E0B669] transition-colors">
            Insights
          </Link>
          <span>/</span>
          <span className="text-[#E0B669] truncate max-w-[200px] sm:max-w-xs">
            {article.title}
          </span>
        </div>
      </div>

      {/* Article Header & Body */}
      <article className="max-w-4xl mx-auto px-6 sm:px-10">
        <header className="mb-10 sm:mb-14">
          <div className="flex items-center gap-3 text-xs sm:text-[13px] text-[#E9E8E3]/75 mb-5 font-sans">
            <span className="px-3 py-1 rounded-md bg-[#0a233d] border border-[#B7873A]/40 text-[#E0B669] font-medium uppercase tracking-wider text-[11px]">
              {article.category}
            </span>
            <span className="text-white/30">•</span>
            <span>{article.date}</span>
            <span className="text-white/30">•</span>
            <span>{article.readTime}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-[56px] font-normal leading-[1.1] tracking-tight text-[#FFFFFF] font-heading mb-6 sm:mb-8">
            {article.title}
          </h1>

          <p className="text-lg sm:text-xl lg:text-[22px] leading-relaxed text-[#E9E8E3]/85 font-normal mb-8 pb-8 border-b border-white/10">
            {article.lead}
          </p>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-full bg-[#0a233d] border border-[#B7873A]/40 flex items-center justify-center text-[#E0B669] font-heading font-semibold text-sm shadow-md shrink-0">
                S
              </div>
              <div className="flex flex-col">
                <span className="text-sm sm:text-[15px] font-medium text-white">
                  {article.author.name}
                </span>
                <span className="text-xs text-[#E9E8E3]/60">
                  {article.author.role} • SOLV Strategic Advisory
                </span>
              </div>
            </div>
            <ArticleShareButton title={article.title} />
          </div>
        </header>

        {/* Featured Hero Image */}
        <div className="relative w-full aspect-[16/9] rounded-2xl sm:rounded-3xl overflow-hidden mb-12 sm:mb-16 border border-[#B7873A]/25 shadow-2xl bg-[#0a233d]/50">
          <Image
            src={article.imageSrc}
            alt={article.title}
            fill
            priority
            unoptimized
            sizes="(max-width: 1200px) 100vw, 1200px"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#071A2E]/70 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Key Takeaways Callout Box */}
        {article.keyTakeaways && article.keyTakeaways.length > 0 && (
          <div className="rounded-2xl border border-[#B7873A]/35 bg-[#0a233d]/70 backdrop-blur-md p-6 sm:p-8 mb-12 sm:mb-16 shadow-xl">
            <h2 className="text-xs sm:text-sm font-sans uppercase tracking-[0.24em] text-[#E0B669] font-semibold mb-4 flex items-center gap-2">
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} />
              <span>EXECUTIVE SUMMARY & KEY TAKEAWAYS</span>
            </h2>
            <ul className="flex flex-col gap-3">
              {article.keyTakeaways.map((takeaway, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 text-sm sm:text-base text-[#E9E8E3]/90 leading-relaxed"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E0B669] mt-2 shrink-0" />
                  <span>{takeaway}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Article Content Sections */}
        <div className="flex flex-col gap-10 sm:gap-12 text-[#E9E8E3]/85 leading-relaxed text-base sm:text-lg">
          {article.sections.map((section, idx) => (
            <section key={idx} className="flex flex-col gap-4">
              <h3 className="text-2xl sm:text-3xl font-normal text-white font-heading tracking-tight">
                {section.heading}
              </h3>
              {section.body.map((para, pIdx) => (
                <p key={pIdx} className="leading-relaxed">
                  {para}
                </p>
              ))}
            </section>
          ))}

          {article.quote && (
            <blockquote className="my-6 p-6 sm:p-8 rounded-2xl bg-[#0a233d]/50 border-l-4 border-[#C89949] shadow-inner">
              <p className="text-lg sm:text-xl italic text-white font-heading leading-relaxed mb-3">
                &ldquo;{article.quote.text}&rdquo;
              </p>
              <cite className="text-xs sm:text-sm font-sans uppercase tracking-widest text-[#E0B669] not-italic block">
                — {article.quote.attribution}
              </cite>
            </blockquote>
          )}
        </div>

        {/* Back to Insights */}
        <div className="mt-14 pt-8 border-t border-white/10 flex items-center justify-between">
          <Link
            href="/insights"
            className="inline-flex items-center gap-2 text-sm text-[#E0B669] hover:text-white transition-colors group"
          >
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              size={16}
              strokeWidth={2}
              className="transition-transform group-hover:-translate-x-1"
            />
            <span>Back to all Insights</span>
          </Link>

          <Link
            href="/contactus"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C89949] hover:bg-[#E0B669] text-[#071A2E] text-xs sm:text-sm font-semibold transition-all shadow-md group"
          >
            <span>Consult on Your Matter</span>
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              size={14}
              strokeWidth={2.5}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      </article>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section className="max-w-8xl mx-auto px-6 sm:px-10 lg:px-12 mt-24 sm:mt-32 pt-16 border-t border-white/10">
          <div className="flex flex-col items-start mb-10">
            <span className="text-xs uppercase tracking-[0.24em] text-[#E0B669] font-medium mb-2">
              MORE PERSPECTIVES
            </span>
            <h2 className="text-2xl sm:text-4xl font-normal text-white font-heading">
              Related Advisory Insights
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {relatedArticles.map((rel) => (
              <Link
                key={rel.id}
                href={`/insights/${rel.slug}`}
                className="group flex flex-col justify-between rounded-2xl border border-[#B7873A]/25 bg-[#0a233d]/60 backdrop-blur-md p-5 hover:border-[#C89949]/50 transition-all duration-300 shadow-lg"
              >
                <div>
                  <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden mb-4 bg-[#071A2E]">
                    <Image
                      src={rel.imageSrc}
                      alt={rel.title}
                      fill
                      unoptimized
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                  </div>
                  <div className="text-[11px] uppercase tracking-wider text-[#E0B669] font-medium mb-2">
                    {rel.category}
                  </div>
                  <h3 className="text-lg font-normal text-white font-heading leading-snug group-hover:text-[#E0B669] transition-colors mb-2">
                    {rel.title}
                  </h3>
                </div>
                <div className="text-xs text-[#E9E8E3]/60 pt-3 border-t border-white/10 mt-4 flex items-center justify-between">
                  <span>{rel.readTime}</span>
                  <span className="text-[#E0B669] group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

export default function InsightSlugPage({ params }: PageProps) {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#071A2E] text-white selection:bg-[#C89949] selection:text-[#071A2E] overflow-x-clip">
      <Navbar forceScrolled={true} />

      <Suspense fallback={<ArticleLoadingSkeleton />}>
        <InsightSlugContent params={params} />
      </Suspense>

      <CTASection />
      <Footer />
    </div>
  );
}
