"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Calendar,
  SlidersHorizontal,
  ArrowUpDown,
  ChevronDown,
  Check,
  X,
} from "lucide-react";
import { LeadFilters } from "@/lib/types/lead";
import { SOLV_SERVICE_OPTIONS } from "@/lib/constants/admin";

interface FilterBarProps {
  filters: LeadFilters;
  onChange: (newFilters: Partial<LeadFilters>) => void;
  availableServices?: readonly string[];
}

export default function FilterBar({
  filters,
  onChange,
  availableServices = SOLV_SERVICE_OPTIONS,
}: FilterBarProps) {
  const [openDropdown, setOpenDropdown] = useState<"date" | "filter" | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const dateLabels: Record<string, string> = {
    all: "All Dates",
    today: "Today",
    "7days": "Last 7 Days",
    "30days": "Last 30 Days",
  };

  const isFilterActive = Boolean(
    (filters.status && filters.status !== "All") ||
      (filters.service && filters.service !== "All")
  );

  const isDateActive = Boolean(
    filters.dateRange && filters.dateRange !== "all"
  );

  const hasAnyFilter = Boolean(
    filters.search || isFilterActive || isDateActive
  );

  const handleToggleSort = () => {
    onChange({ sortBy: filters.sortBy === "newest" ? "oldest" : "newest" });
  };

  const handleClearAll = () => {
    onChange({
      search: "",
      status: undefined,
      service: undefined,
      dateRange: "all",
      page: 1,
    });
    setOpenDropdown(null);
  };

  return (
    <div ref={containerRef} className="w-full space-y-2.5 pt-1">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 sm:gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-full lg:max-w-md">
          <Search className="w-4 h-4 text-[#E0B669]/75 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filters.search || ""}
            onChange={(e) => onChange({ search: e.target.value, page: 1 })}
            placeholder="Search by name, email, phone, service or details..."
            className="w-full pl-9 sm:pl-10 pr-8 sm:pr-9 py-2.5 bg-[#0a233d]/80 border border-[#B7873A]/25 rounded-xl text-xs sm:text-sm text-white placeholder-white/35 shadow-inner focus:outline-none focus:border-[#C89949] focus:ring-1 focus:ring-[#C89949]/50 transition-all"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onChange({ search: "", page: 1 })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#E9E8E3]/55 hover:text-[#E0B669] p-1 cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Controls Row */}
        <div className="flex items-center gap-2 relative w-full lg:w-auto">
          {/* Date Filter Dropdown */}
          <div className="relative flex-1 sm:flex-none">
            <button
              type="button"
              onClick={() =>
                setOpenDropdown(openDropdown === "date" ? null : "date")
              }
              className={`w-full sm:w-auto flex items-center justify-between gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2.5 bg-[#0a233d]/80 border rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                openDropdown === "date" || isDateActive
                  ? "border-[#C89949] ring-1 ring-[#C89949]/40 text-[#E0B669]"
                  : "border-[#B7873A]/25 hover:border-[#C89949]/50 text-[#E9E8E3]"
              }`}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <Calendar className="w-3.5 h-3.5 text-[#E0B669] shrink-0" />
                <span className="truncate">
                  {dateLabels[filters.dateRange || "all"] || "All Dates"}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#E9E8E3]/50 shrink-0" />
            </button>

            {openDropdown === "date" && (
              <>
                <div
                  className="fixed inset-0 z-30 sm:hidden"
                  onClick={() => setOpenDropdown(null)}
                />
                <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-1.5 w-44 bg-[#0a233d] border border-[#B7873A]/35 rounded-xl shadow-2xl shadow-black/60 z-40 py-1.5 flex flex-col">
                  {[
                    { value: "all", label: "All Dates" },
                    { value: "today", label: "Today" },
                    { value: "7days", label: "Last 7 Days" },
                    { value: "30days", label: "Last 30 Days" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        onChange({
                          dateRange: opt.value as LeadFilters["dateRange"],
                          page: 1,
                        });
                        setOpenDropdown(null);
                      }}
                      className={`w-full px-3.5 py-2 text-left hover:bg-white/5 flex items-center justify-between text-xs sm:text-sm cursor-pointer ${
                        (filters.dateRange || "all") === opt.value
                          ? "font-semibold bg-[#C89949]/15 text-[#E0B669]"
                          : "text-[#E9E8E3]/85"
                      }`}
                    >
                      <span>{opt.label}</span>
                      {(filters.dateRange || "all") === opt.value && (
                        <Check className="w-3.5 h-3.5 text-[#E0B669]" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Filters Dropdown (Status & Service) */}
          <div className="relative flex-1 sm:flex-none">
            <button
              type="button"
              onClick={() =>
                setOpenDropdown(openDropdown === "filter" ? null : "filter")
              }
              className={`w-full sm:w-auto flex items-center justify-between gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2.5 bg-[#0a233d]/80 border rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                openDropdown === "filter" || isFilterActive
                  ? "border-[#C89949] ring-1 ring-[#C89949]/40 text-[#E0B669]"
                  : "border-[#B7873A]/25 hover:border-[#C89949]/50 text-[#E9E8E3]"
              }`}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#E0B669] shrink-0" />
                <span className="truncate">
                  {filters.status
                    ? `Status: ${filters.status}`
                    : filters.service
                    ? filters.service
                    : "Filters"}
                </span>
                {isFilterActive && (
                  <span className="w-2 h-2 rounded-full bg-[#C89949] shrink-0" />
                )}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#E9E8E3]/50 shrink-0" />
            </button>

            {openDropdown === "filter" && (
              <>
                <div
                  className="fixed inset-0 z-30 sm:hidden"
                  onClick={() => setOpenDropdown(null)}
                />
                <div className="absolute right-0 top-full mt-1.5 w-72 max-w-[calc(100vw-2rem)] bg-[#0a233d] border border-[#B7873A]/35 rounded-2xl shadow-2xl shadow-black/60 z-40 p-4 flex flex-col gap-3.5">
                  <div>
                    <h4 className="text-[11px] font-semibold text-[#E0B669] uppercase tracking-wider mb-1.5">
                      Filter by Status
                    </h4>
                    <select
                      value={filters.status || "All"}
                      onChange={(e) => {
                        onChange({
                          status:
                            e.target.value === "All"
                              ? undefined
                              : e.target.value,
                          page: 1,
                        });
                      }}
                      className="w-full px-3 py-2 border border-white/15 rounded-xl text-xs sm:text-sm text-white bg-[#071A2E] focus:outline-none focus:border-[#C89949]"
                    >
                      <option value="All">All Statuses</option>
                      <option value="New">New</option>
                      <option value="Contacted">Contacted</option>
                      <option value="In Progress">In Progress (Follow-up)</option>
                      <option value="Converted">Converted</option>
                      <option value="Archived">Archived (Not Interested)</option>
                    </select>
                  </div>

                  <div>
                    <h4 className="text-[11px] font-semibold text-[#E0B669] uppercase tracking-wider mb-1.5">
                      Filter by Service
                    </h4>
                    <select
                      value={filters.service || "All"}
                      onChange={(e) => {
                        onChange({
                          service:
                            e.target.value === "All"
                              ? undefined
                              : e.target.value,
                          page: 1,
                        });
                      }}
                      className="w-full px-3 py-2 border border-white/15 rounded-xl text-xs sm:text-sm text-white bg-[#071A2E] focus:outline-none focus:border-[#C89949]"
                    >
                      <option value="All">All Services</option>
                      {availableServices.map((srv) => (
                        <option key={srv} value={srv}>
                          {srv}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onChange({
                        status: undefined,
                        service: undefined,
                        page: 1,
                      });
                      setOpenDropdown(null);
                    }}
                    className="w-full mt-0.5 py-2 bg-[#071A2E] border border-[#B7873A]/35 hover:border-[#C89949] text-[#E0B669] font-semibold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer"
                  >
                    Reset Filter Options
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Sort Order Toggle Button */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={handleToggleSort}
              title={`Sort: ${
                filters.sortBy === "newest" ? "Newest First" : "Oldest First"
              }`}
              className="p-2.5 sm:px-3.5 sm:py-2.5 bg-[#0a233d]/80 border border-[#B7873A]/25 hover:border-[#C89949]/50 rounded-xl text-xs sm:text-sm font-medium text-[#E9E8E3] transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-[#E0B669]" />
              <span className="hidden sm:inline">
                {filters.sortBy === "newest" ? "Newest" : "Oldest"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Filter Chips */}
      {hasAnyFilter && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
          <span className="text-[11px] font-medium text-[#E9E8E3]/55">
            Active:
          </span>
          {filters.search && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#0a233d] border border-[#B7873A]/30 text-[#E9E8E3]">
              <span className="truncate max-w-[140px]">
                &quot;{filters.search}&quot;
              </span>
              <button
                type="button"
                onClick={() => onChange({ search: "", page: 1 })}
                className="text-[#E0B669] hover:text-red-400 font-bold ml-0.5 cursor-pointer"
              >
                ×
              </button>
            </span>
          )}
          {filters.dateRange && filters.dateRange !== "all" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#0a233d] border border-[#B7873A]/30 text-[#E9E8E3]">
              <span>{dateLabels[filters.dateRange]}</span>
              <button
                type="button"
                onClick={() => onChange({ dateRange: "all", page: 1 })}
                className="text-[#E0B669] hover:text-red-400 font-bold ml-0.5 cursor-pointer"
              >
                ×
              </button>
            </span>
          )}
          {filters.status && filters.status !== "All" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#0a233d] border border-[#B7873A]/30 text-[#E9E8E3]">
              <span>Status: {filters.status}</span>
              <button
                type="button"
                onClick={() => onChange({ status: undefined, page: 1 })}
                className="text-[#E0B669] hover:text-red-400 font-bold ml-0.5 cursor-pointer"
              >
                ×
              </button>
            </span>
          )}
          {filters.service && filters.service !== "All" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#0a233d] border border-[#B7873A]/30 text-[#E9E8E3]">
              <span>{filters.service}</span>
              <button
                type="button"
                onClick={() => onChange({ service: undefined, page: 1 })}
                className="text-[#E0B669] hover:text-red-400 font-bold ml-0.5 cursor-pointer"
              >
                ×
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={handleClearAll}
            className="text-[11px] font-medium text-[#E0B669] hover:text-red-400 underline ml-1 cursor-pointer"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

