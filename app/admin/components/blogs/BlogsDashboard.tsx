"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  FileText,
  BookmarkCheck,
  HelpCircle,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Edit3,
  Trash2,
  ExternalLink,
  ChevronDown,
  RotateCw,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Database,
  Tag,
  X,
} from "lucide-react";
import BlogForm from "./BlogForm";
import { BlogPost, BlogStats } from "@/lib/types/blog";
import {
  getBlogs,
  getBlogStats,
  getBlogById,
  deleteBlog,
} from "@/lib/services/blogsService";
import {
  getCategories,
  createCategory,
  deleteCategory,
  type BlogCategory,
} from "@/lib/services/categoriesService";
import { SOLV_BLOG_CATEGORIES } from "@/lib/constants/admin";
import { INSIGHT_ARTICLES } from "@/data/insights";
import { importStaticInsightsToFirestore } from "@/lib/seedInsights";

export default function BlogsDashboard() {
  const [viewMode, setViewMode] = useState<"list" | "create" | "edit">("list");
  const [editingBlog, setEditingBlog] = useState<BlogPost | null>(null);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [stats, setStats] = useState<BlogStats>({
    totalBlogs: 0,
    tocEnriched: 0,
    faqsEmbedded: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [openCategoryDropdown, setOpenCategoryDropdown] = useState(false);
  const [openSortDropdown, setOpenSortDropdown] = useState(false);

  const [blogToDelete, setBlogToDelete] = useState<BlogPost | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [dbCategories, setDbCategories] = useState<BlogCategory[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  const dynamicCategories = useMemo(() => {
    const names =
      dbCategories.length > 0
        ? dbCategories.map((c) => c.name)
        : Array.from(
          new Set([
            ...SOLV_BLOG_CATEGORIES,
            ...blogs.map((b) => b.category).filter(Boolean),
          ])
        ).sort((a, b) => a.localeCompare(b));
    return ["All", ...Array.from(new Set(names))];
  }, [dbCategories, blogs]);

  const missingInsightsCount = useMemo(() => {
    const existingSlugs = new Set(blogs.map((b) => b.slug.toLowerCase()));
    return INSIGHT_ARTICLES.filter(
      (a) => !existingSlugs.has(a.slug.toLowerCase())
    ).length;
  }, [blogs]);

  const fetchData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const [blogsRes, statsRes, catsRes] = await Promise.all([
        getBlogs({ sortBy }),
        getBlogStats(),
        getCategories(),
      ]);
      setBlogs(blogsRes.blogs);
      setStats(statsRes);
      setDbCategories(catsRes);
    } catch (err) {
      console.error("Failed to load blogs data:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [sortBy]);

  useEffect(() => {
    let active = true;
    async function loadInitial() {
      try {
        const [blogsRes, statsRes, catsRes] = await Promise.all([
          getBlogs({ sortBy }),
          getBlogStats(),
          getCategories(),
        ]);
        if (!active) return;

        const alreadyAutoSeeded =
          typeof window !== "undefined" &&
          localStorage.getItem("solv_insights_auto_seeded") === "1";

        if (blogsRes.blogs.length === 0 && !alreadyAutoSeeded) {
          try {
            const res = await importStaticInsightsToFirestore();
            if (!active) return;
            if (typeof window !== "undefined") {
              localStorage.setItem("solv_insights_auto_seeded", "1");
            }
            const [freshBlogs, freshStats, freshCats] = await Promise.all([
              getBlogs({ sortBy }),
              getBlogStats(),
              getCategories(),
            ]);
            if (!active) return;
            setBlogs(freshBlogs.blogs);
            setStats(freshStats);
            setDbCategories(freshCats);
            if (res.importedCount > 0 || res.categoriesSeeded > 0) {
              setImportNotice(
                `Imported ${res.importedCount} insight(s) and ${res.categoriesSeeded} category record(s) into Firestore.`
              );
            }
            return;
          } catch (seedErr) {
            console.error("Auto-import failed:", seedErr);
            if (active) {
              setImportError(
                seedErr instanceof Error
                  ? `Firestore import error: ${seedErr.message}`
                  : "Could not write to Firestore. Please verify Firestore Security Rules are published."
              );
            }
          }
        }

        setBlogs(blogsRes.blogs);
        setStats(statsRes);
        setDbCategories(catsRes);
      } catch (err) {
        console.error("Failed to load blogs data:", err);
      } finally {
        if (active) {
          setLoading(false);
          setIsRefreshing(false);
        }
      }
    }
    loadInitial();
    return () => {
      active = false;
    };
  }, [sortBy]);

  const handleImportStaticInsights = async () => {
    try {
      setIsImporting(true);
      setImportNotice(null);
      setImportError(null);
      const res = await importStaticInsightsToFirestore();
      if (typeof window !== "undefined") {
        localStorage.setItem("solv_insights_auto_seeded", "1");
      }
      await fetchData();
      setImportNotice(
        `Synced ${res.importedCount} insight(s) and ${res.categoriesSeeded} category record(s) into Firestore.`
      );
    } catch (err) {
      console.error("Failed to import insights:", err);
      setImportError(
        err instanceof Error
          ? `Failed to import insights: ${err.message}`
          : "Failed to import insights. Please verify Firestore security rules allow authenticated writes."
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newCategoryInput.trim();
    if (!clean) return;
    try {
      setIsSavingCategory(true);
      await createCategory(clean);
      setNewCategoryInput("");
      await fetchData();
    } catch (err) {
      console.error("Failed to add category:", err);
      alert("Could not create category. Check Firestore permissions.");
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleRemoveCategory = async (cat: BlogCategory) => {
    if (!cat.id || cat.id.startsWith("derived-")) return;
    try {
      await deleteCategory(cat.id);
      if (selectedCategory === cat.name) {
        setSelectedCategory("All");
      }
      await fetchData();
    } catch (err) {
      console.error("Failed to delete category:", err);
    }
  };

  const handleStartEdit = async (blog: BlogPost) => {
    if (!blog.id) return;
    try {
      setLoading(true);
      const fullBlog = await getBlogById(blog.id);
      if (fullBlog) {
        setEditingBlog(fullBlog);
        setViewMode("edit");
      }
    } catch (err) {
      console.error("Failed to fetch full blog for editing:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!blogToDelete?.id) return;
    try {
      setIsDeleting(true);
      await deleteBlog(
        blogToDelete.id,
        blogToDelete.description,
        blogToDelete.coverImage
      );
      setBlogToDelete(null);
      await fetchData();
    } catch (err) {
      console.error("Failed to delete blog:", err);
      alert("Failed to delete article. Please check permissions.");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredBlogs = useMemo(() => {
    let result = [...blogs];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          (b.subtitle && b.subtitle.toLowerCase().includes(q)) ||
          b.slug.toLowerCase().includes(q) ||
          b.authorName.toLowerCase().includes(q)
      );
    }

    if (selectedCategory !== "All") {
      result = result.filter(
        (b) => b.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (sortBy === "oldest") {
      result.sort((a, b) =>
        (a.createdAt || "").localeCompare(b.createdAt || "")
      );
    } else {
      result.sort((a, b) =>
        (b.createdAt || "").localeCompare(a.createdAt || "")
      );
    }

    return result;
  }, [blogs, searchQuery, selectedCategory, sortBy]);

  const totalFilteredCount = filteredBlogs.length;
  const totalPages = Math.ceil(totalFilteredCount / itemsPerPage) || 1;
  const paginatedBlogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredBlogs.slice(start, start + itemsPerPage);
  }, [filteredBlogs, currentPage, itemsPerPage]);

  const startItem =
    totalFilteredCount === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalFilteredCount);

  if (viewMode === "create") {
    return (
      <BlogForm
        onCancel={() => setViewMode("list")}
        onSuccess={() => {
          setViewMode("list");
          fetchData();
        }}
      />
    );
  }

  if (viewMode === "edit" && editingBlog) {
    return (
      <BlogForm
        initialBlog={editingBlog}
        onCancel={() => {
          setEditingBlog(null);
          setViewMode("list");
        }}
        onSuccess={() => {
          setEditingBlog(null);
          setViewMode("list");
          fetchData();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Title Row + Metrics */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-normal text-white font-heading tracking-tight">
              Insights &amp; Blogs Manager
            </h1>
            <button
              type="button"
              title="Refresh Articles"
              onClick={fetchData}
              className="p-2 rounded-xl border border-[#B7873A]/30 bg-[#0a233d]/80 text-[#E0B669] hover:border-[#C89949] hover:bg-[#0a233d] transition-all cursor-pointer"
            >
              <RotateCw
                className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </button>
          </div>
          <p className="text-xs sm:text-sm text-[#E9E8E3]/70 mt-1">
            Create, publish, and manage long-form SOLV advisory insights, SEO metadata, and Q&amp;A guides.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Total Blogs */}
          <div className="flex items-center gap-3 bg-[#0a233d]/75 backdrop-blur-md border border-[#B7873A]/25 rounded-xl px-4 py-2.5 min-w-[135px] shadow-lg shadow-black/20">
            <div className="w-9 h-9 rounded-lg bg-[#071A2E]/90 border border-[#B7873A]/30 text-[#E0B669] flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-[#E9E8E3]/65">
                Total Insights
              </span>
              <span className="text-xl sm:text-2xl font-semibold text-white leading-none mt-0.5">
                {loading ? "–" : stats.totalBlogs}
              </span>
            </div>
          </div>

          {/* TOC Enriched */}
          <div className="flex items-center gap-3 bg-[#0a233d]/75 backdrop-blur-md border border-[#B7873A]/25 rounded-xl px-4 py-2.5 min-w-[135px] shadow-lg shadow-black/20">
            <div className="w-9 h-9 rounded-lg bg-[#C89949]/15 border border-[#C89949]/35 text-[#E0B669] flex items-center justify-center shrink-0">
              <BookmarkCheck className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-[#E9E8E3]/65">
                Structured H2/H3
              </span>
              <span className="text-xl sm:text-2xl font-semibold text-[#E0B669] leading-none mt-0.5">
                {loading ? "–" : stats.tocEnriched}
              </span>
            </div>
          </div>

          {/* FAQs Embedded */}
          <div className="flex items-center gap-3 bg-[#0a233d]/75 backdrop-blur-md border border-[#B7873A]/25 rounded-xl px-4 py-2.5 min-w-[135px] shadow-lg shadow-black/20">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-[#E9E8E3]/65">
                FAQs Embedded
              </span>
              <span className="text-xl sm:text-2xl font-semibold text-emerald-400 leading-none mt-0.5">
                {loading ? "–" : stats.faqsEmbedded}
              </span>
            </div>
          </div>

          {/* Write Article CTA */}
          <button
            type="button"
            onClick={() => setViewMode("create")}
            className="bg-[#C89949] hover:bg-[#E0B669] text-[#071A2E] font-semibold rounded-xl px-4 py-3 flex items-center gap-2 shadow-lg shadow-black/25 transition-all cursor-pointer text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Write Insight Post</span>
          </button>
        </div>
      </div>

      {/* Sync / Seed Banner when initial insights are not yet in Firestore */}
      {!loading && missingInsightsCount > 0 && (
        <div className="rounded-2xl border border-[#C89949]/35 bg-[#C89949]/10 px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-2.5 text-xs sm:text-sm text-[#E9E8E3]">
            <Database className="w-4 h-4 text-[#E0B669] shrink-0 mt-0.5 sm:mt-0" />
            <span>
              <strong className="text-[#E0B669]">
                {missingInsightsCount} editorial insight
                {missingInsightsCount === 1 ? "" : "s"}
              </strong>{" "}
              from <code className="text-xs text-white/90">/insights</code> are not yet in the Firestore{" "}
              <code className="text-xs text-white/90">blogs</code> collection.
            </span>
          </div>
          <button
            type="button"
            disabled={isImporting}
            onClick={handleImportStaticInsights}
            className="px-4 py-2 rounded-xl bg-[#C89949] hover:bg-[#E0B669] text-[#071A2E] text-xs font-semibold flex items-center gap-2 shadow-md transition-all disabled:opacity-50 shrink-0 cursor-pointer"
          >
            {isImporting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Importing...</span>
              </>
            ) : (
              <>
                <Database className="w-3.5 h-3.5" />
                <span>Import All to Database</span>
              </>
            )}
          </button>
        </div>
      )}

      {importNotice && (
        <div className="rounded-xl border border-emerald-500/35 bg-emerald-500/15 px-4 py-3 flex items-center justify-between gap-3 text-xs sm:text-sm text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{importNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setImportNotice(null)}
            className="p-1 rounded-lg hover:bg-white/10 text-emerald-200 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {importError && (
        <div className="rounded-xl border border-red-500/35 bg-red-500/15 px-4 py-3 flex items-center justify-between gap-3 text-xs sm:text-sm text-red-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{importError}</span>
          </div>
          <button
            type="button"
            onClick={() => setImportError(null)}
            className="p-1 rounded-lg hover:bg-white/10 text-red-200 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="w-full flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
        <div className="relative flex-1 max-w-xl">
          <Search className="w-4 h-4 text-[#E0B669]/75 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by title, subtitle, slug, author..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#0a233d]/80 border border-[#B7873A]/25 rounded-xl text-xs sm:text-sm text-white placeholder-white/35 shadow-inner focus:outline-none focus:border-[#C89949] focus:ring-1 focus:ring-[#C89949]/50 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowCategoriesModal(true)}
            className="px-3.5 py-2.5 bg-[#0a233d]/80 border border-[#B7873A]/25 hover:border-[#C89949]/50 rounded-xl text-xs font-medium text-[#E0B669] flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Categories ({dbCategories.length})</span>
          </button>

          {/* Category Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setOpenCategoryDropdown(!openCategoryDropdown);
                setOpenSortDropdown(false);
              }}
              className="px-3.5 py-2.5 bg-[#0a233d]/80 border border-[#B7873A]/25 hover:border-[#C89949]/50 rounded-xl text-xs font-medium text-[#E9E8E3] flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5 text-[#E0B669]" />
              <span>Category: {selectedCategory}</span>
              <ChevronDown className="w-3 h-3 text-[#E9E8E3]/50" />
            </button>

            {openCategoryDropdown && (
              <div className="absolute right-0 mt-1.5 w-56 bg-[#0a233d] border border-[#B7873A]/35 rounded-xl shadow-2xl shadow-black/60 z-30 py-1 max-h-72 overflow-y-auto custom-scrollbar">
                {dynamicCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat);
                      setCurrentPage(1);
                      setOpenCategoryDropdown(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs font-medium hover:bg-white/5 flex items-center justify-between cursor-pointer ${selectedCategory === cat
                      ? "text-[#E0B669] font-semibold bg-[#C89949]/15"
                      : "text-[#E9E8E3]/85"
                      }`}
                  >
                    <span>{cat}</span>
                    {selectedCategory === cat && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#E0B669]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setOpenSortDropdown(!openSortDropdown);
                setOpenCategoryDropdown(false);
              }}
              className="px-3.5 py-2.5 bg-[#0a233d]/80 border border-[#B7873A]/25 hover:border-[#C89949]/50 rounded-xl text-xs font-medium text-[#E9E8E3] flex items-center gap-2 transition-colors cursor-pointer"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-[#E0B669]" />
              <span>Sort: {sortBy === "newest" ? "Newest" : "Oldest"}</span>
              <ChevronDown className="w-3 h-3 text-[#E9E8E3]/50" />
            </button>

            {openSortDropdown && (
              <div className="absolute right-0 mt-1.5 w-40 bg-[#0a233d] border border-[#B7873A]/35 rounded-xl shadow-2xl shadow-black/60 z-30 py-1">
                <button
                  type="button"
                  onClick={() => {
                    setSortBy("newest");
                    setCurrentPage(1);
                    setOpenSortDropdown(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs font-medium hover:bg-white/5 flex items-center justify-between cursor-pointer ${sortBy === "newest"
                    ? "text-[#E0B669] font-semibold bg-[#C89949]/15"
                    : "text-[#E9E8E3]/85"
                    }`}
                >
                  <span>Newest First</span>
                  {sortBy === "newest" && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#E0B669]" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSortBy("oldest");
                    setCurrentPage(1);
                    setOpenSortDropdown(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs font-medium hover:bg-white/5 flex items-center justify-between cursor-pointer ${sortBy === "oldest"
                    ? "text-[#E0B669] font-semibold bg-[#C89949]/15"
                    : "text-[#E9E8E3]/85"
                    }`}
                >
                  <span>Oldest First</span>
                  {sortBy === "oldest" && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#E0B669]" />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Blogs Table */}
      <div className="bg-[#0a233d]/65 backdrop-blur-md rounded-2xl border border-[#B7873A]/25 shadow-xl shadow-black/25 overflow-hidden">
        {loading && blogs.length === 0 ? (
          <div className="p-12 text-center text-[#E9E8E3]/60 flex flex-col items-center justify-center gap-2.5">
            <Loader2 className="w-6 h-6 animate-spin text-[#E0B669]" />
            <span className="text-xs">Loading articles...</span>
          </div>
        ) : paginatedBlogs.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#071A2E] border border-[#B7873A]/35 text-[#E0B669] flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-medium text-white">
              No articles found
            </h3>
            <p className="text-xs text-[#E9E8E3]/60 max-w-sm">
              {searchQuery || selectedCategory !== "All"
                ? "No published articles matched your search filters."
                : "You haven't published any insights to Firestore yet. Click 'Write Insight Post' to create your first article."}
            </p>
            {!searchQuery && selectedCategory === "All" && (
              <button
                type="button"
                onClick={() => setViewMode("create")}
                className="mt-2 px-4 py-2 bg-[#C89949] hover:bg-[#E0B669] text-[#071A2E] text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Write First Insight Post
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#071A2E]/90 border-b border-[#B7873A]/25 text-[#E0B669] text-[11px] uppercase tracking-[0.14em] font-semibold">
                  <th className="py-3.5 px-4 w-16">Cover</th>
                  <th className="py-3.5 px-4">Title &amp; Author</th>
                  <th className="py-3.5 px-4">URL Slug</th>
                  <th className="py-3.5 px-4">Attached Q&amp;A / Reviews</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-xs sm:text-sm">
                {paginatedBlogs.map((blog) => (
                  <tr
                    key={blog.id}
                    className="hover:bg-white/[0.04] transition-colors group"
                  >
                    <td className="py-3.5 px-4">
                      <div className="w-12 h-9 rounded-lg overflow-hidden bg-[#071A2E] relative shrink-0 border border-white/10">
                        {blog.coverImage ? (
                          <Image
                            src={blog.coverImage}
                            alt={blog.title}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#E0B669]/50">
                            <FileText className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 max-w-md">
                      <div className="flex flex-col">
                        <span className="font-medium text-white group-hover:text-[#E0B669] transition-colors line-clamp-1">
                          {blog.title}
                        </span>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#E9E8E3]/60 mt-1">
                          <span className="px-2 py-0.5 rounded bg-[#071A2E] border border-[#B7873A]/30 text-[#E0B669] font-medium">
                            {blog.category}
                          </span>
                          <span>•</span>
                          <span>{blog.authorName}</span>
                          <span>•</span>
                          <span>{blog.publishDate || "Draft"}</span>
                          {blog.featured && (
                            <span className="px-2 py-0.5 rounded bg-[#C89949]/20 border border-[#C89949]/40 text-[#E0B669] font-semibold">
                              Featured
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-[#071A2E]/90 text-[#E9E8E3]/80 border border-white/10">
                        /insights/{blog.slug}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <HelpCircle className="w-3 h-3" />
                          {blog.faqCount || 0} FAQs
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#C89949]/15 text-[#E0B669] border border-[#C89949]/35">
                          {blog.reviewCount || 0} Reviews
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Link
                          href={`/insights/${blog.slug}`}
                          target="_blank"
                          title="View Live Page"
                          className="p-2 rounded-lg text-[#E9E8E3]/65 hover:text-[#E0B669] hover:bg-white/5 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <button
                          type="button"
                          title="Edit Post"
                          onClick={() => handleStartEdit(blog)}
                          className="p-2 rounded-lg text-[#E9E8E3]/65 hover:text-[#E0B669] hover:bg-white/5 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          title="Delete Post"
                          onClick={() => setBlogToDelete(blog)}
                          className="p-2 rounded-lg text-[#E9E8E3]/55 hover:text-red-400 hover:bg-red-500/15 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer & Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 pb-8 text-xs sm:text-sm text-[#E9E8E3]/65">
        <div>
          Showing{" "}
          <span className="font-semibold text-[#E0B669]">{startItem}</span> to{" "}
          <span className="font-semibold text-[#E0B669]">{endItem}</span> of{" "}
          <span className="font-semibold text-[#E0B669]">
            {totalFilteredCount}
          </span>{" "}
          articles
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 rounded-lg border border-[#B7873A]/30 bg-[#0a233d]/80 text-[#E0B669] text-xs font-semibold hover:border-[#C89949] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Prev
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => {
            const isCurrent = pg === currentPage;
            return (
              <button
                key={pg}
                type="button"
                onClick={() => setCurrentPage(pg)}
                className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all cursor-pointer ${isCurrent
                  ? "bg-[#C89949] text-[#071A2E] shadow-md"
                  : "bg-[#0a233d]/80 border border-[#B7873A]/25 text-[#E9E8E3]/80 hover:border-[#C89949] hover:text-[#E0B669]"
                  }`}
              >
                {pg}
              </button>
            );
          })}

          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-1.5 rounded-lg border border-[#B7873A]/30 bg-[#0a233d]/80 text-[#E0B669] text-xs font-semibold hover:border-[#C89949] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Next
          </button>
        </div>
      </div>

      {/* Manage Categories Modal */}
      {showCategoriesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#040D18]/85 backdrop-blur-md p-4">
          <div className="bg-[#071A2E] rounded-2xl p-6 max-w-md w-full shadow-2xl border border-[#B7873A]/40">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#C89949]/15 border border-[#C89949]/35 text-[#E0B669] flex items-center justify-center">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-medium text-white">
                    Manage Blog Categories
                  </h3>
                  <p className="text-[11px] text-[#E9E8E3]/60">
                    Stored dynamically in Firestore `blogCategories`
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCategoriesModal(false)}
                className="p-1.5 rounded-lg text-[#E9E8E3]/60 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="flex items-center gap-2 mb-4">
              <input
                type="text"
                placeholder="New category name..."
                value={newCategoryInput}
                onChange={(e) => setNewCategoryInput(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl bg-[#0a233d] border border-white/15 text-xs text-white placeholder-white/35 focus:outline-none focus:border-[#C89949]"
              />
              <button
                type="submit"
                disabled={isSavingCategory || !newCategoryInput.trim()}
                className="px-4 py-2 rounded-xl bg-[#C89949] hover:bg-[#E0B669] text-[#071A2E] text-xs font-semibold disabled:opacity-50 cursor-pointer"
              >
                {isSavingCategory ? "Saving..." : "Add"}
              </button>
            </form>

            <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-2 pr-1">
              {dbCategories.length === 0 ? (
                <p className="text-xs text-[#E9E8E3]/55 text-center py-6">
                  No categories stored in Firestore yet.
                </p>
              ) : (
                dbCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#0a233d]/80 border border-white/10 text-xs text-white"
                  >
                    <span className="truncate">{cat.name}</span>
                    {!cat.id.startsWith("derived-") ? (
                      <button
                        type="button"
                        onClick={() => handleRemoveCategory(cat)}
                        className="p-1 rounded-md text-red-400 hover:bg-red-500/15 cursor-pointer"
                        title="Remove category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span className="text-[10px] text-[#E0B669]/70 uppercase tracking-wider">
                        From Blogs
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {blogToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#040D18]/85 backdrop-blur-md p-4">
          <div className="bg-[#071A2E] rounded-2xl p-6 max-w-md w-full shadow-2xl border border-[#B7873A]/40">
            <div className="flex items-center gap-3 text-red-400 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-lg font-medium text-white">
                Delete Insight Article?
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-[#E9E8E3]/75 mb-5 leading-relaxed">
              Are you sure you want to permanently delete{" "}
              <strong className="text-[#E0B669]">
                &quot;{blogToDelete.title}&quot;
              </strong>
              ? This will clean up associated Storage images, attached FAQs and Reviews, and remove the article completely.
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setBlogToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#E9E8E3]/80 bg-[#0a233d] border border-white/15 hover:bg-white/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-500 text-white flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Permanently</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

