import React, { useEffect, useLayoutEffect, useRef } from "react";
import { Hero195 } from "./ui/hero-195";

interface FeaturesPageProps {
  onEnter: () => void;
  onNavigate: (path: string) => void;
}

export function FeaturesPage({ onEnter, onNavigate }: FeaturesPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Robust scroll to top on mount
  useEffect(() => {
    if (window.location.pathname !== "/features") {
      window.history.replaceState(null, "", "/features");
    }
    
    const scrollToTop = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      const rootEl = document.getElementById("root");
      if (rootEl) rootEl.scrollTop = 0;
      if (containerRef.current) {
        containerRef.current.scrollTop = 0;
      }
    };

    // Fire immediately, then cascade to beat any browser history scroll restoration
    scrollToTop();
    const t1 = setTimeout(scrollToTop, 10);
    const t2 = setTimeout(scrollToTop, 50);
    const t3 = setTimeout(scrollToTop, 150);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <div ref={containerRef} className="min-h-[100dvh] bg-slate-50 text-slate-900 overflow-y-auto overflow-x-hidden custom-scrollbar font-sans selection:bg-orange-500/30">
      <ScrollOverflowHandler />

      {/* Main Feature Component */}
      <Hero195 />

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="bg-slate-50 py-10 px-8 border-t border-slate-200 pb-24 md:pb-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Oryn Logo" className="w-4 h-4 object-contain grayscale opacity-70" />
            <span className="font-medium">© {new Date().getFullYear()} Oryn. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-900 font-medium transition-colors cursor-pointer" onClick={() => window.open("https://www.instagram.com/oryn.app?igsh=dmN3dGN5d25qM3Yy", "_blank")}>Instagram</span>
            <span className="hover:text-slate-900 font-medium transition-colors cursor-pointer" onClick={() => onNavigate("/privacy")}>Privacy</span>
            <span className="hover:text-slate-900 font-medium transition-colors cursor-pointer" onClick={() => onNavigate("/terms")}>Terms</span>
            <span className="hover:text-slate-900 font-medium transition-colors cursor-pointer" onClick={() => onNavigate("/refund")}>Refund</span>
          </div>
        </div>
      </footer>

      {/* ═══════════ MINIMALIST BOTTOM BAR ═══════════ */}
      <header className="fixed bottom-0 left-0 right-0 z-50 w-full bg-slate-50/95 backdrop-blur-md border-t border-slate-200/80">
        <div className="max-w-5xl mx-auto px-6 h-12 flex items-center justify-between">
          {/* Navigation links */}
          <div className="flex items-center gap-6 sm:gap-8">
            <button
              onClick={() => onNavigate("/")}
              className="text-sm font-semibold tracking-wide transition-colors cursor-pointer focus:outline-none text-slate-500 hover:text-slate-900"
            >
              Home
            </button>
            <button
              className="text-sm font-extrabold tracking-wide transition-colors cursor-pointer focus:outline-none text-slate-900"
            >
              Features
            </button>
            <button
              onClick={() => onNavigate("/pricing")}
              className="text-sm font-semibold tracking-wide transition-colors cursor-pointer focus:outline-none text-slate-500 hover:text-slate-900"
            >
              Pricing
            </button>
          </div>

          {/* CTA Button */}
          <button
            onClick={onEnter}
            className="px-4 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-90 hover:scale-[1.02] active:scale-95 text-white text-xs font-bold rounded-full transition-all cursor-pointer focus:outline-none shadow-md shadow-orange-500/10"
          >
            Try Demo
          </button>
        </div>
      </header>
    </div>
  );
}

function ScrollOverflowHandler() {
  useEffect(() => {
    const htmlEl = document.documentElement;
    const bodyEl = document.body;
    const rootEl = document.getElementById("root");
    const origHtml = htmlEl.style.overflow;
    const origBody = bodyEl.style.overflow;
    const origRoot = rootEl?.style.overflow || "";

    htmlEl.style.overflow = "auto";
    bodyEl.style.overflow = "auto";
    if (rootEl) rootEl.style.overflow = "auto";

    return () => {
      htmlEl.style.overflow = origHtml;
      bodyEl.style.overflow = origBody;
      if (rootEl) rootEl.style.overflow = origRoot;
    };
  }, []);
  return null;
}
