"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { LogOut } from "lucide-react";

interface AdminHeaderProps {
  currentTab?: "leads" | "blogs";
  onTabChange?: (tab: "leads" | "blogs") => void;
}

export default function AdminHeader({
  currentTab,
  onTabChange,
}: AdminHeaderProps = {}) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const isLeadsActive = currentTab
    ? currentTab === "leads"
    : pathname?.startsWith("/admin/leads") || pathname === "/admin";
  const isBlogsActive = currentTab
    ? currentTab === "blogs"
    : pathname?.startsWith("/admin/blogs");

  const tabs = [
    { key: "leads", label: "Leads", href: "/admin/leads", isActive: isLeadsActive },
    { key: "blogs", label: "Insights / Blogs", href: "/admin/blogs", isActive: isBlogsActive },
  ];

  return (
    <header className="w-full border-b border-[#B7873A]/25 bg-[#071A2E]/90 backdrop-blur-md sticky top-0 z-30 shadow-lg shadow-black/20">
      <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left Side: SOLV Logo & Navigation Capsule */}
        <div className="flex items-center gap-3 sm:gap-7">
          <Link href="/" className="flex items-center group focus:outline-none">
            <Image
              src="/logogoo.svg"
              alt="SOLV"
              width={130}
              height={40}
              priority
              className="h-9 sm:h-10 w-auto object-contain transition-opacity group-hover:opacity-90"
            />
          </Link>

          <nav className="inline-flex items-center bg-[#0a233d]/90 p-1 rounded-xl border border-[#B7873A]/30 shadow-inner">
            {tabs.map((tab) => (
              <Link
                key={tab.key}
                href={tab.href}
                onClick={() => onTabChange?.(tab.key as "leads" | "blogs")}
                className={`px-3 sm:px-5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  tab.isActive
                    ? "bg-[#C89949] text-[#071A2E] shadow-md shadow-[#C89949]/20"
                    : "text-[#E9E8E3]/70 hover:text-[#E0B669] hover:bg-white/5"
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right Side: Logged-in User & Sign Out */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex items-center gap-2.5 pl-2">
            <div className="w-7 h-7 rounded-full bg-[#0a233d] border border-[#B7873A]/45 text-[#E0B669] font-semibold text-xs flex items-center justify-center shadow-inner">
              {user?.email ? user.email.charAt(0).toUpperCase() : "A"}
            </div>
            <span className="text-xs font-medium text-[#E9E8E3]/80 truncate max-w-[180px] lg:max-w-[240px]">
              {user?.email || "Admin"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => logout()}
            className="text-xs font-semibold flex items-center gap-1.5 border border-[#B7873A]/30 hover:border-red-400/50 hover:bg-red-500/15 hover:text-red-300 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl transition-colors text-[#E9E8E3]/80 bg-[#0a233d]/80 shadow-xs cursor-pointer shrink-0 group"
          >
            <LogOut className="w-3.5 h-3.5 text-[#E0B669] group-hover:text-red-300 transition-colors" />
            <span className="whitespace-nowrap">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}

