import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, ArrowLeft, ChevronDown, X, Rocket, Check } from "lucide-react";

interface PricingPageProps {
  onEnter: () => void;
  onNavigate: (path: string) => void;
  onStartAuth: (planId?: string) => void;
}

export function PricingPage({ onEnter, onNavigate, onStartAuth }: PricingPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showProModal, setShowProModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "biannual">("biannual");

  const faqs = [
    {
      question: "Why doesn't Oryn have a free plan?",
      answer: "Consistency requires skin in the game. We've found that a small financial commitment drastically increases the chances that you'll actually show up and do the work. It also allows us to build a premium, ad-free product that respects your privacy and doesn't rely on selling your data."
    },
    {
      question: "How is this different from my current to-do list?",
      answer: "Standard to-do lists just track what you need to do today. Oryn bridges the gap between your daily tasks and your long-term ambitions. By combining habit streaks, daily planning, and goal tracking in one place, you actually see how your daily actions compound over time."
    },
    {
      question: "Can I cancel my subscription?",
      answer: "There is no long-term commitment. Your subscription remains active for the period you've purchased, and you can choose whether or not to renew when it expires."
    },
    {
      question: "Is my personal data secure?",
      answer: "Yes. We take data privacy seriously. Your information is stored securely, and we only use trusted providers such as Supabase and Razorpay to operate the service. We do not sell your personal information to third parties, and we collect only the data needed to provide and improve Oryn."
    }
  ];

  // Robust scroll to top on mount
  useEffect(() => {
    if (window.location.pathname !== "/pricing") {
      window.history.replaceState(null, "", "/pricing");
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

      {/* ═══════════ PRICING ═══════════ */}
      <div className="bg-slate-50 py-16 md:py-24 border-t border-slate-200/80 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #94a3b8 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        
        <div className="max-w-md md:max-w-xl mx-auto px-6 w-full relative z-10">


          <div className="text-center mb-10">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Choose your plan</h2>
          </div>

          <div className="flex flex-col gap-2.5">
            {/* Monthly Card */}
            <motion.button 
              onClick={() => setSelectedPlan('monthly')}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className={`w-full text-left rounded-xl px-4 py-3 flex items-center gap-3 transition-all cursor-pointer ${
                selectedPlan === 'monthly'
                  ? 'bg-white border-[1.5px] border-orange-500 shadow-[0_0_0_3px_rgba(249,115,22,0.08)]'
                  : 'bg-white border-[1.5px] border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-[1.5px] transition-all ${
                selectedPlan === 'monthly' ? 'border-orange-500 bg-orange-500' : 'border-slate-300'
              }`}>
                {selectedPlan === 'monthly' && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
              </div>
              <div className="flex-1 min-w-0 flex flex-col items-start justify-center">
                <span className={`text-[14px] font-bold leading-tight ${selectedPlan === 'monthly' ? 'text-slate-900' : 'text-slate-600'}`}>Monthly</span>
                <span className="text-slate-500 text-[11px] leading-tight mt-0.5">Less than ₹4/day</span>
              </div>
              <div className="text-right shrink-0 flex flex-col justify-center">
                <span className="text-xl font-black text-slate-900 leading-none">₹99</span>
                <span className="text-slate-400 text-[10px] font-semibold mt-1">/mo</span>
              </div>
            </motion.button>

            {/* 6 Months Card */}
            <motion.button 
              onClick={() => setSelectedPlan('biannual')}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.4 }}
              className={`w-full text-left rounded-xl px-4 py-3 flex items-center gap-3 relative transition-all cursor-pointer ${
                selectedPlan === 'biannual'
                  ? 'bg-white border-[1.5px] border-orange-500 shadow-[0_0_0_3px_rgba(249,115,22,0.08)]'
                  : 'bg-white border-[1.5px] border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="absolute -top-2 right-3 bg-orange-500 text-white text-[8px] px-2 py-[2px] rounded-full font-black tracking-wider uppercase leading-none">
                BEST VALUE
              </div>
              <div className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-[1.5px] transition-all ${
                selectedPlan === 'biannual' ? 'border-orange-500 bg-orange-500' : 'border-slate-300'
              }`}>
                {selectedPlan === 'biannual' && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
              </div>
              <div className="flex-1 min-w-0 flex flex-col items-start justify-center">
                <div className="flex items-center gap-1.5">
                  <span className={`text-[14px] font-bold leading-tight ${selectedPlan === 'biannual' ? 'text-slate-900' : 'text-slate-600'}`}>6 Months</span>
                  <span className="bg-emerald-500/10 text-emerald-600 text-[9px] font-black px-1.5 py-[2px] rounded-md uppercase tracking-wider leading-none">
                    58% OFF
                  </span>
                </div>
                <span className="text-slate-500 text-[11px] leading-tight mt-0.5">
                  <span className="text-emerald-600 font-semibold">Save ₹345</span> · ₹41.5/mo
                </span>
              </div>
              <div className="text-right shrink-0 flex flex-col justify-center">
                <span className="text-xl font-black text-slate-900 leading-none">₹249</span>
                <span className="text-slate-400 text-[10px] font-semibold mt-1">/6mo</span>
              </div>
            </motion.button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="mt-6 mb-6"
          >
            <div className="grid grid-cols-2 gap-x-2 gap-y-3 px-1">
              {[
                "Unlimited Goals & Habits",
                "Breakdown goals to daily actions",
                "Advanced Goal Analytics",
                "Daily Performance Comparison",
                "Sync across multiple devices",
                "Habit streaks with heatmaps",
                "Custom colors & themes",
                "Yearly heatmap view"
              ].map((feature, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="flex h-4 w-4 mt-0.5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shrink-0">
                    <Check className="h-2.5 w-2.5" strokeWidth={3} />
                  </div>
                  <span className="text-[12px] sm:text-[13px] font-medium text-slate-700 leading-snug">{feature}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mt-6"
          >
            <button
              onClick={() => onStartAuth(selectedPlan)}
              className="w-full h-11 flex items-center justify-center bg-gradient-to-r from-orange-400 to-amber-400 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl font-black text-[15px] transition-transform active:scale-[0.98] shadow-lg shadow-orange-500/15"
            >
              Get Oryn Pro — {selectedPlan === 'monthly' ? '₹99' : '₹249'}
            </button>
            <p className="text-center text-[11px] text-slate-400 font-medium mt-2">✓ Instant access after purchase</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mt-6 bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-7 text-slate-900 overflow-hidden shadow-xl shadow-slate-200/40"
          >
            <div className="text-center mb-6">
              <span className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold text-slate-700">
                🍕 Same Price. Different Outcome.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 text-center flex flex-col items-center justify-between">
                <div>
                  <div className="text-5xl mb-3 animate-bounce" style={{ animationDuration: '3s' }}>🍕</div>
                  <div className="font-black text-lg sm:text-xl text-slate-800">Pizza</div>
                  <div className="text-2xl sm:text-3xl font-black mt-2 text-slate-900">₹249</div>
                  <div className="text-slate-400 text-xs sm:text-sm mt-1">20 Minutes</div>
                </div>
                <div className="mt-5 h-2 bg-slate-200 rounded-full overflow-hidden w-full">
                  <div className="h-full w-[10%] bg-red-500 rounded-full" />
                </div>
              </div>

              <div className="bg-orange-500/[0.04] border border-orange-500/20 rounded-2xl p-5 text-center flex flex-col items-center justify-between">
                <div>
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center p-2 mb-3 shadow-lg shadow-orange-500/10 border border-orange-100 mx-auto">
                    <img src="/logo.png" alt="Oryn" className="w-full h-full object-contain" />
                  </div>
                  <div className="font-black text-lg sm:text-xl text-orange-600">Oryn</div>
                  <div className="text-2xl sm:text-3xl font-black mt-2 text-orange-600">₹249</div>
                  <div className="text-orange-500 text-xs sm:text-sm mt-1">180 Days</div>
                </div>
                <div className="mt-5 h-2 bg-orange-100/65 rounded-full overflow-hidden w-full">
                  <div className="h-full w-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full" />
                </div>
              </div>
            </div>

            <div className="text-center mt-7">
              <h3 className="text-xl sm:text-2xl font-black text-slate-800 leading-tight">
                One disappears in minutes.
              </h3>
              <h3 className="text-xl sm:text-2xl font-black text-orange-600 mt-1 leading-tight">
                One stays with you every day.
              </h3>
              <p className="text-slate-500 mt-4 text-xs sm:text-sm leading-relaxed">
                The cost is the same.<br />
                The outcome isn't.
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ═══════════ FAQ ═══════════ */}
      <div className="bg-slate-50 py-20 md:py-28 border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">Got questions?</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white border border-slate-200 rounded-2xl overflow-hidden transition-all hover:border-slate-300 shadow-sm">
                <button className="w-full text-left p-6 flex items-center justify-between font-bold text-base focus:outline-none text-slate-900" onClick={() => setOpenFaq(openFaq === index ? null : index)}>
                  {faq.question}
                  <ChevronDown size={18} className={`text-slate-400 shrink-0 ml-4 transition-transform duration-300 ${openFaq === index ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {openFaq === index && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                      <div className="p-6 pt-0 text-slate-600 text-sm leading-relaxed">{faq.answer}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>


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
          <div className="flex items-center gap-6 sm:gap-8">
            <button
              onClick={() => onNavigate("/features")}
              className="text-sm font-semibold tracking-wide transition-colors cursor-pointer focus:outline-none text-slate-500 hover:text-slate-900"
            >
              Features
            </button>
            <button
              className="text-sm font-extrabold tracking-wide transition-colors cursor-pointer focus:outline-none text-slate-900"
            >
              Pricing
            </button>
            <button
              onClick={() => {
                if (document.cookie.includes("oryn_customer_v1=true")) {
                  // @ts-ignore
                  if (typeof window.fbq === 'function') window.fbq('trackCustom', 'login_click_customer');
                  // @ts-ignore
                  if (typeof window.gtag === 'function') window.gtag('event', 'login_click_customer');
                  // @ts-ignore
                  if (typeof window.fbq === 'function') window.fbq('trackCustom', 'login_redirect_to_app');
                  // @ts-ignore
                  if (typeof window.gtag === 'function') window.gtag('event', 'login_redirect_to_app');
                  window.location.href = "https://oryn-app.com";
                } else {
                  // @ts-ignore
                  if (typeof window.fbq === 'function') window.fbq('trackCustom', 'login_click_non_customer');
                  // @ts-ignore
                  if (typeof window.gtag === 'function') window.gtag('event', 'login_click_non_customer');
                  // @ts-ignore
                  if (typeof window.fbq === 'function') window.fbq('trackCustom', 'login_show_pro_modal');
                  // @ts-ignore
                  if (typeof window.gtag === 'function') window.gtag('event', 'login_show_pro_modal');
                  setShowProModal(true);
                }
              }}
              className="text-sm font-semibold tracking-wide transition-colors cursor-pointer focus:outline-none text-slate-500 hover:text-orange-500"
            >
              Login
            </button>
          </div>

          <button
            onClick={onEnter}
            className="px-4 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-90 hover:scale-[1.02] active:scale-95 text-white text-xs font-bold rounded-full transition-all cursor-pointer focus:outline-none shadow-md shadow-orange-500/10"
          >
            Try Demo
          </button>
        </div>
      </header>

      {/* ═══════════ PRO REQUIRED MODAL ═══════════ */}
      <AnimatePresence>
        {showProModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-6"
            onClick={() => setShowProModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl border border-slate-200/80"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowProModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-400/20 mb-5">
                  <Rocket size={24} className="text-white" />
                </div>

                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  Oryn Pro Required
                </h3>

                <p className="text-slate-500 text-sm mt-3 leading-relaxed">
                  You don't have an active Oryn Pro plan yet.
                  <br />
                  <span className="text-slate-700 font-medium">Purchase Oryn Pro first</span> to unlock the app and start building consistency.
                </p>

                <div className="flex flex-col gap-3 w-full mt-7">
                  <button
                    onClick={() => {
                      setShowProModal(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="w-full h-12 flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-2xl font-bold text-sm transition-all active:scale-95 cursor-pointer shadow-md shadow-orange-500/20"
                  >
                    View Plans
                    <ArrowRight size={16} />
                  </button>
                  <button
                    onClick={() => setShowProModal(false)}
                    className="w-full h-11 flex items-center justify-center text-slate-500 hover:text-slate-700 rounded-2xl font-semibold text-sm transition-all cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
