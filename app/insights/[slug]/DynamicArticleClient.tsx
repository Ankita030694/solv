"use client";

import React, { useState } from "react";
import { Check, ChevronDown, Share2, Star } from "lucide-react";
import type { BlogFAQ, BlogReview } from "@/lib/types/blog";

export function ArticleShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      }
    } catch {
      // User cancelled share or clipboard blocked
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#B7873A]/30 bg-[#0a233d]/70 hover:border-[#C89949] text-xs font-medium text-[#E0B669] transition-all"
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5" />
          <span>Link Copied</span>
        </>
      ) : (
        <>
          <Share2 className="w-3.5 h-3.5" />
          <span>Share</span>
        </>
      )}
    </button>
  );
}

export function ArticleFAQsSection({ faqs }: { faqs: BlogFAQ[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (!faqs || faqs.length === 0) return null;

  return (
    <section className="mt-14 pt-10 border-t border-white/10">
      <div className="mb-6">
        <span className="text-xs font-sans uppercase tracking-[0.24em] text-[#E0B669] font-semibold">
          FREQUENTLY ASKED QUESTIONS
        </span>
        <h2 className="text-2xl sm:text-3xl font-normal text-white font-heading mt-2">
          Key Questions Answered
        </h2>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={faq.id || idx}
              className="rounded-2xl border border-[#B7873A]/25 bg-[#0a233d]/65 backdrop-blur-md overflow-hidden transition-colors hover:border-[#C89949]/45"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full px-6 py-4 flex items-center justify-between gap-4 text-left"
              >
                <span className="text-base sm:text-lg font-medium text-white">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-[#E0B669] shrink-0 transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-6 pb-5 pt-1 text-sm sm:text-base text-[#E9E8E3]/80 leading-relaxed border-t border-white/5">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function ArticleReviewsSection({ reviews }: { reviews: BlogReview[] }) {
  if (!reviews || reviews.length === 0) return null;

  return (
    <section className="mt-14 pt-10 border-t border-white/10">
      <div className="mb-6">
        <span className="text-xs font-sans uppercase tracking-[0.24em] text-[#E0B669] font-semibold">
          CLIENT PERSPECTIVES
        </span>
        <h2 className="text-2xl sm:text-3xl font-normal text-white font-heading mt-2">
          Reader & Client Endorsements
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {reviews.map((review, idx) => {
          const rating = Math.min(5, Math.max(1, Number(review.rating) || 5));
          return (
            <div
              key={review.id || idx}
              className="rounded-2xl border border-[#B7873A]/25 bg-[#0a233d]/65 backdrop-blur-md p-6 flex flex-col justify-between gap-4 shadow-lg"
            >
              <div>
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, starIdx) => (
                    <Star
                      key={starIdx}
                      className={`w-4 h-4 ${
                        starIdx < rating
                          ? "text-[#E0B669] fill-[#E0B669]"
                          : "text-white/20"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm sm:text-base text-[#E9E8E3]/90 leading-relaxed italic">
                  &ldquo;{review.review}&rdquo;
                </p>
              </div>
              <div className="pt-3 border-t border-white/10">
                <p className="text-sm font-medium text-white">
                  {review.clientName}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

