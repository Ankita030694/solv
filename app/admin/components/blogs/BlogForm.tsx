"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  Save,
  Image as ImageIcon,
  Trash2,
  Plus,
  Star,
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import TipTapEditor from "./TipTapEditor";
import { BlogPost, BlogFAQ, BlogReview } from "@/lib/types/blog";
import {
  createBlog,
  updateBlog,
  uploadBlogImage,
} from "@/lib/services/blogsService";
import {
  createCategory,
  getCategories,
} from "@/lib/services/categoriesService";
import {
  generateSlug,
  calibrateMetaTitle,
  calibrateMetaDescription,
} from "@/lib/seo-utils";
import {
  SOLV_AUTHOR_PROFILES,
  SOLV_BLOG_CATEGORIES,
} from "@/lib/constants/admin";

interface BlogFormProps {
  initialBlog?: BlogPost | null;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function BlogForm({
  initialBlog,
  onCancel,
  onSuccess,
}: BlogFormProps) {
  const isEditing = !!initialBlog?.id;
  const draftStorageKey = isEditing
    ? `solv_autosave_blog_${initialBlog?.id}`
    : "solv_autosave_blog_new";

  const [title, setTitle] = useState(initialBlog?.title || "");
  const [subtitle, setSubtitle] = useState(initialBlog?.subtitle || "");
  const [slug, setSlug] = useState(initialBlog?.slug || "");
  const [isSlugManual, setIsSlugManual] = useState(!!initialBlog?.slug);
  const [category, setCategory] = useState<string>(
    initialBlog?.category || SOLV_BLOG_CATEGORIES[0]
  );
  const [publishDate, setPublishDate] = useState(
    initialBlog?.publishDate || new Date().toISOString().split("T")[0]
  );
  const [selectedAuthor, setSelectedAuthor] = useState<string>(
    initialBlog?.authorName || SOLV_AUTHOR_PROFILES[0].name
  );
  const [coverImage, setCoverImage] = useState(initialBlog?.coverImage || "");
  const [customCoverUrl, setCustomCoverUrl] = useState("");
  const [description, setDescription] = useState(
    initialBlog?.description || ""
  );
  const [metaTitle, setMetaTitle] = useState(initialBlog?.metaTitle || "");
  const [metaDescription, setMetaDescription] = useState(
    initialBlog?.metaDescription || ""
  );
  const [featured, setFeatured] = useState(!!initialBlog?.featured);

  const [faqs, setFaqs] = useState<BlogFAQ[]>(initialBlog?.faqs || []);
  const [reviews, setReviews] = useState<BlogReview[]>(
    initialBlog?.reviews || []
  );

  const [showSeoAccordion, setShowSeoAccordion] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [hasDraft, setHasDraft] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([
    ...SOLV_BLOG_CATEGORIES,
  ]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  const coverFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    async function loadCategories() {
      const dbCats = await getCategories();
      if (!active || dbCats.length === 0) return;
      const merged = Array.from(
        new Set([...dbCats.map((c) => c.name), ...(initialBlog?.category ? [initialBlog.category] : [])])
      ).sort((a, b) => a.localeCompare(b));
      setCategories(merged);
    }
    loadCategories();
    return () => {
      active = false;
    };
  }, [initialBlog?.category]);

