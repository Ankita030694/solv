"use client";

import React, { useState } from "react";
import {
  X,
  Mail,
  Phone,
  Calendar,
  Tag,
  MessageSquare,
  Copy,
  Check,
  ExternalLink,
  Briefcase,
} from "lucide-react";
import { Lead, LeadStatus } from "@/lib/types/lead";

interface LeadDetailModalProps {
  lead: Lead | null;
  onClose: () => void;
  onStatusChange: (id: string, newStatus: LeadStatus) => Promise<void>;
  onSaveNotes: (id: string, notes: string) => Promise<void>;
}

export default function LeadDetailModal({
  lead,
  onClose,
  onStatusChange,
  onSaveNotes,
}: LeadDetailModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [notes, setNotes] = useState(lead?.notes || "");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  if (!lead) return null;

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      await onSaveNotes(lead.id, notes);
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2500);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const cleanPhone = lead.phone ? lead.phone.replace(/[^0-9]/g, "") : "";
  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
        `Hi ${lead.fullName}, thank you for reaching out to SOLV Strategic Advisory! We would be glad to discuss your matter.`
      )}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#040D18]/85 backdrop-blur-md">
      <div
        className="w-full max-w-2xl bg-[#071A2E] border border-[#B7873A]/40 rounded-2xl sm:rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#0a233d] border-b border-white/10 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#071A2E] border border-[#B7873A]/45 text-[#E0B669] font-semibold text-sm flex items-center justify-center">
              {lead.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-medium tracking-tight text-white">
                {lead.fullName}
              </h2>
              <span className="text-xs text-[#E9E8E3]/65">
                Submitted on{" "}
                {new Date(lead.createdAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#E9E8E3]/70 hover:text-[#E0B669] hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-[#E9E8E3] custom-scrollbar">
          {/* Status & Quick Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0a233d]/70 p-3.5 rounded-xl border border-[#B7873A]/25">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#E0B669]">
                Status:
              </span>
              <select
                value={lead.status}
                onChange={(e) =>
                  onStatusChange(lead.id, e.target.value as LeadStatus)
                }
                className="bg-[#071A2E] border border-white/15 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-[#C89949] cursor-pointer"
              >
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="In Progress">In Progress</option>
                <option value="Converted">Converted</option>
                <option value="Archived">Archived</option>
              </select>
            </div>

            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-300 rounded-lg text-xs font-semibold transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Chat on WhatsApp
                <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
              </a>
            )}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#0a233d]/65 p-3.5 rounded-xl border border-white/10">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-[#E0B669] uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Email
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(lead.email, "email")}
                  className="text-xs text-[#E9E8E3]/60 hover:text-[#E0B669] flex items-center gap-1 cursor-pointer"
                >
                  {copiedField === "email" ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <a
                href={`mailto:${lead.email}`}
                className="font-medium text-white hover:text-[#E0B669] hover:underline break-all"
              >
                {lead.email}
              </a>
            </div>

            <div className="bg-[#0a233d]/65 p-3.5 rounded-xl border border-white/10">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-[#E0B669] uppercase tracking-wider flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> Phone
                </span>
                {lead.phone && (
                  <button
                    type="button"
                    onClick={() => handleCopy(lead.phone, "phone")}
                    className="text-xs text-[#E9E8E3]/60 hover:text-[#E0B669] flex items-center gap-1 cursor-pointer"
                  >
                    {copiedField === "phone" ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400 font-medium">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              <span className="font-medium text-white">
                {lead.phone || "Not provided"}
              </span>
            </div>

            <div className="bg-[#0a233d]/65 p-3.5 rounded-xl border border-white/10">
              <span className="text-[11px] font-semibold text-[#E0B669] uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <Briefcase className="w-3.5 h-3.5" /> Source
              </span>
              <span className="font-medium text-white">
                {lead.source || "SOLV Contact Form"}
              </span>
            </div>

            <div className="bg-[#0a233d]/65 p-3.5 rounded-xl border border-white/10">
              <span className="text-[11px] font-semibold text-[#E0B669] uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <Calendar className="w-3.5 h-3.5" /> Lead Score
              </span>
              <span className="font-medium text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                {lead.score ? lead.score.toFixed(1) : "0.9"} (High Intent)
              </span>
            </div>
          </div>

          {lead.services && lead.services.length > 0 && (
            <div className="bg-[#0a233d]/65 p-3.5 rounded-xl border border-white/10">
              <span className="text-[11px] font-semibold text-[#E0B669] uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Tag className="w-3.5 h-3.5" /> Service Requested
              </span>
              <div className="flex flex-wrap gap-2">
                {lead.services.map((service) => (
                  <span
                    key={service}
                    className="px-3 py-1 bg-[#071A2E] text-[#E0B669] border border-[#B7873A]/35 rounded-full text-xs font-medium"
                  >
                    {service}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Matter Details Message */}
          <div className="bg-[#0a233d]/65 p-4 rounded-xl border border-white/10">
            <span className="text-[11px] font-semibold text-[#E0B669] uppercase tracking-wider block mb-2">
              Matter Details / Message
            </span>
            <p className="text-[#E9E8E3]/90 leading-relaxed whitespace-pre-wrap">
              {lead.message || "No message provided."}
            </p>
          </div>

          {/* Internal Notes Editor */}
          <div className="bg-[#0a233d]/65 p-4 rounded-xl border border-[#B7873A]/25">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-[#E0B669] uppercase tracking-wider">
                Internal Advisory Notes
              </span>
              {notesSaved && (
                <span className="text-xs text-emerald-400 font-medium">
                  Notes Saved!
                </span>
              )}
            </div>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add follow-up notes, consultation summaries, or action items..."
              className="w-full p-3 bg-[#071A2E]/90 border border-white/15 rounded-xl text-xs sm:text-sm text-white placeholder-white/35 focus:outline-none focus:border-[#C89949] resize-none mb-2.5"
            />
            <button
              type="button"
              disabled={isSavingNotes}
              onClick={handleSaveNotes}
              className="px-4 py-2 bg-[#C89949] hover:bg-[#E0B669] disabled:opacity-50 text-[#071A2E] rounded-xl text-xs font-semibold cursor-pointer transition-colors"
            >
              {isSavingNotes ? "Saving..." : "Save Notes"}
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-[#061729] border-t border-white/10 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#0a233d] border border-[#B7873A]/35 hover:border-[#C89949] text-[#E0B669] rounded-xl text-xs sm:text-sm font-semibold cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

