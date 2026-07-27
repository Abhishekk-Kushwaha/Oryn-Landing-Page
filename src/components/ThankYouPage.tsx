import React, { useEffect } from "react";
import { CheckCircle2, ArrowRight, Calendar, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { APP_NAME } from "../lib/brand";

interface PurchaseInfo {
  plan: string;
  amount: number;
  email: string;
  paymentId: string;
  expiryDate: string;
}

interface ThankYouPageProps {
  purchaseInfo: PurchaseInfo | null;
  onEnter: () => void;
}

export function ThankYouPage({ purchaseInfo, onEnter }: ThankYouPageProps) {
  // Safe default details if state is empty/refreshed
  const info = purchaseInfo || {
    plan: "Pro Membership",
    amount: 10,
    email: "your account email",
    paymentId: "TXN_MOCK_" + Math.random().toString(36).substring(2, 10).toUpperCase(),
    expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric"
    })
  };

  useEffect(() => {
    // If the payment ID is a mock ID, do not fire real conversion events to prevent skewing live data.
    if (info.paymentId.startsWith("TXN_MOCK_")) {
      console.log("[Analytics Mock] Thank You page preview/mock mode. Skipping real GTM purchase event.", {
        transaction_id: info.paymentId,
        value: info.amount,
        currency: "INR",
        items: [{ item_name: info.plan }]
      });
      return;
    }

    const trackingKey = `oryn_tracked_purchase_${info.paymentId}`;
    const alreadyTracked = localStorage.getItem(trackingKey);

    if (alreadyTracked === "true") {
      console.log(`[Analytics] Purchase ${info.paymentId} has already been tracked. Skipping to prevent double-counting/ROAS skew.`);
      return;
    }

    try {
      // Initialize GTM dataLayer if not already present
      (window as any).dataLayer = (window as any).dataLayer || [];
      
      // Push standardized GA4-compliant purchase event to dataLayer
      // This single push will be intercepted by GTM to fire GA4 (for analysis) and Meta Pixel (for ROAS optimization)
      (window as any).dataLayer.push({
        event: "purchase",
        ecommerce: {
          transaction_id: info.paymentId,
          value: info.amount,
          currency: "INR",
          items: [
            {
              item_id: info.plan.toLowerCase().replace(/\s+/g, "_"),
              item_name: info.plan,
              price: info.amount,
              quantity: 1
            }
          ]
        }
      });

      // Mark as tracked to prevent duplicates on refresh
      localStorage.setItem(trackingKey, "true");
      console.log(`[Analytics] Successfully pushed purchase event to GTM dataLayer for transaction: ${info.paymentId}`);
    } catch (err) {
      console.error("Failed to push purchase event to GTM dataLayer:", err);
    }
  }, [info]);

  return (
    <div className="relative min-h-[100dvh] flex items-center justify-center p-6 overflow-hidden select-none" style={{ background: "#f8fafc" }}>
      {/* Glow Backdrops */}
      <div
        className="pointer-events-none absolute top-[-20%] left-[-10%] h-[500px] w-[500px] rounded-full opacity-15 blur-[120px]"
        style={{ background: "radial-gradient(circle, #f97316, transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute bottom-[-10%] right-[-10%] h-[400px] w-[400px] rounded-full opacity-10 blur-[100px]"
        style={{ background: "radial-gradient(circle, #f59e0b, transparent 70%)" }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Animated Card Container */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-3xl p-8 border border-slate-200/80 shadow-[0_24px_70px_-20px_rgba(15,23,42,0.12)]"
          style={{ background: "rgba(255, 255, 255, 0.85)", backdropFilter: "blur(24px)" }}
        >
          {/* Subtle upper shine */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />

          {/* Success Badge */}
          <div className="flex flex-col items-center text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 15, stiffness: 200, delay: 0.1 }}
              className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 shadow-[0_8px_30px_-6px_rgba(249,115,22,0.4)]"
            >
              <CheckCircle2 className="h-8 w-8 text-white stroke-[2.5]" />
            </motion.div>
            
            <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-2">
              You are in!
            </h1>
            <p className="text-sm text-slate-500 leading-relaxed px-4 font-medium">
              Your purchase was completed successfully. Your {APP_NAME} Pro account is now active.
            </p>
          </div>

          {/* Receipt Details Box */}
          <div className="space-y-4 rounded-2xl border border-slate-200/60 bg-slate-50/80 p-5 mb-8">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 flex items-center gap-1.5 font-bold">
                <Sparkles className="h-3.5 w-3.5 text-orange-500" /> Plan
              </span>
              <span className="text-orange-600 font-bold text-xs bg-orange-500/10 border border-orange-500/20 px-2.5 py-0.5 rounded-full">
                {info.plan}
              </span>
            </div>

            <div className="h-px bg-slate-200/60 w-full" />

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 flex items-center gap-1.5 font-bold">
                <Mail className="h-3.5 w-3.5 text-orange-500" /> Account
              </span>
              <span className="text-slate-800 font-bold truncate max-w-[200px]">
                {info.email}
              </span>
            </div>

            <div className="h-px bg-slate-200/60 w-full" />

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 flex items-center gap-1.5 font-bold">
                <Calendar className="h-3.5 w-3.5 text-orange-500" /> Expiry Date
              </span>
              <span className="text-slate-800 font-bold">
                {info.expiryDate}
              </span>
            </div>

            <div className="h-px bg-slate-200/60 w-full" />

            <div className="flex justify-between items-center text-[10px]">
              <span className="text-slate-400/80 flex items-center gap-1.5 font-bold">
                <ShieldCheck className="h-3.5 w-3.5 text-slate-300" /> Transaction ID
              </span>
              <span className="text-slate-500 font-mono tracking-wider">
                {info.paymentId}
              </span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <a
              href="https://oryn-app.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-black text-white transition-transform active:scale-[0.98] overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #f97316, #f59e0b)",
                boxShadow:
                  "0 8px 32px -8px rgba(249,115,22,0.35), inset 0 1px 0 rgba(255,255,255,0.15)",
              }}
            >
              <span className="relative z-10 flex items-center gap-1.5">
                Open Oryn App <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>

            <button
              onClick={onEnter}
              className="w-full rounded-2xl py-3.5 text-xs font-bold text-slate-600 border border-slate-200/80 hover:bg-slate-50/80 transition-colors"
            >
              Explore Web Demo
            </button>
          </div>

          <p className="text-center text-[10px] text-slate-400 mt-6 tracking-wide font-medium">
            You can manage your subscription at any time within your Profile Settings.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