  const handleAddCategory = async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    try {
      setIsAddingCategory(true);
      const created = await createCategory(trimmed);
      setCategories((prev) =>
        Array.from(new Set([...prev, created.name])).sort((a, b) =>
          a.localeCompare(b)
        )
      );
      setCategory(created.name);
      setNewCategoryName("");
      setShowAddCategory(false);
    } catch (err) {
      console.error("Failed to create category:", err);
      setErrorMessage("Could not save new category. Check Firestore permissions.");
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isSlugManual) {
      setSlug(generateSlug(val));
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const timer = window.setTimeout(() => {
      try {
        const saved = localStorage.getItem(draftStorageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.title || parsed.description) {
            setHasDraft(true);
          }
        }
      } catch (e) {
        console.error("Error reading draft:", e);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [draftStorageKey]);

  const handleRestoreDraft = () => {
    try {
      const saved = localStorage.getItem(draftStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.title !== undefined) setTitle(parsed.title);
        if (parsed.subtitle !== undefined) setSubtitle(parsed.subtitle);
        if (parsed.slug !== undefined) setSlug(parsed.slug);
        if (parsed.category !== undefined) setCategory(parsed.category);
        if (parsed.publishDate !== undefined) setPublishDate(parsed.publishDate);
        if (parsed.selectedAuthor !== undefined)
          setSelectedAuthor(parsed.selectedAuthor);
        if (parsed.coverImage !== undefined) setCoverImage(parsed.coverImage);
        if (parsed.description !== undefined) setDescription(parsed.description);
        if (parsed.metaTitle !== undefined) setMetaTitle(parsed.metaTitle);
        if (parsed.metaDescription !== undefined)
          setMetaDescription(parsed.metaDescription);
        if (parsed.faqs !== undefined) setFaqs(parsed.faqs);
        if (parsed.reviews !== undefined) setReviews(parsed.reviews);
        setHasDraft(false);
      }
    } catch (e) {
      console.error("Failed to restore draft:", e);
    }
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem(draftStorageKey);
    setHasDraft(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (title.trim() || description.trim()) {
        const draftData = {
          title,
          subtitle,
          slug,
          category,
          publishDate,
          selectedAuthor,
          coverImage,
          description,
          metaTitle,
          metaDescription,
          faqs,
          reviews,
          savedAt: new Date().toLocaleTimeString(),
        };
        try {
          localStorage.setItem(draftStorageKey, JSON.stringify(draftData));
          setDraftSavedAt(draftData.savedAt);
        } catch (e) {
          console.warn("Local draft quota reached:", e);
        }
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [
    title,
    subtitle,
    slug,
    category,
    publishDate,
    selectedAuthor,
    coverImage,
    description,
    metaTitle,
    metaDescription,
    faqs,
    reviews,
    draftStorageKey,
  ]);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingCover(true);
      const url = await uploadBlogImage(file, "blog-images");
      setCoverImage(url);
    } catch (err) {
      console.error("Failed to upload cover image:", err);
      alert(
        "Failed to upload cover image. Please check storage bucket permissions."
      );
    } finally {
      setIsUploadingCover(false);
      if (coverFileRef.current) coverFileRef.current.value = "";
    }
  };

  const handleAddFaq = () => {
    setFaqs((prev) => [
      ...prev,
      { question: "", answer: "", order: prev.length },
    ]);
  };

  const handleUpdateFaq = (
    index: number,
    field: "question" | "answer",
    val: string
  ) => {
    setFaqs((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleDeleteFaq = (index: number) => {
    setFaqs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddReview = () => {
    setReviews((prev) => [...prev, { clientName: "", rating: 5, review: "" }]);
  };

  const handleUpdateReview = (
    index: number,
    field: "clientName" | "rating" | "review",
    val: string | number
  ) => {
    setReviews((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleDeleteReview = (index: number) => {
    setReviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!title.trim()) {
      setErrorMessage("Please enter an article title.");
      return;
    }
    if (!slug.trim()) {
      setErrorMessage("Please enter a valid URL slug.");
      return;
    }
    if (!description.trim() || description === "<p></p>") {
      setErrorMessage("Please add body content to the article.");
      return;
    }

    try {
      setIsSaving(true);

      const authorObj = SOLV_AUTHOR_PROFILES.find(
        (a) => a.name === selectedAuthor
      ) || {
        name: selectedAuthor,
        role: initialBlog?.authorRole || "SOLV Advisory Practice",
        avatar: initialBlog?.authorAvatar || "",
      };

      const blogPayload = {
        title: title.trim(),
        subtitle: subtitle.trim(),
        slug: slug.trim().toLowerCase(),
        category,
        publishDate,
        authorName: authorObj.name,
        authorRole: authorObj.role,
        authorAvatar: authorObj.avatar,
        coverImage,
        description,
        metaTitle: metaTitle.trim() || calibrateMetaTitle(title),
        metaDescription:
          metaDescription.trim() || calibrateMetaDescription(description, title),
        featured,
      };

      if (isEditing && initialBlog?.id) {
        await updateBlog(initialBlog.id, blogPayload, faqs, reviews);
      } else {
        await createBlog(blogPayload, faqs, reviews);
      }

      localStorage.removeItem(draftStorageKey);
      onSuccess();
    } catch (err: unknown) {
      console.error("Failed to save blog:", err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Failed to save article. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-7 pb-16">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#B7873A]/25 pb-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-xl border border-[#B7873A]/30 bg-[#0a233d]/80 hover:border-[#C89949] text-[#E0B669] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-normal text-white font-heading">
              {isEditing ? "Edit Insight Article" : "Write New Insight Article"}
            </h1>
            <p className="text-xs text-[#E9E8E3]/65">
              Editorial formatting, SEO calibration, and rich media for SOLV Insights.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {draftSavedAt && (
            <span className="text-xs text-[#E9E8E3]/55 hidden sm:inline-block">
              Draft auto-saved at {draftSavedAt}
            </span>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-[#E9E8E3]/80 border border-white/15 bg-[#0a233d]/80 hover:bg-white/10 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#C89949] hover:bg-[#E0B669] text-[#071A2E] flex items-center gap-2 shadow-lg shadow-black/25 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Publishing...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isEditing ? "Update Article" : "Publish Article"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Draft Banner */}
      {hasDraft && (
        <div className="bg-[#C89949]/15 border border-[#C89949]/35 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[#E0B669] text-xs sm:text-sm font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              An unsaved draft for this article was detected. Would you like to restore it?
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleRestoreDraft}
              className="px-3 py-1.5 bg-[#C89949] hover:bg-[#E0B669] text-[#071A2E] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Restore Draft
            </button>
            <button
              type="button"
              onClick={handleDiscardDraft}
              className="px-3 py-1.5 bg-[#071A2E] border border-[#B7873A]/40 text-[#E0B669] hover:bg-white/10 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-500/15 border border-red-500/35 rounded-xl p-4 text-xs sm:text-sm text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Cols: Main Info & Editor */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#0a233d]/65 backdrop-blur-md p-5 rounded-2xl border border-[#B7873A]/25 shadow-xl shadow-black/20 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#E0B669] uppercase tracking-wider mb-1.5">
                Article Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Structuring Multi-Jurisdictional Property Succession"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#071A2E]/85 border border-white/15 text-white placeholder-white/35 text-base font-medium focus:outline-none focus:border-[#C89949] focus:ring-1 focus:ring-[#C89949]/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#E0B669] uppercase tracking-wider mb-1.5">
                Lead Summary / Subtitle (Optional)
              </label>
              <input
                type="text"
                placeholder="A considered summary or executive lead for the article card & header"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-[#071A2E]/85 border border-white/15 text-white placeholder-white/35 text-sm focus:outline-none focus:border-[#C89949] focus:ring-1 focus:ring-[#C89949]/50"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#E0B669] uppercase tracking-wider">
                  URL Slug <span className="text-red-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsSlugManual(false);
                    setSlug(generateSlug(title));
                  }}
                  className="text-xs text-[#E0B669] hover:text-white flex items-center gap-1 font-medium cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" /> Auto-generate
                </button>
              </div>
              <div className="flex items-center rounded-xl border border-white/15 bg-[#071A2E]/85 px-3 py-2 text-sm text-[#E0B669]/75 font-mono">
                <span>/insights/</span>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => {
                    setIsSlugManual(true);
                    setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"));
                  }}
                  className="w-full bg-transparent text-white focus:outline-none pl-1 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[#E0B669] uppercase tracking-wider">
              Article Content <span className="text-red-400">*</span>
            </label>
            <TipTapEditor
              content={description}
              onChange={(html) => setDescription(html)}
            />
          </div>

          {/* Attached FAQs Builder */}
          <div className="bg-[#0a233d]/65 backdrop-blur-md p-5 rounded-2xl border border-[#B7873A]/25 shadow-xl shadow-black/20 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                  Attached FAQs ({faqs.length})
                </h3>
                <p className="text-xs text-[#E9E8E3]/65 mt-0.5">
                  Adds an interactive Q&amp;A accordion at the bottom of the insight and generates FAQPage schema.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddFaq}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#071A2E] border border-[#B7873A]/40 text-[#E0B669] hover:bg-[#C89949] hover:text-[#071A2E] flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add FAQ</span>
              </button>
            </div>

            {faqs.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-[#B7873A]/30 rounded-xl text-xs text-[#E9E8E3]/55">
                No FAQs added yet. Click &quot;Add FAQ&quot; to include questions and answers.
              </div>
            ) : (
              <div className="space-y-3">
                {faqs.map((faq, index) => (
                  <div
                    key={index}
                    className="p-3.5 rounded-xl border border-white/10 bg-[#071A2E]/75 space-y-2.5 relative"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[#E0B669]">
                        Q{index + 1}:
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteFaq(index)}
                        className="text-red-400 hover:text-red-300 p-1 rounded-md hover:bg-red-500/15 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. How does SOLV coordinate cross-border property documentation?"
                      value={faq.question}
                      onChange={(e) =>
                        handleUpdateFaq(index, "question", e.target.value)
                      }
                      className="w-full px-3 py-2 rounded-lg border border-white/15 bg-[#0a233d]/80 text-xs sm:text-sm text-white placeholder-white/35 focus:outline-none focus:border-[#C89949]"
                    />
                    <textarea
                      rows={2}
                      placeholder="Detailed answer for this question..."
                      value={faq.answer}
                      onChange={(e) =>
                        handleUpdateFaq(index, "answer", e.target.value)
                      }
                      className="w-full px-3 py-2 rounded-lg border border-white/15 bg-[#0a233d]/80 text-xs sm:text-sm text-white placeholder-white/35 focus:outline-none focus:border-[#C89949] resize-none"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Client Endorsements / Reviews Builder */}
          <div className="bg-[#0a233d]/65 backdrop-blur-md p-5 rounded-2xl border border-[#B7873A]/25 shadow-xl shadow-black/20 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                  Client Perspectives &amp; Reviews ({reviews.length})
                </h3>
                <p className="text-xs text-[#E9E8E3]/65 mt-0.5">
                  Embed client ratings and feedback linked to this advisory topic.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddReview}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#071A2E] border border-[#B7873A]/40 text-[#E0B669] hover:bg-[#C89949] hover:text-[#071A2E] flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Review</span>
              </button>
            </div>

            {reviews.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-[#B7873A]/30 rounded-xl text-xs text-[#E9E8E3]/55">
                No client reviews added yet.
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((rev, index) => (
                  <div
                    key={index}
                    className="p-3.5 rounded-xl border border-white/10 bg-[#071A2E]/75 space-y-2.5 relative"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#E0B669]">
                          Review #{index + 1}
                        </span>
                        <div className="flex items-center text-[#E0B669]">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < rev.rating
                                  ? "fill-[#E0B669] text-[#E0B669]"
                                  : "text-white/20"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteReview(index)}
                        className="text-red-400 hover:text-red-300 p-1 rounded-md hover:bg-red-500/15 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Client Name & Role (e.g. Managing Director, Family Office)"
                        value={rev.clientName}
                        onChange={(e) =>
                          handleUpdateReview(index, "clientName", e.target.value)
                        }
                        className="w-full px-3 py-2 rounded-lg border border-white/15 bg-[#0a233d]/80 text-xs sm:text-sm text-white placeholder-white/35 focus:outline-none focus:border-[#C89949]"
                      />
                      <select
                        value={rev.rating}
                        onChange={(e) =>
                          handleUpdateReview(
                            index,
                            "rating",
                            Number(e.target.value)
                          )
                        }
                        className="w-full px-3 py-2 rounded-lg border border-white/15 bg-[#0a233d] text-xs sm:text-sm text-white focus:outline-none focus:border-[#C89949]"
                      >
                        <option value={5}>5 Stars - Exceptional</option>
                        <option value={4}>4 Stars - Great</option>
                        <option value={3}>3 Stars - Good</option>
                        <option value={2}>2 Stars - Fair</option>
                        <option value={1}>1 Star - Poor</option>
                      </select>
                    </div>

                    <textarea
                      rows={2}
                      placeholder="Client review text..."
                      value={rev.review}
                      onChange={(e) =>
                        handleUpdateReview(index, "review", e.target.value)
                      }
                      className="w-full px-3 py-2 rounded-lg border border-white/15 bg-[#0a233d]/80 text-xs sm:text-sm text-white placeholder-white/35 focus:outline-none focus:border-[#C89949] resize-none"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Sticky Sidebar */}
        <div className="space-y-6 lg:col-span-1 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto custom-scrollbar lg:pr-1.5 p-0.5">
          {/* Publishing Settings */}
          <div className="bg-[#0a233d]/65 backdrop-blur-md p-5 rounded-2xl border border-[#B7873A]/25 shadow-xl shadow-black/20 space-y-4">
            <h3 className="text-xs font-semibold text-[#E0B669] uppercase tracking-wider">
              Publishing Settings
            </h3>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-[#E9E8E3]/80">
                  Category
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddCategory((prev) => !prev)}
                  className="text-[11px] font-medium text-[#E0B669] hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>{showAddCategory ? "Close" : "New Category"}</span>
                </button>
              </div>
              {showAddCategory && (
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="e.g. NRI Asset Advisory"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCategory();
                      }
                    }}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-[#C89949]/40 bg-[#071A2E] text-xs text-white placeholder-white/35 focus:outline-none focus:border-[#C89949]"
                  />
                  <button
                    type="button"
                    disabled={isAddingCategory || !newCategoryName.trim()}
                    onClick={handleAddCategory}
                    className="px-3 py-1.5 rounded-lg bg-[#C89949] hover:bg-[#E0B669] text-[#071A2E] text-xs font-semibold disabled:opacity-50 cursor-pointer"
                  >
                    {isAddingCategory ? "..." : "Add"}
                  </button>
                </div>
              )}
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-white/15 bg-[#071A2E] text-sm text-white focus:outline-none focus:border-[#C89949]"
              >
                {category && !categories.includes(category) && (
                  <option value={category}>{category}</option>
                )}
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#E9E8E3]/80 mb-1.5">
                Publication Date
              </label>
              <input
                type="date"
                value={publishDate}
                onChange={(e) => setPublishDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-white/15 bg-[#071A2E] text-sm text-white focus:outline-none focus:border-[#C89949] [color-scheme:dark]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#E9E8E3]/80 mb-1.5">
                Author Profile
              </label>
              <select
                value={selectedAuthor}
                onChange={(e) => setSelectedAuthor(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-white/15 bg-[#071A2E] text-sm text-white focus:outline-none focus:border-[#C89949]"
              >
                {selectedAuthor &&
                  !SOLV_AUTHOR_PROFILES.some((a) => a.name === selectedAuthor) && (
                    <option value={selectedAuthor}>
                      {selectedAuthor}
                      {initialBlog?.authorRole ? ` (${initialBlog.authorRole})` : ""}
                    </option>
                  )}
                {SOLV_AUTHOR_PROFILES.map((a) => (
                  <option key={a.name} value={a.name}>
                    {a.name} ({a.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2.5 flex items-center justify-between border-t border-white/10">
              <span className="text-xs font-medium text-[#E9E8E3]/85">
                Feature on Insights
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-[#071A2E] border border-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#E9E8E3] after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#C89949] peer-checked:after:bg-[#071A2E]" />
              </label>
            </div>
          </div>

          {/* Cover Image Card */}
          <div className="bg-[#0a233d]/65 backdrop-blur-md p-5 rounded-2xl border border-[#B7873A]/25 shadow-xl shadow-black/20 space-y-4">
            <h3 className="text-xs font-semibold text-[#E0B669] uppercase tracking-wider">
              Cover Image
            </h3>

            <input
              ref={coverFileRef}
              type="file"
              accept="image/*"
              onChange={handleCoverUpload}
              className="hidden"
            />

            {coverImage ? (
              <div className="relative rounded-xl overflow-hidden border border-[#B7873A]/30 aspect-video group">
                <Image
                  src={coverImage}
                  alt="Cover Preview"
                  fill
                  unoptimized
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-[#040D18]/65 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => coverFileRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-[#C89949] text-xs font-semibold text-[#071A2E] hover:bg-[#E0B669] transition-colors cursor-pointer"
                  >
                    Change Image
                  </button>
                  <button
                    type="button"
                    onClick={() => setCoverImage("")}
                    className="p-1.5 rounded-lg bg-red-600/90 text-white hover:bg-red-500 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => coverFileRef.current?.click()}
                className="border-2 border-dashed border-[#B7873A]/35 hover:border-[#C89949] rounded-xl p-6 text-center cursor-pointer transition-colors bg-[#071A2E]/70 flex flex-col items-center justify-center gap-2 group"
              >
                {isUploadingCover ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin text-[#E0B669]" />
                    <span className="text-xs text-[#E9E8E3]/70">
                      Compressing &amp; uploading...
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-full bg-[#0a233d] border border-[#B7873A]/35 text-[#E0B669] flex items-center justify-center group-hover:scale-105 transition-transform">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-white">
                      Upload Compressed Cover Image
                    </span>
                    <span className="text-[11px] text-[#E9E8E3]/55">
                      Auto-resized to 1200px max (JPEG 75%)
                    </span>
                  </>
                )}
              </div>
            )}

            <div className="space-y-1.5 pt-2 border-t border-white/10">
              <label className="block text-[11px] font-medium text-[#E9E8E3]/65">
                Or Paste Image URL:
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={customCoverUrl}
                  onChange={(e) => setCustomCoverUrl(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-white/15 bg-[#071A2E] text-xs text-white placeholder-white/35 focus:outline-none focus:border-[#C89949]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customCoverUrl.trim()) {
                      setCoverImage(customCoverUrl.trim());
                      setCustomCoverUrl("");
                    }
                  }}
                  className="px-3 py-1.5 bg-[#071A2E] border border-[#B7873A]/35 hover:border-[#C89949] text-[#E0B669] text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>

          {/* SEO Calibration Accordion */}
          <div className="bg-[#0a233d]/65 backdrop-blur-md rounded-2xl border border-[#B7873A]/25 shadow-xl shadow-black/20 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowSeoAccordion(!showSeoAccordion)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-white/[0.03] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#E0B669]" />
                <span className="text-xs font-semibold text-[#E0B669] uppercase tracking-wider">
                  SEO Meta Calibration
                </span>
              </div>
              {showSeoAccordion ? (
                <ChevronUp className="w-4 h-4 text-[#E9E8E3]/65" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#E9E8E3]/65" />
              )}
            </button>

            {showSeoAccordion && (
              <div className="p-4 pt-2 border-t border-white/10 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-[#E9E8E3]/80">
                      Meta Title
                    </label>
                    <span
                      className={`text-[11px] font-mono font-medium ${
                        metaTitle.length >= 45 && metaTitle.length <= 58
                          ? "text-emerald-400"
                          : "text-[#E0B669]"
                      }`}
                    >
                      {metaTitle.length} chars (Target: 45–58)
                    </span>
                  </div>
                  <input
                    type="text"
                    placeholder={calibrateMetaTitle(
                      title || "Strategic Advisory"
                    )}
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-white/15 bg-[#071A2E] text-xs text-white placeholder-white/35 focus:outline-none focus:border-[#C89949]"
                  />
                  <p className="text-[11px] text-[#E9E8E3]/50 mt-1">
                    Automatically appends &quot; | SOLV&quot; upon publication.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-[#E9E8E3]/80">
                      Meta Description
                    </label>
                    <span
                      className={`text-[11px] font-mono font-medium ${
                        metaDescription.length >= 120 &&
                        metaDescription.length <= 150
                          ? "text-emerald-400"
                          : "text-[#E0B669]"
                      }`}
                    >
                      {metaDescription.length} chars (Target: 120–150)
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Calibrated summary optimized for search engines..."
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-white/15 bg-[#071A2E] text-xs text-white placeholder-white/35 focus:outline-none focus:border-[#C89949] resize-none"
                  />
                  <p className="text-[11px] text-[#E9E8E3]/50 mt-1">
                    Leave blank to auto-generate from calibrated body text.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}

