"use client";

import React from "react";
import { Users, Zap, CheckCircle2 } from "lucide-react";
import { LeadStats } from "@/lib/types/lead";

interface StatsCardsProps {
  stats: LeadStats;
  loading?: boolean;
}

export default function StatsCards({ stats, loading = false }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-3 gap-2.5 sm:gap-3 w-full lg:w-auto">
      {/* Total Leads Card */}
      <div className="flex items-center gap-2.5 sm:gap-3 bg-[#0a233d]/75 backdrop-blur-md border border-[#B7873A]/25 rounded-xl px-3 sm:px-4 py-2.5 shadow-lg shadow-black/20 hover:border-[#C89949]/45 transition-colors">
        <div className="w-9 h-9 rounded-lg bg-[#071A2E]/90 border border-[#B7873A]/30 text-[#E0B669] hidden sm:flex items-center justify-center shrink-0">
          <Users className="w-4 h-4 text-[#E0B669]" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] sm:text-xs font-medium text-[#E9E8E3]/65 tracking-tight truncate">
            Total Leads
          </div>
          <div className="text-lg sm:text-xl md:text-2xl font-semibold text-white leading-tight">
            {loading ? "–" : stats.totalLeads}
          </div>
        </div>
      </div>

      {/* New Leads Card */}
      <div className="flex items-center gap-2.5 sm:gap-3 bg-[#0a233d]/75 backdrop-blur-md border border-[#B7873A]/25 rounded-xl px-3 sm:px-4 py-2.5 shadow-lg shadow-black/20 hover:border-[#C89949]/45 transition-colors">
        <div className="w-9 h-9 rounded-lg bg-[#C89949]/15 border border-[#C89949]/35 text-[#E0B669] hidden sm:flex items-center justify-center shrink-0">
          <Zap className="w-4 h-4 fill-[#E0B669] text-[#E0B669]" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] sm:text-xs font-medium text-[#E9E8E3]/65 tracking-tight truncate">
            New
          </div>
          <div className="text-lg sm:text-xl md:text-2xl font-semibold text-[#E0B669] leading-tight">
            {loading ? "–" : stats.newLeads}
          </div>
        </div>
      </div>

      {/* Converted Card */}
      <div className="flex items-center gap-2.5 sm:gap-3 bg-[#0a233d]/75 backdrop-blur-md border border-[#B7873A]/25 rounded-xl px-3 sm:px-4 py-2.5 shadow-lg shadow-black/20 hover:border-[#C89949]/45 transition-colors">
        <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hidden sm:flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] sm:text-xs font-medium text-[#E9E8E3]/65 tracking-tight truncate">
            Converted
          </div>
          <div className="text-lg sm:text-xl md:text-2xl font-semibold text-emerald-400 leading-tight">
            {loading ? "–" : stats.convertedLeads}
          </div>
        </div>
      </div>
    </div>
  );
}

