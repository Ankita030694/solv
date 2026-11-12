"use client";

import React, { useState, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  Loader2,
  ArrowLeft,
} from "lucide-react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/admin/leads");
    }
  }, [user, loading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.push("/admin/leads");
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || "";
      if (
        code === "auth/invalid-credential" ||
        code === "auth/user-not-found" ||
        code === "auth/wrong-password"
      ) {
        setError("Invalid email address or password. Please try again.");
      } else if (code === "auth/too-many-requests") {
        setError(
          "Access temporarily locked due to multiple failed attempts. Please try again later."
        );
      } else if (code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Authentication failed. Please try again."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#071A2E] text-white selection:bg-[#C89949] selection:text-[#071A2E] relative flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Ambient SOLV gold & navy glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[560px] bg-gradient-to-tr from-[#C89949]/15 via-[#0a233d]/60 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-[420px] h-[420px] bg-[#0a233d]/80 rounded-full blur-[120px] pointer-events-none" />

      {/* Back to Home Link */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-[#E9E8E3]/75 hover:text-[#E0B669] transition-colors duration-200 bg-[#0a233d]/80 hover:bg-[#0a233d] border border-[#B7873A]/30 px-3.5 py-2 rounded-xl backdrop-blur-md shadow-md"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to SOLV</span>
        </Link>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* SOLV Glassmorphic Card */}
        <div className="bg-[#0a233d]/80 backdrop-blur-xl border border-[#B7873A]/30 rounded-2xl sm:rounded-3xl p-7 sm:p-10 shadow-2xl shadow-black/50 relative">
          {/* Brand Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <Link
              href="/"
              className="mb-4 px-5 py-3 rounded-2xl bg-[#071A2E]/90 border border-[#B7873A]/30 hover:border-[#C89949]/60 transition-colors shadow-inner group"
            >
              <Image
                src="/logogoo.svg"
                alt="SOLV Logo"
                width={130}
                height={42}
                className="h-8 w-auto object-contain transition-transform group-hover:scale-[1.03]"
                priority
              />
            </Link>

            <h1 className="text-2xl sm:text-3xl font-normal tracking-tight text-white font-heading mt-1">
              Admin Portal
            </h1>
            <div className="flex items-center gap-1.5 mt-2.5 px-3.5 py-1 rounded-full bg-[#071A2E]/90 border border-[#B7873A]/35">
              <ShieldCheck className="w-3.5 h-3.5 text-[#E0B669]" />
              <span className="text-[11px] font-medium text-[#E0B669] uppercase tracking-[0.18em]">
                Restricted Advisory Access
              </span>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-500/15 border border-red-500/35 flex items-start gap-2.5 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label
                htmlFor="admin-email"
                className="block text-xs font-medium text-[#E9E8E3]/85 uppercase tracking-wider mb-2"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#E0B669]/80 pointer-events-none" />
                <input
                  id="admin-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@solvpartners.in"
                  className="w-full pl-10 pr-4 py-3 bg-[#071A2E]/80 border border-white/15 rounded-xl text-sm text-white placeholder-white/35 focus:outline-none focus:border-[#C89949] focus:ring-1 focus:ring-[#C89949]/50 transition-all shadow-inner"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-medium text-[#E9E8E3]/85 uppercase tracking-wider mb-2"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#E0B669]/80 pointer-events-none" />
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-11 py-3 bg-[#071A2E]/80 border border-white/15 rounded-xl text-sm text-white placeholder-white/35 focus:outline-none focus:border-[#C89949] focus:ring-1 focus:ring-[#C89949]/50 transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#E9E8E3]/55 hover:text-[#E0B669] transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-3.5 px-4 rounded-xl bg-[#C89949] hover:bg-[#E0B669] text-[#071A2E] text-sm font-semibold tracking-wide transition-all duration-200 shadow-xl shadow-black/30 hover:shadow-[#C89949]/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.99]"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <span>Access Advisory Dashboard</span>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-[#E9E8E3]/50 mt-6 tracking-wide">
          Authorized SOLV personnel only. All access attempts and activities are monitored.
        </p>
      </div>
    </div>
  );
}

