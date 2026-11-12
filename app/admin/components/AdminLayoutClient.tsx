"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import AdminHeader from "./AdminHeader";

export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (!loading && !user && !isLoginPage) {
      router.replace("/admin/login");
    }
  }, [user, loading, isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#071A2E] flex flex-col items-center justify-center gap-4 relative overflow-hidden select-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[460px] h-[460px] bg-gradient-to-tr from-[#C89949]/15 via-[#0a233d]/60 to-transparent rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="px-5 py-3.5 rounded-2xl bg-[#0a233d]/80 border border-[#B7873A]/30 shadow-2xl">
            <Image
              src="/logogoo.svg"
              alt="SOLV Logo"
              width={130}
              height={44}
              className="h-9 w-auto object-contain animate-pulse"
              priority
            />
          </div>

          <div className="flex items-center gap-2 mt-1">
            <Loader2 className="w-4 h-4 text-[#E0B669] animate-spin" />
            <span className="text-xs uppercase tracking-[0.22em] text-[#E9E8E3]/80 font-medium">
              Verifying Authorization...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#071A2E] text-[#E9E8E3] flex flex-col font-sans selection:bg-[#C89949] selection:text-[#071A2E]">
      <AdminHeader />
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-6">
        {children}
      </main>
    </div>
  );
}

