"use client";

import React from "react";
import { Trash2 } from "lucide-react";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  leadName?: string;
  isDeleting?: boolean;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  leadName,
  isDeleting = false,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#040D18]/85 backdrop-blur-md">
      <div className="w-full max-w-sm bg-[#071A2E] rounded-2xl shadow-2xl border border-[#B7873A]/40 p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 mx-auto flex items-center justify-center mb-4">
          <Trash2 className="w-6 h-6" />
        </div>

        <h3 className="text-base font-semibold text-white mb-1">
          Delete Lead Submission?
        </h3>
        <p className="text-xs text-[#E9E8E3]/70 mb-6 leading-relaxed">
          Are you sure you want to delete the submission for{" "}
          <span className="font-semibold text-[#E0B669]">
            {leadName || "this lead"}
          </span>
          ? This action cannot be undone.
        </p>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 py-2.5 px-4 rounded-xl border border-white/15 bg-[#0a233d] text-[#E9E8E3] text-xs font-semibold hover:bg-white/10 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

