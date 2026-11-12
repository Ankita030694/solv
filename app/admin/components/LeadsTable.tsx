"use client";

import React, { useState, useEffect } from "react";
import {
  Copy,
  Check,
  Eye,
  MessageCircle,
  MoreVertical,
  ChevronDown,
  Trash2,
  ArrowUpDown,
  Mail,
  Phone,
  Inbox,
} from "lucide-react";
import { Lead, LeadStatus } from "@/lib/types/lead";

interface LeadsTableProps {
  leads: Lead[];
  loading?: boolean;
  onViewDetails: (lead: Lead) => void;
  onStatusChange: (id: string, newStatus: LeadStatus) => Promise<void>;
  onDeleteLead: (id: string) => void;
  onToggleSort: () => void;
  sortOrder?: "newest" | "oldest";
}

const statusColors: Record<
  LeadStatus,
  { bg: string; text: string; border: string; dot: string }
> = {
  New: {
    bg: "bg-[#C89949]/15",
    text: "text-[#E0B669]",
    border: "border-[#C89949]/35",
    dot: "bg-[#E0B669]",
  },
  Contacted: {
    bg: "bg-sky-500/15",
    text: "text-sky-300",
    border: "border-sky-500/30",
    dot: "bg-sky-400",
  },
  "In Progress": {
    bg: "bg-purple-500/15",
    text: "text-purple-300",
    border: "border-purple-500/30",
    dot: "bg-purple-400",
  },
  Converted: {
    bg: "bg-emerald-500/15",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
    dot: "bg-emerald-400",
  },
  Archived: {
    bg: "bg-white/5",
    text: "text-[#E9E8E3]/60",
    border: "border-white/15",
    dot: "bg-[#E9E8E3]/45",
  },
};

const ALL_STATUSES: LeadStatus[] = [
  "New",
  "Contacted",
  "In Progress",
  "Converted",
  "Archived",
];

function getStatusLabel(status: LeadStatus): string {
  if (status === "In Progress") return "Follow-up";
  if (status === "Archived") return "Not Interested";
  return status;
}

