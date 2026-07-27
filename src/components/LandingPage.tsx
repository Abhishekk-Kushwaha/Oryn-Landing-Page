import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, useInView } from "motion/react";
import {
  ArrowRight, Target, Activity, CalendarDays, LayoutDashboard,
  CheckCircle2, Zap, Star, Shield,
  ChevronDown, Check, Users, TrendingUp, Clock,
  Flame, BarChart3, Brain, Lock, Sparkles, X, Menu
} from "lucide-react";


// ─── Animated counter hook ───────────────────────────────────────
function useCountUp(end: number, duration = 2000, startOnView = true) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!startOnView || !isInView) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [end, duration, isInView, startOnView]);

  return { count, ref };
}

const reviews = [
  {
    platform: "twitter",
    author: "Justin Chen",
    handle: "@justin_dev",
    role: "Indie Maker",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80",
    quote: "honestly, tried Notion, ClickUp, Obsidian... ended up spending more time configuring templates than actually working. Oryn is the first one that just clicked. The daily habit loops are kinda addictive.",
    date: "Jun 4",
    likes: 184,
    retweets: 14,
    verified: true,
  },
  {
    platform: "appstore",
    author: "Hannah K.",
    role: "Freelance Designer",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80",
    quote: "ADHD Lifesaver! I rarely write App Store reviews but this app deserves it. The way goals link directly to daily habits makes so much sense. My ADHD brain actually stays on track. Focus mode is simple and keeps me off my phone.",
    date: "May 28",
    rating: 5,
    verified: true,
  },
  {
    platform: "producthunt",
    author: "Alex Rivera",
    role: "Product Lead",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80",
    quote: "Congrats on the launch! Been using the beta for 3 weeks and the weekly planner layout is incredibly clean. The visual streak rings make consistency feel like a game I actually want to win.",
    upvotes: 28,
    tag: "Hunter",
    date: "May 20",
    role_description: "Product Designer",
  },
  {
    platform: "reddit",
    subreddit: "r/productivity",
    author: "u/dev_flow",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80",
    quote: "Spent the last weekend migrating my routines from Todoist to Oryn. The friction to log a habit is basically zero compared to other tools. Visual design is top tier. The dark/light mode transitions on the landing dock are super satisfying.",
    upvotes: 142,
    comments: 18,
    date: "1d ago",
  },
  {
    platform: "twitter",
    author: "Sofia Martinez",
    handle: "@sofia_codes",
    role: "Software Engineer",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80",
    quote: "that feeling when your daily streak widget actually matches your desktop aesthetics 🫠 oryn is beautiful. kudos to the team for the micro-animations.",
    date: "2 days ago",
    likes: 52,
    retweets: 3,
    verified: false,
  },
  {
    platform: "playstore",
    author: "Marcus Aurelius Jr.",
    role: "Student",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80",
    quote: "Helped me survive finals week. The focus mode is simple but keeps me off my phone. Highly recommend for students who struggle with consistency.",
    date: "May 15",
    rating: 5,
    verified: true,
  },
];

interface ReviewItem {
  platform: string;
  author: string;
  handle?: string;
  role?: string;
  avatar: string;
  quote: string;
  date: string;
  likes?: number;
  retweets?: number;
  verified?: boolean;
  rating?: number;
  upvotes?: number;
  tag?: string;
  subreddit?: string;
  comments?: number;
}

function ReviewCard({ review, index }: { review: ReviewItem; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: (index % 3) * 0.1 }}
      className="bg-slate-50/50 border border-slate-100 rounded-3xl p-6 flex flex-col hover:shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:border-slate-200/80 transition-all duration-300 relative group text-left"
    >
      {/* Author Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-slate-800 text-sm truncate">{review.author}</span>
          </div>
        </div>
      </div>

      {/* Review Content */}
      <p className="text-[13px] sm:text-[13.5px] text-slate-600 leading-relaxed whitespace-pre-line">
        "{review.quote}"
      </p>
    </motion.div>
  );
}

