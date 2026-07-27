import React, { useState } from "react";
import { Check, Crown, Zap } from "lucide-react";
import { handleRazorpayCheckout } from "../lib/razorpay";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { APP_NAME } from "../lib/brand";

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export function PaywallView({ userId, onSuccess }: { userId: string; onSuccess: () => void }) {
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "half_yearly">("half_yearly");

  const handleUpgrade = () => {
    const planId = selectedPlan;
    handleRazorpayCheckout(userId, planId, async (paymentId, orderId, signature) => {
      const API_BASE_URL = import.meta.env.VITE_API_URL || '';
      try {
        const verifyRes = await fetch(`${API_BASE_URL}/api/verify-payment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_order_id: orderId,
            razorpay_payment_id: paymentId,
            razorpay_signature: signature,
            userId: userId,
            planId: planId,
            purchase_source: "in_app"
          })
        });
        const verifyData = await verifyRes.json();
        if (!verifyRes.ok || !verifyData.success) {
           throw new Error(verifyData.message || "Verification failed");
        }
        onSuccess();
      } catch (err: any) {
         console.error("Payment verification error:", err);
         alert("Payment successful but verification failed. " + err.message);
      }
    });
  };

  return (
    <div
      className="h-[100dvh] w-full flex flex-col items-center justify-center px-5 relative overflow-hidden"
      style={{ background: "#0a0a0a" }}
    >
      {/* Ambient glow effects */}
      <div className="pointer-events-none absolute top-[-30%] left-[-10%] h-[500px] w-[500px] rounded-full opacity-20 blur-[120px]"
        style={{ background: "radial-gradient(circle, #f97316, transparent 70%)" }}
      />
      <div className="pointer-events-none absolute bottom-[-20%] right-[-10%] h-[400px] w-[400px] rounded-full opacity-15 blur-[100px]"
        style={{ background: "radial-gradient(circle, #f59e0b, transparent 70%)" }}
      />

      <div className="relative z-10 w-full max-w-sm">

        {/* Crown + Brand */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 shadow-[0_8px_30px_-6px_rgba(249,115,22,0.6)]">
            <Crown className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white mb-1">
            {APP_NAME} <span className="bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">Pro</span>
          </h1>
          <p className="text-xs text-white/40">
            Unlock the full experience.
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          {/* Monthly */}
          <button
            onClick={() => setSelectedPlan("monthly")}
            className={cn(
              "relative rounded-2xl p-4 text-left transition-all duration-200 border",
              selectedPlan === "monthly"
                ? "border-orange-500/50 bg-orange-500/[0.08]"
                : "border-white/[0.06] bg-white/[0.02] hover:border-white/10"
            )}
          >
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/35">Monthly</span>
            <div className="mt-1 flex items-baseline gap-0.5">
              <span className="text-2xl font-black text-white">₹5</span>
              <span className="text-[10px] font-semibold text-white/30">/mo</span>
            </div>
          </button>

          {/* Half Yearly */}
          <button
            onClick={() => setSelectedPlan("half_yearly")}
            className={cn(
              "relative rounded-2xl p-4 text-left transition-all duration-200 border",
              selectedPlan === "half_yearly"
                ? "border-orange-500/50 bg-orange-500/[0.08]"
                : "border-white/[0.06] bg-white/[0.02] hover:border-white/10"
            )}
          >
            <span className="absolute -top-2 right-3 flex items-center gap-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-400 px-2 py-0.5 text-[9px] font-black text-white uppercase tracking-wider shadow-[0_4px_12px_-3px_rgba(249,115,22,0.5)]">
              <Zap className="h-2.5 w-2.5" /> Best
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/35">Yearly</span>
            <div className="mt-1 flex items-baseline gap-0.5">
              <span className="text-2xl font-black text-white">₹10</span>
              <span className="text-[10px] font-semibold text-white/30">/6mo</span>
            </div>
          </button>
        </div>

        {/* Features */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 mb-5">
          <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
            {[
              "Unlimited Goals",
              "AI Insights",
              "Custom Themes",
              "Priority Support",
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-orange-500/15">
                  <Check className="h-2.5 w-2.5 text-orange-400 stroke-[3]" />
                </div>
                <span className="text-[11px] font-semibold text-white/50">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={handleUpgrade}
          className="group w-full relative rounded-2xl py-3.5 text-sm font-black text-white transition-transform active:scale-[0.97] overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #f97316, #f59e0b)",
            boxShadow: "0 8px 32px -8px rgba(249,115,22,0.5), inset 0 1px 0 rgba(255,255,255,0.15)",
          }}
        >
          <span className="relative z-10">
            Continue with {selectedPlan === "monthly" ? "Monthly" : "Yearly"}
          </span>
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>

        <p className="text-center text-[10px] text-white/20 mt-3 tracking-wide">
          Secured by Razorpay · Cancel anytime
        </p>
      </div>
    </div>
  );
}