export default function LeadsTable({
  leads,
  loading = false,
  onViewDetails,
  onStatusChange,
  onDeleteLead,
  onToggleSort,
}: LeadsTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [activeStatusId, setActiveStatusId] = useState<string | null>(null);

  useEffect(() => {
    if (!activeStatusId && !activeMenuId) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && target.closest("[data-dropdown-container]")) {
        return;
      }
      setActiveStatusId(null);
      setActiveMenuId(null);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [activeStatusId, activeMenuId]);

  const handleCopyPhone = (id: string, phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleWhatsApp = (lead: Lead, e: React.MouseEvent) => {
    e.stopPropagation();
    const clean = lead.phone ? lead.phone.replace(/[^0-9]/g, "") : "";
    const url = clean
      ? `https://wa.me/${clean}?text=${encodeURIComponent(
          `Hi ${lead.fullName}, thank you for contacting SOLV Strategic Advisory! We would be glad to discuss your matter.`
        )}`
      : `mailto:${lead.email}`;
    window.open(url, "_blank");
  };

  return (
    <div className="w-full">
      {/* Desktop Table View */}
      <div className="hidden md:block w-full bg-[#0a233d]/65 backdrop-blur-md border border-[#B7873A]/25 rounded-2xl shadow-xl shadow-black/25 overflow-visible">
        <div
          className={`pb-3 ${
            activeStatusId || activeMenuId ? "overflow-visible" : "overflow-x-auto"
          }`}
        >
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#071A2E]/90 border-b border-[#B7873A]/25 text-[#E0B669] text-[11px] font-semibold uppercase tracking-[0.14em] select-none">
                <th
                  onClick={onToggleSort}
                  className="py-3.5 px-4 sm:px-6 cursor-pointer hover:text-white transition-colors first:rounded-tl-2xl"
                >
                  <div className="flex items-center gap-1.5">
                    <span>DATE</span>
                    <ArrowUpDown className="w-3 h-3 text-[#E0B669]/70" />
                  </div>
                </th>
                <th className="py-3.5 px-4">LEAD</th>
                <th className="py-3.5 px-4">EMAIL</th>
                <th className="py-3.5 px-4">PHONE</th>
                <th className="py-3.5 px-4">SERVICE</th>
                <th className="py-3.5 px-4 min-w-[200px]">MATTER DETAILS</th>
                <th className="py-3.5 px-4">STATUS</th>
                <th className="py-3.5 px-4 text-right pr-6 last:rounded-tr-2xl">
                  ACTIONS
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/10 text-xs sm:text-sm text-[#E9E8E3]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-[#E9E8E3]/60">
                    <div className="flex flex-col items-center justify-center gap-2.5">
                      <div className="w-6 h-6 border-2 border-[#C89949] border-t-transparent rounded-full animate-spin" />
                      <span>Loading enquiries...</span>
                    </div>
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-[#E9E8E3]/60">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <p className="font-semibold text-base text-white">
                        No leads found
                      </p>
                      <p className="text-xs text-[#E9E8E3]/55">
                        Try adjusting your search terms or filters.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                leads.map((lead) => {
                  const colors = statusColors[lead.status] || statusColors.New;
                  const formattedDate = new Date(
                    lead.createdAt
                  ).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  });
                  const displayService =
                    lead.services && lead.services.length > 0
                      ? lead.services[0]
                      : "Consultation";

                  return (
                    <tr
                      key={lead.id}
                      onClick={() => onViewDetails(lead)}
                      className="hover:bg-white/[0.04] transition-colors cursor-pointer group"
                    >
                      <td className="py-4 px-4 sm:px-6 whitespace-nowrap text-[#E9E8E3]/65 font-medium text-xs">
                        {formattedDate}
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#071A2E] border border-[#B7873A]/40 text-[#E0B669] font-semibold text-xs flex items-center justify-center shrink-0">
                            {lead.fullName.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-white group-hover:text-[#E0B669] transition-colors">
                            {lead.fullName}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          title={lead.email}
                          className="text-[#E9E8E3]/75 max-w-[170px] truncate block"
                        >
                          {lead.email}
                        </span>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        {lead.phone ? (
                          <div className="flex items-center gap-1.5 text-[#E9E8E3]">
                            <span className="font-medium">{lead.phone}</span>
                            <button
                              type="button"
                              title="Copy Phone Number"
                              onClick={(e) =>
                                handleCopyPhone(lead.id, lead.phone, e)
                              }
                              className="p-1 rounded text-[#E9E8E3]/50 hover:text-[#E0B669] hover:bg-white/5 transition-colors cursor-pointer"
                            >
                              {copiedId === lead.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-[#E9E8E3]/40 italic text-xs">
                            None
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-[#071A2E]/90 text-[#E0B669] border border-[#B7873A]/30">
                          {displayService}
                          {lead.services && lead.services.length > 1 && (
                            <span className="ml-1 text-[10px] text-[#E9E8E3]/55">
                              +{lead.services.length - 1}
                            </span>
                          )}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <p
                          title={lead.message}
                          className="text-[#E9E8E3]/70 max-w-[240px] truncate text-xs sm:text-sm"
                        >
                          {lead.message || "No description provided."}
                        </p>
                      </td>

                      <td
                        className="py-4 px-4 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex flex-col items-start gap-1">
                          <div className="relative" data-dropdown-container>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                setActiveStatusId(
                                  activeStatusId === lead.id ? null : lead.id
                                );
                              }}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${colors.bg} ${colors.text} ${colors.border} cursor-pointer hover:opacity-90 transition-all`}
                            >
                              <span>{lead.status}</span>
                              <ChevronDown className="w-3 h-3 opacity-80" />
                            </button>

                            {activeStatusId === lead.id && (
                              <div className="absolute left-0 top-full mt-2 w-[200px] bg-[#0a233d] border border-[#B7873A]/40 rounded-2xl shadow-2xl shadow-black/60 z-50 overflow-hidden">
                                <div className="px-4 py-2.5 border-b border-white/10">
                                  <span className="text-[10px] font-semibold text-[#E0B669] uppercase tracking-widest">
                                    Change Status
                                  </span>
                                </div>
                                <div className="py-1">
                                  {ALL_STATUSES.map((st) => {
                                    const isSelected = lead.status === st;
                                    const stColors = statusColors[st];
                                    return (
                                      <button
                                        key={st}
                                        type="button"
                                        onClick={async () => {
                                          await onStatusChange(lead.id, st);
                                          setActiveStatusId(null);
                                        }}
                                        className={`w-full flex items-center justify-between px-4 py-2.5 text-[13px] transition-colors cursor-pointer ${
                                          isSelected
                                            ? "bg-[#C89949]/15 text-[#E0B669]"
                                            : "text-[#E9E8E3]/80 hover:bg-white/5"
                                        }`}
                                      >
                                        <div className="flex items-center gap-3">
                                          <div
                                            className={`w-2 h-2 rounded-full ${stColors.dot}`}
                                          />
                                          <span className="font-medium">
                                            {getStatusLabel(st)}
                                          </span>
                                        </div>
                                        {isSelected && (
                                          <Check className="w-4 h-4 text-[#E0B669]" />
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${colors.dot}`}
                            />
                            <span>
                              {lead.score ? lead.score.toFixed(1) : "0.9"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td
                        className="py-4 px-4 whitespace-nowrap text-right pr-6"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            title="Open WhatsApp / Direct Chat"
                            onClick={(e) => handleWhatsApp(lead, e)}
                            className="w-8 h-8 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            title="View Full Details"
                            onClick={() => onViewDetails(lead)}
                            className="w-8 h-8 rounded-lg border border-[#B7873A]/30 bg-[#071A2E]/80 text-[#E0B669] hover:bg-[#C89949] hover:text-[#071A2E] hover:border-[#C89949] flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <div className="relative" data-dropdown-container>
                            <button
                              type="button"
                              title="More options"
                              onClick={() => {
                                setActiveStatusId(null);
                                setActiveMenuId(
                                  activeMenuId === lead.id ? null : lead.id
                                );
                              }}
                              className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                                activeMenuId === lead.id
                                  ? "border-[#C89949] text-[#E0B669] bg-[#C89949]/15"
                                  : "border-white/15 bg-[#071A2E]/80 text-[#E9E8E3]/75 hover:border-[#C89949]/50 hover:text-[#E0B669]"
                              }`}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {activeMenuId === lead.id && (
                              <div className="absolute right-0 top-full mt-2 w-[190px] bg-[#0a233d] border border-[#B7873A]/40 rounded-2xl shadow-2xl shadow-black/60 z-50 overflow-hidden">
                                <div className="px-4 py-2.5 border-b border-white/10">
                                  <span className="text-[10px] font-semibold text-[#E0B669] uppercase tracking-widest">
                                    Quick Actions
                                  </span>
                                </div>
                                <div className="py-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onViewDetails(lead);
                                      setActiveMenuId(null);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-[#E9E8E3] hover:bg-white/5 hover:text-[#E0B669] transition-colors cursor-pointer"
                                  >
                                    <Eye className="w-4 h-4 text-[#E0B669]/75" />
                                    <span>View Details</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      window.open(
                                        `mailto:${lead.email}`,
                                        "_blank"
                                      );
                                      setActiveMenuId(null);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-[#E9E8E3] hover:bg-white/5 hover:text-[#E0B669] transition-colors cursor-pointer"
                                  >
                                    <Mail className="w-4 h-4 text-[#E0B669]/75" />
                                    <span>Send Email</span>
                                  </button>

                                  <div className="my-1 border-t border-white/10" />

                                  <button
                                    type="button"
                                    onClick={() => {
                                      onDeleteLead(lead.id);
                                      setActiveMenuId(null);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-red-400 hover:bg-red-500/15 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4 text-red-400" />
                                    <span>Delete Lead</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile & Tablet Card View */}
      <div className="block md:hidden space-y-3.5">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={`m-skel-${i}`}
              className="bg-[#0a233d]/65 border border-[#B7873A]/20 rounded-2xl p-4 animate-pulse space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-white/10" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-28 bg-white/10 rounded" />
                    <div className="h-3 w-16 bg-white/5 rounded" />
                  </div>
                </div>
                <div className="h-6 w-16 bg-white/10 rounded-lg" />
              </div>
              <div className="h-9 bg-white/5 rounded-xl" />
              <div className="h-14 bg-white/5 rounded-xl" />
            </div>
          ))
        ) : leads.length === 0 ? (
          <div className="bg-[#0a233d]/65 border border-[#B7873A]/25 rounded-2xl p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-[#071A2E] border border-[#B7873A]/35 flex items-center justify-center mx-auto mb-3">
              <Inbox className="w-7 h-7 text-[#E0B669]" />
            </div>
            <p className="font-semibold text-sm text-white">
              No leads match your filter
            </p>
            <p className="text-xs text-[#E9E8E3]/60 mt-1">
              Try adjusting your filters or search terms.
            </p>
          </div>
        ) : (
          leads.map((lead) => {
            const leadStatus = lead.status || "New";
            const colors = statusColors[leadStatus] || statusColors.New;
            const initial = lead.fullName
              ? lead.fullName.charAt(0).toUpperCase()
              : "U";
            const formattedDate = lead.createdAt
              ? new Date(lead.createdAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "N/A";
            const cleanPhone = lead.phone
              ? lead.phone.replace(/[^0-9]/g, "")
              : "";
            const whatsappUrl = cleanPhone
              ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                  `Hi ${lead.fullName}, thank you for contacting SOLV Strategic Advisory! We would be glad to discuss your matter.`
                )}`
              : null;
            const displayService =
              lead.services && lead.services.length > 0
                ? lead.services[0]
                : "General Enquiry";
            const isMobileStatusOpen = activeStatusId === `m-${lead.id}`;

            return (
              <div
                key={lead.id}
                className="bg-[#0a233d]/70 backdrop-blur-md border border-[#B7873A]/25 rounded-2xl p-4 shadow-lg shadow-black/25 space-y-3.5"
              >
                <div className="flex items-start justify-between gap-2 relative">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[#071A2E] border border-[#B7873A]/40 text-[#E0B669] font-semibold text-sm flex items-center justify-center shrink-0">
                      {initial}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm text-white truncate">
                        {lead.fullName || "Unknown Lead"}
                      </h3>
                      <span className="text-[11px] text-[#E9E8E3]/55 block">
                        {formattedDate}
                      </span>
                    </div>
                  </div>

                  <div className="relative" data-dropdown-container>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveMenuId(null);
                        setActiveStatusId(
                          isMobileStatusOpen ? null : `m-${lead.id}`
                        );
                      }}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border cursor-pointer ${colors.bg} ${colors.text} ${colors.border}`}
                    >
                      <span>{leadStatus}</span>
                      <ChevronDown className="w-3 h-3 opacity-80" />
                    </button>

                    {isMobileStatusOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setActiveStatusId(null)}
                        />
                        <div className="absolute right-0 top-full mt-1.5 w-48 bg-[#0a233d] border border-[#B7873A]/40 rounded-2xl shadow-2xl z-50 overflow-hidden py-1">
                          <div className="px-3.5 py-2 border-b border-white/10">
                            <span className="text-[10px] font-semibold text-[#E0B669] uppercase tracking-widest">
                              Change Status
                            </span>
                          </div>
                          {ALL_STATUSES.map((st) => {
                            const isSelected = lead.status === st;
                            const stColors = statusColors[st];
                            return (
                              <button
                                key={st}
                                type="button"
                                onClick={async () => {
                                  await onStatusChange(lead.id, st);
                                  setActiveStatusId(null);
                                }}
                                className={`w-full flex items-center justify-between px-3.5 py-2 text-xs font-medium cursor-pointer transition-colors ${
                                  isSelected
                                    ? "bg-[#C89949]/15 text-[#E0B669] font-semibold"
                                    : "text-[#E9E8E3]/80 hover:bg-white/5"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-2 h-2 rounded-full ${stColors.dot}`}
                                  />
                                  <span>{getStatusLabel(st)}</span>
                                </div>
                                {isSelected && (
                                  <Check className="w-3.5 h-3.5 text-[#E0B669]" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                  {lead.email && (
                    <div className="flex items-center gap-2 bg-[#071A2E]/75 px-3 py-2 rounded-xl border border-white/10 truncate">
                      <Mail className="w-3.5 h-3.5 text-[#E0B669] shrink-0" />
                      <a
                        href={`mailto:${lead.email}`}
                        className="truncate font-medium text-[#E9E8E3] hover:text-[#E0B669]"
                      >
                        {lead.email}
                      </a>
                    </div>
                  )}

                  {lead.phone && (
                    <div className="flex items-center justify-between bg-[#071A2E]/75 px-3 py-2 rounded-xl border border-white/10">
                      <div className="flex items-center gap-2 truncate">
                        <Phone className="w-3.5 h-3.5 text-[#E0B669] shrink-0" />
                        <a
                          href={`tel:${lead.phone}`}
                          className="font-medium text-[#E9E8E3] hover:text-[#E0B669] truncate"
                        >
                          {lead.phone}
                        </a>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleCopyPhone(lead.id, lead.phone, e)}
                        className="text-[#E9E8E3]/55 hover:text-[#E0B669] p-0.5 cursor-pointer ml-1"
                        title="Copy phone"
                      >
                        {copiedId === lead.id ? (
                          <span className="text-[10px] text-emerald-400 font-semibold">
                            Copied
                          </span>
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-[#071A2E]/75 p-3 rounded-xl border border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold text-[#E9E8E3]/55 uppercase tracking-wider">
                      Requested Service
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-[#0a233d] text-[#E0B669] text-[11px] font-medium border border-[#B7873A]/30 truncate">
                      {displayService}
                    </span>
                  </div>
                  <p className="text-xs text-[#E9E8E3]/75 line-clamp-2 leading-relaxed">
                    {lead.message || "No matter description provided."}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#E9E8E3]/60 pt-0.5">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold border bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Score: {lead.score ? lead.score.toFixed(1) : "0.9"}
                  </span>

                  {lead.notes && (
                    <span className="text-[10px] font-medium text-[#E0B669] bg-[#C89949]/15 px-2 py-0.5 rounded-md border border-[#C89949]/30">
                      Has Notes
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10">
                  {whatsappUrl ? (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 py-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-semibold hover:bg-emerald-500/25 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onViewDetails(lead)}
                      className="flex items-center justify-center gap-1.5 py-2 bg-[#071A2E] border border-[#B7873A]/30 text-[#E0B669] rounded-xl text-xs font-semibold hover:bg-[#C89949] hover:text-[#071A2E] transition-colors cursor-pointer"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Contact</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onViewDetails(lead)}
                    className="flex items-center justify-center gap-1.5 py-2 bg-[#071A2E] border border-white/15 text-[#E9E8E3] rounded-xl text-xs font-semibold hover:border-[#C89949] hover:text-[#E0B669] transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Details</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteLead(lead.id)}
                    className="flex items-center justify-center gap-1.5 py-2 bg-red-500/15 border border-red-500/30 text-red-400 rounded-xl text-xs font-semibold hover:bg-red-500/25 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