export function LandingPage({ onEnter, onNavigate }: { onEnter: () => void; onNavigate: (path: string) => void }) {
  const [activeSection, setActiveSection] = useState("hero");



  // ─── Scroll Spy & URL History Updates ──────────────────────────────
  useEffect(() => {
    let lastActive = "hero";
    const handleScrollSpy = (e?: Event) => {
      if (window.location.pathname === "/features") {
        return;
      }
      // Resolve scroll position from either the scrolling container, document, or window
      let scrollY = 0;
      if (e && e.target && e.target !== document) {
        scrollY = (e.target as HTMLElement).scrollTop;
      } else {
        scrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
        if (scrollY === 0) {
          const container = document.querySelector(".overflow-y-auto");
          if (container) {
            scrollY = container.scrollTop;
          }
        }
      }

      let currentSection = scrollY < 80 ? "hero" : "exploring";

      if (currentSection !== lastActive) {
        lastActive = currentSection;
        setActiveSection(currentSection);

        // Update URL path/hash cleanly to match section
        if (currentSection === "hero") {
          if (window.location.pathname !== "/" || window.location.hash !== "") {
            window.history.replaceState(null, "", "/");
          }
        } else if (currentSection === "exploring") {
          if (window.location.pathname !== "/exploring") {
            window.history.replaceState(null, "", "/exploring");
          }
        }
      }
    };

    window.addEventListener("scroll", handleScrollSpy, { passive: true });
    document.addEventListener("scroll", handleScrollSpy, { passive: true, capture: true });

    // Initial trigger
    handleScrollSpy();

    return () => {
      window.removeEventListener("scroll", handleScrollSpy);
      document.removeEventListener("scroll", handleScrollSpy, { capture: true });
    };
  }, []);

  const scrollToSection = (id: string) => {
    if (id === "hero") {
      const container = document.querySelector(".overflow-y-auto");
      if (container) {
        container.scrollTo({ top: 0, behavior: "smooth" });
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleNavClick = (sectionId: string) => {
    console.log("[LandingPage] handleNavClick called for:", sectionId);
    if (sectionId === "features") {
      console.log("[LandingPage] Navigating to /features");
      onNavigate("/features");
      return;
    }
    if (sectionId === "pricing") {
      console.log("[LandingPage] Navigating to /pricing");
      onNavigate("/pricing");
      return;
    }
    scrollToSection(sectionId);
    if (sectionId === "hero") {
      window.history.replaceState(null, "", "/");
    } else {
      window.history.replaceState(null, "", `/#${sectionId}`);
    }
  };

  // ─── Scroll-driven paper curl animation ───────────────────────
  const paperRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const [paperProgress, setPaperProgress] = useState(0); // 0 = paper not visible, 1 = fully arrived

  useEffect(() => {
    const handleScroll = () => {
      if (!heroRef.current) return;
      const heroHeight = heroRef.current.offsetHeight;
      const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
      // How far past the hero bottom the user has scrolled (0 to 1)
      // Start the animation when user has scrolled 60% of hero, complete when hero is fully scrolled past
      const start = heroHeight * 0.5;
      const end = heroHeight * 1.0;
      const progress = Math.max(0, Math.min(1, (scrollY - start) / (end - start)));
      setPaperProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    handleScroll(); // initial
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll, { capture: true });
    };
  }, []);

  // Generate random twinkling stars for the background
  const backgroundStars = React.useMemo(() => {
    return Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: Math.random() * 1.5 + 0.5, // 0.5px to 2px
      delay: `${Math.random() * 5}s`,
      duration: `${Math.random() * 4 + 3}s`,
      opacity: Math.random() * 0.7 + 0.15,
    }));
  }, []);

  // No login states needed

  // Animated counters
  const stat1 = useCountUp(12847);
  const stat2 = useCountUp(94);
  const stat3 = useCountUp(42);



  // Paper shadow calculation — intensifies as paper covers the hero
  const paperShadowOpacity = Math.min(paperProgress * 1.5, 1);

  return (
    <div className="min-h-screen bg-[#000000] text-slate-900 overflow-y-auto overflow-x-hidden custom-scrollbar font-sans selection:bg-orange-500/30">
      <ScrollOverflowHandler />

      {/* ═══════════ MINIMALIST BOTTOM BAR (always visible, theme-aware) ═══════════ */}
      <motion.header
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.8 }}
        className="fixed bottom-0 left-0 right-0 z-50 w-full backdrop-blur-xl transition-all duration-500 ease-in-out"
        style={{
          background: activeSection === "hero"
            ? "rgb(10,10,10)"
            : "rgba(255,255,255,0.92)",
          borderTopWidth: "1px",
          borderTopStyle: "solid",
          borderTopColor: activeSection === "hero"
            ? "rgba(255,255,255,0.06)"
            : "rgba(226,232,240,0.8)",
          boxShadow: activeSection === "hero"
            ? "none"
            : "0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)",
          WebkitBackdropFilter: activeSection === "hero" ? "none" : undefined,
          backdropFilter: activeSection === "hero" ? "none" : undefined,
        }}
      >
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Navigation links */}
          <div className="flex items-center gap-5 sm:gap-6">
            <button
              onClick={() => handleNavClick("features")}
              className="text-sm font-semibold tracking-wide cursor-pointer focus:outline-none transition-colors duration-500"
              style={{
                color: activeSection === "hero"
                  ? "rgba(255,255,255,0.6)"
                  : "rgb(100,116,139)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = activeSection === "hero"
                  ? "rgba(255,255,255,0.95)"
                  : "rgb(15,23,42)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = activeSection === "hero"
                  ? "rgba(255,255,255,0.6)"
                  : "rgb(100,116,139)";
              }}
            >
              Features
            </button>
            <button
              onClick={() => handleNavClick("pricing")}
              className="text-sm font-semibold tracking-wide cursor-pointer focus:outline-none transition-colors duration-500"
              style={{
                color: activeSection === "hero"
                  ? "rgba(255,255,255,0.6)"
                  : "rgb(100,116,139)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = activeSection === "hero"
                  ? "rgba(255,255,255,0.95)"
                  : "rgb(15,23,42)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = activeSection === "hero"
                  ? "rgba(255,255,255,0.6)"
                  : "rgb(100,116,139)";
              }}
            >
              Pricing
            </button>
          </div>

          {/* CTA Button */}
          <button
            onClick={onEnter}
            className="px-4 py-1.5 hover:scale-[1.02] active:scale-95 text-xs font-bold rounded-full transition-all duration-500 cursor-pointer focus:outline-none"
            style={{
              background: activeSection === "hero"
                ? "rgba(249,115,22,0.12)"
                : "linear-gradient(to right, #f97316, #f59e0b)",
              color: activeSection === "hero"
                ? "rgba(249,115,22,0.85)"
                : "#ffffff",
              border: activeSection === "hero"
                ? "1px solid rgba(249,115,22,0.25)"
                : "none",
              boxShadow: activeSection === "hero"
                ? "none"
                : "0 4px 12px rgba(249,115,22,0.15)",
            }}
          >
            Try Demo
          </button>
        </div>
      </motion.header>

      {/* ═══════════ HERO SECTION (exactly matching screenshot) ═══════════ */}
      <div id="hero" ref={heroRef} className="fixed top-0 left-0 right-0 z-0 w-full flex flex-col min-h-[100dvh] bg-[#000000] text-white overflow-hidden pb-16 md:pb-24">
        {/* Style block for twinkling and falling/shooting star animations */}
        <style dangerouslySetInnerHTML={{
          __html: `
          @keyframes twinkle-star {
            0%, 100% { opacity: 0.15; transform: scale(0.8); }
            50% { opacity: 0.85; transform: scale(1.2); }
          }
          @keyframes falling-star-diagonal {
            0% {
              transform: translate3d(0, 0, 0) rotate(-45deg) scale(0);
              opacity: 0;
            }
            3% {
              opacity: 0.9;
              transform: translate3d(-15px, 15px, 0) rotate(-45deg) scale(1);
            }
            12% {
              opacity: 0.9;
            }
            25% {
              transform: translate3d(-250px, 250px, 0) rotate(-45deg) scale(0.15);
              opacity: 0;
            }
            100% {
              transform: translate3d(-250px, 250px, 0) rotate(-45deg) scale(0);
              opacity: 0;
            }
          }
          @keyframes gradient-shimmer {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          } 
          @keyframes pulse-glow {
            0%, 100% { opacity: 0.4; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.15); }
          }
          @keyframes float-up {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-6px); }
          }
          .twinkle-dot {
            position: absolute;
            border-radius: 50%;
            background-color: white;
            animation: twinkle-star 4s ease-in-out infinite;
            pointer-events: none;
          }
          .falling-star {
            position: absolute;
            width: 80px;
            height: 1px;
            background: linear-gradient(90deg, rgba(255, 255, 255, 0.8), transparent);
            opacity: 0;
            pointer-events: none;
            transform-origin: left center;
          }
          .falling-star::after {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 2.5px;
            height: 2.5px;
            background: white;
            border-radius: 50%;
            box-shadow: 0 0 6px 1.5px white, 0 0 12px 3px rgba(255, 255, 255, 0.4);
          }
          .gradient-text-shimmer {
            background: linear-gradient(90deg, #f97316, #fbbf24, #f97316, #fbbf24);
            background-size: 300% 100%;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            animation: gradient-shimmer 4s ease-in-out infinite;
          }
          .hero-glow {
            animation: pulse-glow 5s ease-in-out infinite;
          }
        `}} />

        {/* Falling/twinkling stars background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Twinkling star dots */}
          {backgroundStars.map((star) => (
            <div
              key={star.id}
              className="twinkle-dot"
              style={{
                top: star.top,
                left: star.left,
                width: `${star.size}px`,
                height: `${star.size}px`,
                opacity: star.opacity,
                animationDelay: star.delay,
                animationDuration: star.duration,
              }}
            />
          ))}

          {/* Falling stars (meteor shooting effect) */}
          <div className="falling-star top-[15%] right-[10%]" style={{ animation: "falling-star-diagonal 7s linear infinite", animationDelay: "0.2s" }} />
          <div className="falling-star top-[30%] right-[25%]" style={{ animation: "falling-star-diagonal 10s linear infinite", animationDelay: "2.5s" }} />
          <div className="falling-star top-[10%] right-[45%]" style={{ animation: "falling-star-diagonal 8.5s linear infinite", animationDelay: "5.1s" }} />
          <div className="falling-star top-[45%] right-[15%]" style={{ animation: "falling-star-diagonal 12s linear infinite", animationDelay: "1.2s" }} />
          <div className="falling-star top-[20%] right-[65%]" style={{ animation: "falling-star-diagonal 9s linear infinite", animationDelay: "3.8s" }} />
          <div className="falling-star top-[35%] right-[50%]" style={{ animation: "falling-star-diagonal 11s linear infinite", animationDelay: "6.4s" }} />
        </div>

        {/* Spacer at top */}
        <div className="h-10 md:h-14" />

        {/* Central Display: Tilted Phones (Hero.jpeg) */}
        <main className="relative flex-1 flex flex-col items-center justify-center z-20 w-full max-w-lg mx-auto px-4 mt-2 md:mt-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="w-full flex justify-center relative"
          >
            <div className="relative group cursor-pointer" onClick={onEnter}>
              <img
                src="/Hero.jpeg"
                alt="Oryn App Mockups"
                className="w-full max-w-[340px] sm:max-w-[420px] md:max-w-[500px] lg:max-w-[580px] h-auto object-contain select-none transition-transform duration-500 group-hover:scale-[1.01]"
                draggable={false}
              />
              {/* This inner div ensures we have a dedicated interactive area over the mockup */}
              <div className="absolute inset-0 z-10 rounded-[2rem]"></div>
            </div>
          </motion.div>
        </main>

        {/* Bottom Logo, Branding & Tagline */}
        <div className="flex flex-col items-center z-20 pb-12 md:pb-16 px-4 relative">
          {/* Radial glow behind branding */}
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-[420px] h-[220px] rounded-full bg-gradient-to-b from-orange-500/15 via-amber-500/8 to-transparent blur-[80px] hero-glow pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col items-center text-center relative"
          >
            {/* App Title */}
            <motion.h1
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.3, type: "spring", stiffness: 100 }}
              className="text-4xl md:text-[44px] font-bold tracking-tight mb-4 text-white select-none drop-shadow-[0_0_35px_rgba(249,115,22,0.15)] hover:drop-shadow-[0_0_45px_rgba(249,115,22,0.25)] transition-all duration-500"
            >
              Oryn
            </motion.h1>

            {/* Decorative separator */}
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex items-center gap-3 mb-5"
            >
              <div className="w-8 h-[1px] bg-gradient-to-r from-transparent to-white/30" />
              <div className="w-1.5 h-1.5 rotate-45 bg-orange-400/70 shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
              <div className="w-8 h-[1px] bg-gradient-to-l from-transparent to-white/30" />
            </motion.div>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.6 }}
              className="text-lg md:text-xl text-white/50 font-light tracking-[0.15em] uppercase max-w-md px-4 select-none"
            >
              your consistency partner.
              <span className="gradient-text-shimmer font-semibold ml-1.5">every day</span>
            </motion.p>
          </motion.div>
        </div>
      </div>

      {/* ═══════════ HERO SPACER (pushes content below the fixed hero) ═══════════ */}
      <div className="relative z-0" style={{ height: '100dvh' }} />

      {/* ═══════════ LIGHT CONTENT PAPER OVERLAY ═══════════ */}
      <div
        ref={paperRef}
        className="relative z-10"
      >
        {/* The paper surface */}
        <div
          className="relative bg-slate-50"
          style={{
            boxShadow: `
              0 -6px 30px rgba(0,0,0,${0.35 * paperShadowOpacity}),
              0 -20px 70px rgba(0,0,0,${0.25 * paperShadowOpacity}),
              0 -1px 3px rgba(0,0,0,${0.5 * paperShadowOpacity})
            `,
          }}
        >
          {/* Top edge line — subtle light catch */}
          <div className="absolute top-0 left-0 right-0 h-[1px] z-20 pointer-events-none bg-white/40" />



          {/* ═══════════ WHY ORYN — EMOTIONAL HOOK + TRANSFORMATION ═══════════ */}
          <div className="bg-white pt-10 pb-12 md:pt-16 md:pb-20 overflow-hidden rounded-t-[2rem]">
            <div className="max-w-6xl mx-auto px-6">

              {/* Section label */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-6"
              >
                <span className="inline-flex items-center gap-2 text-orange-500 text-xs font-bold uppercase tracking-[0.2em] bg-orange-50 border border-orange-200/60 px-4 py-1.5 rounded-full">
                  <Flame size={13} /> Why Oryn
                </span>
              </motion.div>

              {/* ── Layer 1: The Emotional Hook ── */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-center mb-16 md:mb-20"
              >
                <h2 className="text-3xl md:text-5xl lg:text-[3.4rem] font-black tracking-tight text-slate-900 leading-[1.15] mb-5 max-w-4xl mx-auto">
                  <motion.span initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1, duration: 0.5 }} className="inline-block">Wake up.&nbsp;</motion.span>
                  <motion.span initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.25, duration: 0.5 }} className="inline-block">Open Oryn.&nbsp;</motion.span>
                  <motion.span initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.4, duration: 0.5 }} className="inline-block"><span className="text-orange-600">Move.</span></motion.span>
                </h2>
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className="text-slate-400 text-base md:text-lg flex items-center justify-center gap-2 flex-wrap"
                >
                  <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-3 py-0.5 rounded-full font-bold text-[13px] md:text-[15px] shadow-sm">See proof you're changing</span>
                  <span className="text-slate-300 hidden sm:inline">—</span>
                  <span className="text-slate-900 font-semibold">every week.</span>
                </motion.p>
              </motion.div>

              {/* ── Layer 2: Horizontal Transformation Cards with Visuals ── */}
              <div className="flex gap-4 md:gap-5 overflow-x-auto overflow-y-hidden pb-4 snap-x snap-mandatory scrollbar-hide -mx-6 px-6 lg:mx-0 lg:px-0">

                {/* ── Card 1: Today View ── */}
                <motion.div initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1, duration: 0.5 }}
                  className="relative rounded-2xl overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300 group w-[75vw] sm:w-[44vw] lg:w-[280px] snap-center shrink-0">
                  <div className="bg-slate-800 px-5 py-3 h-[155px]">
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-1.5">Before</p>
                    <p className="text-red-400/80 text-[16px] md:text-[18px] font-black leading-tight">Woke up, no clue what to do today</p>
                    <div className="flex flex-col gap-1.5 mt-2.5 opacity-50">
                      <div className="flex items-center gap-2.5"><div className="w-4 h-4 rounded border border-white/20" /><div className="h-2.5 w-24 rounded bg-white/12" /><div className="ml-auto text-[10px] text-red-400/70 font-bold">overdue</div></div>
                      <div className="flex items-center gap-2.5"><div className="w-4 h-4 rounded border border-white/20" /><div className="h-2.5 w-16 rounded bg-white/12" /><div className="ml-auto text-[10px] text-red-400/70 font-bold">missed</div></div>
                      <div className="flex items-center gap-2.5"><div className="w-4 h-4 rounded border border-dashed border-white/10" /><div className="h-2.5 w-20 rounded bg-white/8" /></div>
                    </div>
                  </div>
                  <div className="bg-orange-50 px-5 py-3 flex-1 flex flex-col border-t-2 border-orange-400">
                    <p className="text-orange-600 text-[10px] font-bold uppercase tracking-wider mb-1.5">After Oryn</p>
                    <p className="text-slate-900 text-[15px] md:text-[17px] font-black leading-tight mb-2">Your today, sorted. Stay on track 🎯</p>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2.5 bg-white rounded-xl px-3 py-1.5 border border-orange-200/50 shadow-sm">
                        <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center"><Check size={11} className="text-white" /></div>
                        <div className="h-2.5 w-24 rounded bg-orange-200/70" />
                        <div className="ml-auto text-[10px] text-emerald-600 font-extrabold">Done ✓</div>
                      </div>
                      <div className="flex items-center gap-2.5 bg-white rounded-xl px-3 py-1.5 border border-orange-100/60">
                        <div className="w-5 h-5 rounded-full border-2 border-orange-400" />
                        <div className="h-2.5 w-18 rounded bg-slate-200" />
                        <div className="ml-auto text-[10px] text-orange-500 font-extrabold">Focus →</div>
                      </div>
                      <div className="flex items-center gap-2.5 bg-white/60 rounded-xl px-3 py-1.5 border border-slate-100">
                        <div className="w-5 h-5 rounded-full border-2 border-slate-200" />
                        <div className="h-2.5 w-28 rounded bg-slate-100" />
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* ── Card 2: Progress Comparison ── */}
                <motion.div initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2, duration: 0.5 }}
                  className="relative rounded-2xl overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300 group w-[75vw] sm:w-[44vw] lg:w-[280px] snap-center shrink-0">
                  <div className="bg-slate-800 px-5 py-3 h-[155px]">
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-1.5">Before</p>
                    <p className="text-red-400/80 text-[16px] md:text-[18px] font-black leading-tight">No idea if improving</p>
                    <div className="flex items-end gap-2.5 h-14 mt-3.5 opacity-35">
                      {[38, 35, 40, 32, 37, 34, 36].map((h, i) => (
                        <div key={i} className="flex-1 rounded-t bg-white/15" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>
                  <div className="bg-blue-50 px-5 py-3 flex-1 flex flex-col border-t-2 border-blue-500">
                    <p className="text-blue-600 text-[10px] font-bold uppercase tracking-wider mb-1.5">After Oryn</p>
                    <p className="text-slate-900 text-base md:text-lg font-black leading-tight mb-2">Compare & grow 📈</p>
                    <div className="w-full aspect-[4/1] relative mt-1.5">
                      <svg viewBox="0 0 400 100" className="w-full h-full overflow-visible">
                        {/* Horizontal grid lines */}
                        <line x1="0" y1="20" x2="400" y2="20" stroke="#cbd5e1" strokeWidth="0.8" strokeOpacity="0.4" />
                        <line x1="0" y1="40" x2="400" y2="40" stroke="#cbd5e1" strokeWidth="0.8" strokeOpacity="0.4" />
                        <line x1="0" y1="60" x2="400" y2="60" stroke="#cbd5e1" strokeWidth="0.8" strokeOpacity="0.4" />
                        <line x1="0" y1="80" x2="400" y2="80" stroke="#cbd5e1" strokeWidth="0.8" strokeOpacity="0.4" />

                        {/* Last week line (pink, dotted/dashed) */}
                        <path
                          d="M 0 69 C 18 69, 18 62, 36 62 C 54 62, 54 52, 72 52 C 90 52, 90 50, 108 50 C 126 50, 126 57, 144 57 C 162 57, 162 73, 180 73 C 198 73, 198 60, 216 60 C 234 60, 234 55, 252 55 C 270 55, 270 59, 288 59 C 306 59, 306 58, 324 58 C 342 58, 342 47, 360 47 C 380 47, 380 68, 400 68"
                          fill="none"
                          stroke="#ec4899"
                          strokeWidth="2.5"
                          strokeDasharray="4 4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        {/* This week line (teal, solid) */}
                        <path
                          d="M 0 38 C 18 38, 18 47, 36 47 C 54 47, 54 25, 72 25 C 90 25, 90 31, 108 31 C 126 31, 126 34, 144 34 C 162 34, 162 90, 180 90 C 198 90, 198 66, 216 66 C 234 66, 234 20, 252 20 C 270 20, 270 79, 288 79 C 306 79, 306 84, 324 84 C 342 84, 342 63, 360 63 C 380 63, 380 63, 400 63"
                          fill="none"
                          stroke="#0f766e"
                          strokeWidth="3.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        {/* Last week dots (pink) */}
                        {[
                          { x: 0, y: 69 },
                          { x: 36, y: 62 },
                          { x: 72, y: 52 },
                          { x: 108, y: 50 },
                          { x: 144, y: 57 },
                          { x: 180, y: 73 },
                          { x: 216, y: 60 },
                          { x: 252, y: 55 },
                          { x: 288, y: 59 },
                          { x: 324, y: 58 },
                          { x: 360, y: 47 },
                          { x: 400, y: 68 }
                        ].map((pt, idx) => (
                          <circle key={`lw-${idx}`} cx={pt.x} cy={pt.y} r="4" fill="#ec4899" stroke="#fff" strokeWidth="1.2" />
                        ))}

                        {/* This week dots (teal) */}
                        {[
                          { x: 0, y: 38 },
                          { x: 36, y: 47 },
                          { x: 72, y: 25 },
                          { x: 108, y: 31 },
                          { x: 144, y: 34 },
                          { x: 180, y: 90 },
                          { x: 216, y: 66 },
                          { x: 252, y: 20 },
                          { x: 288, y: 79 },
                          { x: 324, y: 84 },
                          { x: 360, y: 63 },
                          { x: 400, y: 63 }
                        ].map((pt, idx) => (
                          <circle key={`tw-${idx}`} cx={pt.x} cy={pt.y} r="4" fill="#0f766e" stroke="#fff" strokeWidth="1.2" />
                        ))}
                      </svg>
                    </div>
                    <div className="flex items-center justify-center gap-4 mt-3">
                      <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-pink-500 border border-white shadow-sm" /><span className="text-[10px] text-slate-400 font-medium">Last week</span></div>
                      <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-teal-700 border border-white shadow-sm" /><span className="text-[10px] text-slate-700 font-bold">This week</span></div>
                    </div>
                  </div>
                </motion.div>

                {/* ── Card 3: Weekly/Monthly Planner ── */}
                <motion.div initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3, duration: 0.5 }}
                  className="relative rounded-2xl overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300 group w-[75vw] sm:w-[44vw] lg:w-[280px] snap-center shrink-0">
                  <div className="bg-slate-800 px-5 py-3 h-[155px]">
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-1.5">Before</p>
                    <p className="text-red-400/80 text-[16px] md:text-[18px] font-black leading-tight">Week flies by unplanned</p>
                    <div className="grid grid-cols-7 gap-1.5 mt-3">
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                        <div key={i} className="text-[9px] text-white/25 text-center font-bold">{d}</div>
                      ))}
                      {Array.from({ length: 14 }).map((_, i) => (
                        <div key={i} className="aspect-square rounded-md bg-white/5 border border-white/5" />
                      ))}
                    </div>
                  </div>
                  <div className="bg-emerald-50 px-5 py-3 flex-1 flex flex-col border-t-2 border-emerald-500">
                    <p className="text-emerald-600 text-[10px] font-bold uppercase tracking-wider mb-1.5">After Oryn</p>
                    <p className="text-slate-900 text-base md:text-lg font-black leading-tight mb-2">Plan weeks ahead 📅</p>
                    <div className="grid grid-cols-7 gap-1.5">
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                        <div key={i} className="text-[9px] text-emerald-700/60 text-center font-bold">{d}</div>
                      ))}
                      {[3, 1, 2, 0, 3, 1, 0, 2, 3, 1, 2, 0, 1, 2].map((tasks, i) => (
                        <div key={i} className={`aspect-square rounded-md flex flex-col items-center justify-center gap-[2px] border ${tasks > 0 ? 'bg-white border-emerald-200/60 shadow-sm' : 'bg-emerald-50/50 border-emerald-100/40'}`}>
                          {tasks > 0 && Array.from({ length: Math.min(tasks, 3) }).map((_, j) => (
                            <div key={j} className={`w-[65%] h-[2.5px] rounded-full ${j === 0 ? 'bg-emerald-400' : j === 1 ? 'bg-orange-400' : 'bg-blue-400'}`} />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* ── Card 4: Goal Tracker ── */}
                <motion.div initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.4, duration: 0.5 }}
                  className="relative rounded-2xl overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300 group w-[75vw] sm:w-[44vw] lg:w-[280px] snap-center shrink-0">
                  <div className="bg-slate-800 px-5 py-3 h-[155px]">
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-1.5">Before</p>
                    <p className="text-red-400/80 text-[16px] md:text-[18px] font-black leading-tight">Goals forgotten</p>
                    <div className="flex flex-col gap-2 mt-3 opacity-40">
                      <div><div className="h-2 rounded-full bg-white/10 w-full"><div className="h-full rounded-full bg-white/15 w-[12%]" /></div><div className="text-[9px] text-white/20 mt-0.5">Learn React · ??%</div></div>
                      <div><div className="h-2 rounded-full bg-white/10 w-full"><div className="h-full rounded-full bg-white/15 w-[6%]" /></div><div className="text-[9px] text-white/20 mt-0.5">Get Fit · ??%</div></div>
                    </div>
                  </div>
                  <div className="bg-purple-50 px-5 py-3 flex-1 flex flex-col border-t-2 border-purple-500">
                    <p className="text-purple-600 text-[10px] font-bold uppercase tracking-wider mb-1.5">After Oryn</p>
                    <p className="text-slate-900 text-base md:text-lg font-black leading-tight mb-2">Know where you lag 🎯</p>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3 bg-white rounded-xl px-3.5 py-3 border border-purple-100/60 shadow-sm">
                        <svg width="34" height="34" viewBox="0 0 34 34"><circle cx="17" cy="17" r="13" fill="none" stroke="#e9d5ff" strokeWidth="3.5" /><circle cx="17" cy="17" r="13" fill="none" stroke="#a855f7" strokeWidth="3.5" strokeDasharray="81.7" strokeDashoffset="24.5" strokeLinecap="round" transform="rotate(-90 17 17)" /></svg>
                        <div className="flex-1"><div className="text-xs font-bold text-slate-800">Learn React</div><div className="text-[10px] text-emerald-600 font-extrabold">On track · 70%</div></div>
                      </div>
                      <div className="flex items-center gap-3 bg-white rounded-xl px-3.5 py-3 border border-red-100/60 shadow-sm">
                        <svg width="34" height="34" viewBox="0 0 34 34"><circle cx="17" cy="17" r="13" fill="none" stroke="#fecaca" strokeWidth="3.5" /><circle cx="17" cy="17" r="13" fill="none" stroke="#ef4444" strokeWidth="3.5" strokeDasharray="81.7" strokeDashoffset="57.2" strokeLinecap="round" transform="rotate(-90 17 17)" /></svg>
                        <div className="flex-1"><div className="text-xs font-bold text-slate-800">Get Fit</div><div className="text-[10px] text-red-500 font-extrabold">Behind · 30% ↓</div></div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* ── Card 5: Habits ── */}
                <motion.div initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.5, duration: 0.5 }}
                  className="relative rounded-2xl overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300 group w-[75vw] sm:w-[44vw] lg:w-[280px] snap-center shrink-0">
                  <div className="bg-slate-800 px-5 py-3 h-[155px]">
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-1.5">Before</p>
                    <p className="text-red-400/80 text-[16px] md:text-[18px] font-black leading-tight">Streak dies at day 3</p>
                    <div className="flex gap-1.5 items-center mt-3">
                      {[true, true, true, false, false, false, false].map((done, i) => (
                        <div key={i} className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${done ? 'bg-white/15 text-white/40' : 'bg-white/5 border border-dashed border-white/12 text-white/20'}`}>
                          {done ? '✓' : '×'}
                        </div>
                      ))}
                    </div>
                    <div className="text-[10px] text-red-400/50 mt-1.5 font-bold">🔥 Streak lost</div>
                  </div>
                  <div className="bg-amber-50 px-5 py-3 flex-1 flex flex-col border-t-2 border-amber-500">
                    <p className="text-amber-600 text-[10px] font-bold uppercase tracking-wider mb-1.5">After Oryn</p>
                    <p className="text-slate-900 text-base md:text-lg font-black leading-tight mb-1">Consistency visible 🔥</p>

                    {/* Morning Meditation Card */}
                    <div className="bg-white rounded-2xl p-2.5 border border-amber-100 shadow-sm mt-1.5 flex flex-col gap-2">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-base">
                            🧘
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[11px] font-black text-slate-800 leading-tight">Morning Meditation</span>
                            <span className="text-[9px] text-slate-400 font-medium">Health · Daily</span>
                          </div>
                        </div>

                        {/* Streak Badge */}
                        <div className="flex items-center gap-0.5 bg-emerald-50 border border-emerald-100 rounded-full px-1.5 py-0.5 text-[8px] text-emerald-600 font-black">
                          <span>🔥</span>
                          <span>↑</span>
                          <span>57</span>
                        </div>
                      </div>

                      {/* Dot Grid */}
                      <div className="flex justify-between gap-[2px] mt-0.5">
                        {[
                          [true, true, true, true],
                          [true, true, true, true],
                          [true, true, true, true],
                          [true, true, true, true],
                          [true, true, true, true],
                          [true, true, true, true],
                          [true, true, true, true],
                          [true, true, true, true],
                          [true, false, true, true],
                          [true, true, true, true],
                          [true, true, true, true],
                          [true, true, true, true],
                          [true, true, true, true],
                          [true, true, true, true],
                          [true, true, true, true],
                          [true, true, true, true]
                        ].map((col, cIdx) => (
                          <div key={cIdx} className="flex flex-col gap-[2px]">
                            {col.map((done, rIdx) => (
                              <div
                                key={rIdx}
                                className={`w-1.5 h-1.5 rounded-[1.5px] ${done ? 'bg-emerald-400' : 'bg-slate-100'
                                  }`}
                              />
                            ))}
                          </div>
                        ))}
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-0.5 pt-1 border-t border-slate-50">
                        <span className="text-[9px] text-emerald-600 font-black">98% this month</span>

                        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-md px-1.5 py-0.5 text-[8px] text-slate-500 font-bold shadow-[0_1px_1px_rgba(0,0,0,0.02)]">
                          <span>✓</span>
                          <span>Completed</span>
                          <span className="text-slate-300 font-normal ml-0.5">&gt;</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

              </div>

            </div>
          </div>


          {/* ═══════════ MID-PAGE CTA ═══════════ */}
          <div className="bg-slate-50 border-y border-slate-200/80 py-10 md:py-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/[0.04] to-amber-500/[0.04]" />
            <div className="relative z-10 max-w-2xl mx-auto px-6">
              <h3 className="text-2xl md:text-3xl font-black text-slate-900 mb-4">Stop planning to plan. Start executing.</h3>
              <p className="text-slate-500 mb-6">Your goals don't need more motivation. They need consistency.</p>
              <button onClick={onEnter} className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-bold rounded-2xl shadow-md shadow-orange-500/20 hover:scale-[1.02] active:scale-95 transition-all inline-flex items-center gap-1.5 cursor-pointer">
                Try Oryn <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* ═══════════ THE CORE IDEA — EVERYTHING CONNECTED ═══════════ */}
          <div className="bg-white py-12 md:py-20 overflow-hidden relative">
            {/* Subtle dot grid background */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #94a3b8 1px, transparent 0)', backgroundSize: '32px 32px' }} />

            <div className="max-w-6xl mx-auto px-4 md:px-6 relative z-10">


              {/* Headline */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-center mb-10 md:mb-14"
              >
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 mb-3 leading-tight">
                  Everything you need.{' '}
                  <span className="text-orange-500">Finally connected.</span>
                </h2>
                <p className="text-slate-400 text-sm md:text-base max-w-lg mx-auto">
                  Goals, habits, planning, and progress tracking — together in one place.
                </p>
              </motion.div>

              {/* 5-Column Visual: Stacked on mobile, 5 columns on md and up */}
              <div className="grid grid-cols-1 md:grid-cols-[1fr_36px_auto_36px_1fr] items-center max-w-md md:max-w-5xl mx-auto gap-4 md:gap-0 px-4 md:px-0">

                {/* ═══ LEFT PANEL — Fragmented ═══ */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="bg-gradient-to-br from-red-50/70 to-slate-50/40 rounded-2xl md:rounded-3xl border border-red-200/30 p-5 md:p-6 w-full"
                >
                  <div className="text-xs md:text-[10px] lg:text-xs font-bold uppercase tracking-[0.15em] text-red-400/80 mb-3 text-center">Your tools today</div>

                  <div className="flex flex-col gap-2 md:gap-1.5 lg:gap-2">
                    {[
                      { icon: '🎯', label: 'Goal Tracking', sub: 'No clarity', rot: -2 },
                      { icon: '✅', label: 'Tasks', sub: 'Lost in lists', rot: 1.5 },
                      { icon: '📅', label: 'Planning', sub: 'Separate app', rot: -1 },
                      { icon: '🔥', label: 'Habits', sub: 'No tracking', rot: 2 },
                      { icon: '📈', label: 'Progress', sub: 'Invisible', rot: -1.5 },
                    ].map((item, i) => (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, y: 8 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.15 + i * 0.05 }}
                        className="flex items-center gap-2 md:gap-1.5 lg:gap-2 bg-white/70 border border-dashed border-red-200/40 rounded-xl md:rounded-lg lg:rounded-xl px-3 py-2 md:px-2 md:py-1.5 lg:px-3 lg:py-2"
                        style={{ transform: `rotate(${item.rot}deg)` }}
                      >
                        <span className="text-sm md:text-[11px] lg:text-sm leading-none shrink-0">{item.icon}</span>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs md:text-[8px] lg:text-[11px] font-semibold text-slate-500 block truncate">{item.label}</span>
                          <span className="text-[10px] md:text-[7px] lg:text-[9px] text-red-300 block truncate">{item.sub}</span>
                        </div>
                        <X className="text-red-300/70 shrink-0 w-3.5 h-3.5 md:w-2.5 md:h-2.5 lg:w-3 lg:h-3" />
                      </motion.div>
                    ))}
                  </div>

                  <div className="text-[10px] md:text-[7px] lg:text-[9px] text-red-400/60 font-bold mt-3 md:mt-1.5 lg:mt-3 text-center flex items-center justify-center gap-0.5">
                    <X className="w-3 h-3 md:w-2 md:h-2 lg:w-2.5 lg:h-2.5" /> 5 apps · 0 connection
                  </div>
                </motion.div>

                {/* ─── LEFT ARROW ─── */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                  className="flex md:flex-col items-center justify-center h-8 md:h-auto w-full md:w-auto"
                >
                  {/* Desktop arrow (horizontal) */}
                  <div className="hidden md:flex items-center justify-center w-full px-1">
                    <svg className="w-full h-4 text-slate-300" viewBox="0 0 36 16" fill="none">
                      {/* Dashed flow line */}
                      <line x1="2" y1="8" x2="28" y2="8" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 3" />
                      {/* Arrowhead */}
                      <path d="M26 4.5l4 3.5-4 3.5" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      {/* Flowing particle */}
                      <motion.circle
                        cx="2"
                        cy="8"
                        r="1.75"
                        fill="#94a3b8"
                        animate={{ cx: [2, 28] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                      />
                    </svg>
                  </div>
                  {/* Mobile arrow (vertical) */}
                  <div className="flex md:hidden items-center justify-center w-6 h-8">
                    <svg className="w-4 h-8 text-slate-300" viewBox="0 0 16 32" fill="none">
                      {/* Dashed flow line */}
                      <line x1="8" y1="2" x2="8" y2="24" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 3" />
                      {/* Arrowhead */}
                      <path d="M4.5 22l3.5 4 3.5-4" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      {/* Flowing particle */}
                      <motion.circle
                        cx="8"
                        cy="2"
                        r="1.75"
                        fill="#94a3b8"
                        animate={{ cy: [2, 24] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                      />
                    </svg>
                  </div>
                </motion.div>

                {/* ═══ CENTER — Oryn Logo (Clean) ═══ */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.3, type: 'spring', stiffness: 90 }}
                  className="flex flex-col items-center px-4 py-2 md:py-0"
                >
                  <div className="relative">
                    {/* Real Oryn Logo Circle — No Glow or concentric rings */}
                    <div className="relative w-20 h-20 md:w-28 md:h-28 rounded-full bg-white flex items-center justify-center shadow-lg shadow-slate-200/50 p-4.5 md:p-6 border border-slate-100/80">
                      <img src="/logo.png" alt="Oryn Logo" className="w-full h-full object-contain" />
                    </div>
                  </div>
                  <div className="mt-3 md:mt-4 text-center">
                    <div className="text-sm md:text-xl font-black text-slate-900 tracking-tight">ORYN</div>
                    <div className="text-[8px] md:text-[10px] font-medium text-slate-400 tracking-wider uppercase whitespace-nowrap">One System. Zero Chaos.</div>
                  </div>
                </motion.div>

                {/* ─── RIGHT ARROW ─── */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 }}
                  className="flex md:flex-col items-center justify-center h-8 md:h-auto w-full md:w-auto"
                >
                  {/* Desktop arrow (horizontal) */}
                  <div className="hidden md:flex items-center justify-center w-full px-1">
                    <svg className="w-full h-4" viewBox="0 0 36 16" fill="none">
                      <defs>
                        <linearGradient id="orangeGradH" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#fb923c" />
                          <stop offset="100%" stopColor="#f97316" />
                        </linearGradient>
                      </defs>
                      {/* Solid gradient flow line */}
                      <line x1="2" y1="8" x2="28" y2="8" stroke="url(#orangeGradH)" strokeWidth="2" strokeLinecap="round" />
                      {/* Arrowhead */}
                      <path d="M26 4.5l4 3.5-4 3.5" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      {/* Flowing particle */}
                      <motion.circle
                        cx="2"
                        cy="8"
                        r="2"
                        fill="#ea580c"
                        animate={{ cx: [2, 28] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                      />
                    </svg>
                  </div>
                  {/* Mobile arrow (vertical) */}
                  <div className="flex md:hidden items-center justify-center w-6 h-8">
                    <svg className="w-4 h-8" viewBox="0 0 16 32" fill="none">
                      <defs>
                        <linearGradient id="orangeGradV" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#fb923c" />
                          <stop offset="100%" stopColor="#f97316" />
                        </linearGradient>
                      </defs>
                      {/* Solid gradient flow line */}
                      <line x1="8" y1="2" x2="8" y2="24" stroke="url(#orangeGradV)" strokeWidth="2" strokeLinecap="round" />
                      {/* Arrowhead */}
                      <path d="M4.5 22l3.5 4 3.5-4" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      {/* Flowing particle */}
                      <motion.circle
                        cx="8"
                        cy="2"
                        r="2"
                        fill="#ea580c"
                        animate={{ cy: [2, 24] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                      />
                    </svg>
                  </div>
                </motion.div>

                {/* ═══ RIGHT PANEL — Connected ═══ */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.15 }}
                  className="bg-gradient-to-br from-emerald-50/70 to-orange-50/20 rounded-2xl md:rounded-3xl border border-emerald-200/30 p-5 md:p-6 w-full"
                >
                  <div className="text-xs md:text-[10px] lg:text-xs font-bold uppercase tracking-[0.15em] text-emerald-500 mb-3 text-center">With Oryn</div>

                  <div className="flex flex-col gap-2 md:gap-1.5 lg:gap-2">
                    {[
                      { icon: '🎯', label: 'Goals', sub: 'Track progress' },
                      { icon: '🔥', label: 'Habits', sub: 'Build streaks' },
                      { icon: '📅', label: 'Planning', sub: 'Weekly planner' },
                      { icon: '📈', label: 'Progress', sub: 'See growth' },
                      { icon: '☀️', label: 'Today', sub: 'Daily focus' },
                    ].map((item, i) => (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, y: 8 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.35 + i * 0.05 }}
                        className="flex items-center gap-2 md:gap-1.5 lg:gap-2 bg-white border border-emerald-200/40 rounded-xl md:rounded-lg lg:rounded-xl px-3 py-2 md:px-2 md:py-1.5 lg:px-3 lg:py-2 shadow-sm shadow-emerald-500/[0.04]"
                      >
                        <span className="text-sm md:text-[11px] lg:text-sm leading-none shrink-0">{item.icon}</span>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs md:text-[8px] lg:text-[11px] font-bold text-slate-700 block truncate">{item.label}</span>
                          <span className="text-[10px] md:text-[7px] lg:text-[9px] text-emerald-500/70 block truncate">{item.sub}</span>
                        </div>
                        <CheckCircle2 className="text-emerald-400 shrink-0 w-3.5 h-3.5 md:w-2.5 md:h-2.5 lg:w-3 lg:h-3" />
                      </motion.div>
                    ))}
                  </div>

                  <div className="text-xs md:text-[9px] lg:text-xs text-emerald-500 font-bold mt-3 text-center flex items-center justify-center gap-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 md:w-2.5 md:h-2.5 lg:w-3 lg:h-3" /> 1 app · everything connected
                  </div>
                </motion.div>
              </div>
            </div>
          </div>

          {/* ═══════════ TESTIMONIALS ═══════════ */}
          <div className="bg-white pt-10 pb-10 md:pt-12 md:pb-16">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4 text-slate-900">Loved by <span className="text-orange-500">high performers</span>.</h2>

              </div>
              {/* Mobile Layout (horizontal swipe/scroll deck) */}
              <div className="flex md:hidden gap-6 overflow-x-auto overflow-y-hidden pb-6 snap-x snap-mandatory scrollbar-hide -mx-6 px-6">
                {reviews.map((review, i) => (
                  <div key={i} className="w-[85vw] sm:w-[45vw] snap-center shrink-0">
                    <ReviewCard review={review} index={i} />
                  </div>
                ))}
              </div>

              {/* Desktop Layout (3-column masonry grid) */}
              <div className="hidden md:grid md:grid-cols-3 gap-6">
                {[
                  reviews.filter((_, idx) => idx % 3 === 0),
                  reviews.filter((_, idx) => idx % 3 === 1),
                  reviews.filter((_, idx) => idx % 3 === 2),
                ].map((col, colIdx) => (
                  <div key={colIdx} className="flex flex-col gap-6">
                    {col.map((review, i) => (
                      <ReviewCard key={i} review={review} index={colIdx + i * 3} />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>


          {/* ═══════════ FINAL CTA ═══════════ */}
          <div className="bg-white text-slate-900 py-10 md:py-16 text-center relative overflow-hidden border-t border-slate-200">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_center,rgba(249,115,22,0.1),transparent_50%)] pointer-events-none" />
            <div className="max-w-3xl mx-auto px-6 relative z-10">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-5 md:mb-6 text-slate-900">
                Your future self is <br className="hidden md:block" />waiting. <span className="text-orange-600 relative inline-block">
                  Start today.
                  <svg className="absolute -bottom-2 left-0 w-full h-3 text-orange-400 opacity-40" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
                  </svg>
                </span>
              </h2>
              <p className="text-slate-500 text-base sm:text-lg md:text-xl mb-8 md:mb-10 max-w-xl mx-auto">
                Every day without a system is a day your goals drift further. Oryn gives you the framework in under 2 minutes.
              </p>
              <button onClick={onEnter} className="group relative inline-flex items-center justify-center gap-3 bg-gradient-to-br from-orange-500 via-orange-400 to-amber-500 text-white px-9 py-3.5 rounded-full font-bold text-sm tracking-wide hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-300 overflow-hidden ring-1 ring-white/30 shadow-[0_12px_24px_-8px_rgba(249,115,22,0.4),inset_0_1px_2px_rgba(255,255,255,0.4)]">
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                <span className="relative z-10 flex items-center gap-2">
                  Try Interactive Demo <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform duration-300" />
                </span>
              </button>
              <div className="mt-8 flex items-center justify-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <div className="flex items-center justify-center w-3 h-3 rounded-full bg-emerald-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                </div>
                Free to explore — no card required
              </div>
            </div>
          </div>

          {/* ═══════════ FOOTER ═══════════ */}
          <footer className="bg-slate-50 pt-6 pb-24 px-8 border-t border-slate-200 md:pb-10">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="Oryn Logo" className="w-4 h-4 object-contain grayscale opacity-70" />
                <span className="font-medium">© {new Date().getFullYear()} Oryn. All rights reserved.</span>
              </div>
              <div className="flex items-center gap-6">
                <span className="hover:text-slate-900 font-medium transition-colors cursor-pointer" onClick={() => window.open("https://www.instagram.com/oryn.app?igsh=dmN3dGN5d25qM3Yy", "_blank")}>Instagram</span>
                <span className="hover:text-slate-900 font-medium transition-colors cursor-pointer">Privacy</span>
                <span className="hover:text-slate-900 font-medium transition-colors cursor-pointer">Terms</span>
              </div>
            </div>
          </footer>

          {/* ═══════════ ORYN LOGIN MODAL ═══════════ */}
          {/* Oryn login modal removed */}

        </div>{/* end paper surface */}
      </div>{/* end light content paper overlay */}
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
