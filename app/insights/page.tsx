import type { Metadata } from "next";
import Navbar from "@/app/component/nav";
import Footer from "@/app/component/footer";
import FAQSection from "@/app/component/faq";
import CTASection from "@/app/component/cta";
import { INSIGHT_ARTICLES } from "@/data/insights";
import InsightsGrid from "./InsightsGrid";

export const metadata: Metadata = {
  title: "News & Insights | Thought Leadership & Strategic Analysis",
  description:
    "Considered strategic perspectives, corporate restructuring benchmarks, property succession frameworks, and asset governance insights from SOLV.",
  keywords: [
    "SOLV Insights",
    "Legal Analysis India",
    "Corporate Restructuring Insights",
    "Family Succession Frameworks",
    "Real Estate Advisory Articles",
    "Business Continuity Thought Leadership",
  ],
  alternates: {
    canonical: "/insights",
  },
  openGraph: {
    title: "News & Insights | SOLV Strategic Advisory",
    description:
      "Considered perspectives on commercial real estate, corporate restructuring, generational succession, and asset continuity.",
    url: "https://solvpartners.in/insights",
    siteName: "SOLV",
    images: [
      {
        url: "/about_hero_office.jpg",
        width: 1200,
        height: 630,
        alt: "SOLV News & Insights",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "News & Insights | SOLV Strategic Advisory",
    description:
      "Considered perspectives on commercial real estate, corporate restructuring, generational succession, and asset continuity.",
    images: ["/about_hero_office.jpg"],
  },
};

export default function InsightsPage() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#071A2E] text-white selection:bg-[#C89949] selection:text-[#071A2E] overflow-x-clip">
      {/* Sticky Top Navbar */}
      <Navbar forceScrolled={true} />

      <main className="flex-1 w-full max-w-8xl mx-auto px-6 sm:px-10 lg:px-12 pt-32 sm:pt-40 lg:pt-44 pb-20 sm:pb-28">
        {/* =========================================================================
            HERO HEADER: Pill, Editorial Heading, Subheading (SOLV Brand)
            ========================================================================= */}
        <div className="flex flex-col items-start max-w-4xl mb-14 sm:mb-20">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#B7873A]/30 bg-[#0a233d]/80 text-xs font-sans uppercase tracking-[0.24em] text-[#E0B669] mb-4 sm:mb-5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#E0B669] animate-pulse" />
            <span>BLOG</span>
          </div>

          {/* Main Editorial Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-[64px] font-normal leading-[1.06] tracking-tight text-[#FFFFFF] font-heading mb-5 sm:mb-6">
            News & Insights
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-lg lg:text-xl text-[#E9E8E3]/80 leading-relaxed font-normal max-w-3xl">
            Considered perspectives on <span className="text-white font-medium">commercial real estate, corporate restructuring, generational succession, and asset continuity</span> from SOLV&apos;s senior advisory practice.
          </p>
        </div>

        {/* =========================================================================
            CARDS GRID: Live Firestore Publications + Editorial Insights
            ========================================================================= */}
        <InsightsGrid staticArticles={INSIGHT_ARTICLES} />
      </main>

      {/* FAQ Section */}
      <FAQSection />

      {/* CTA Section */}
      <CTASection />

      {/* Footer */}
      <Footer />
    </div>
  );
}

