import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, Shield, FileText, BadgeCheck, Mail, Calendar, HelpCircle } from "lucide-react";

interface PolicyPageProps {
  onEnter: () => void;
  onNavigate: (path: string) => void;
  initialTab?: "terms" | "privacy" | "refund";
}

export function PolicyPage({ onEnter, onNavigate, initialTab = "terms" }: PolicyPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<"terms" | "privacy" | "refund">(initialTab);

  // Sync state if initialTab prop changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Handle URL updating silently when switching tabs
  const handleTabChange = (tab: "terms" | "privacy" | "refund") => {
    setActiveTab(tab);
    const path = `/${tab}`;
    if (window.location.pathname !== path) {
      window.history.pushState({ orynLandingEntry: true }, "", path);
    }
    scrollToTop();
  };

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

  // Robust scroll to top on mount
  useEffect(() => {
    const currentPath = window.location.pathname.replace(/\/$/, "");
    if (currentPath === "/terms" && activeTab !== "terms") setActiveTab("terms");
    else if (currentPath === "/privacy" && activeTab !== "privacy") setActiveTab("privacy");
    else if (currentPath === "/refund" && activeTab !== "refund") setActiveTab("refund");

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

      {/* ═══════════ TOP HEADER / BRAND NAVIGATION ═══════════ */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate("/")}>
            <img src="/logo.png" alt="Oryn Logo" className="w-6 h-6 object-contain" />
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Oryn</span>
          </div>

          <button
            onClick={() => onNavigate("/")}
            className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors duration-200 px-3 py-1.5 rounded-full hover:bg-slate-100/80"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
        </div>
      </div>

      {/* ═══════════ HERO SECTION ═══════════ */}
      <div className="bg-gradient-to-b from-white to-slate-50 py-12 px-6 border-b border-slate-100">
        <div className="max-w-4xl mx-auto text-center">
          <span className="px-3 py-1 text-xs font-bold tracking-wider text-orange-600 uppercase bg-orange-50 rounded-full border border-orange-100/50">
            Legal & Policy Center
          </span>
          <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Trust & Transparency at Oryn
          </h1>
          <p className="mt-3 text-slate-500 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Please read our terms of service, privacy policy, and billing/refund procedures to understand how we operate.
          </p>

          {/* Tab Selection buttons */}
          <div className="mt-8 flex justify-center p-1 bg-slate-100/80 rounded-2xl max-w-md mx-auto border border-slate-200/50 shadow-inner">
            <button
              onClick={() => handleTabChange("terms")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all duration-200 ${
                activeTab === "terms"
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200/10"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Terms
            </button>
            <button
              onClick={() => handleTabChange("privacy")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all duration-200 ${
                activeTab === "privacy"
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200/10"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Privacy
            </button>
            <button
              onClick={() => handleTabChange("refund")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all duration-200 ${
                activeTab === "refund"
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200/10"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <BadgeCheck className="w-3.5 h-3.5" />
              Refunds
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════ MAIN CONTENT AREA ═══════════ */}
      <div className="max-w-4xl mx-auto px-6 py-12 pb-32">
        <div className="bg-white border border-slate-200/60 rounded-3xl p-6 sm:p-10 shadow-sm">
          {activeTab === "terms" && (
            <article className="prose prose-slate max-w-none">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-6 mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-950">Terms of Service</h2>
                  <p className="text-slate-500 text-xs mt-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Last Updated: 1-June-2026
                  </p>
                </div>
                <div className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-100/50">
                  Active
                </div>
              </div>

              <div className="text-slate-700 text-sm sm:text-base leading-relaxed space-y-8">
                <p className="font-medium text-slate-800">
                  By accessing or using Oryn, you agree to these Terms. Please read them carefully.
                </p>

                <section className="space-y-3">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-orange-50 text-orange-600 text-xs font-extrabold">1</span>
                    Eligibility
                  </h3>
                  <p className="text-slate-600 pl-8">
                    You must be at least 13 years old to use Oryn.
                  </p>
                </section>

                <section className="space-y-3">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-orange-50 text-orange-600 text-xs font-extrabold">2</span>
                    Account Responsibility
                  </h3>
                  <p className="text-slate-600 pl-8">
                    You are responsible for maintaining the security of your account and credentials.
                  </p>
                </section>

                <section className="space-y-3">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-orange-50 text-orange-600 text-xs font-extrabold">3</span>
                    Subscription Access
                  </h3>
                  <p className="text-slate-600 pl-8">
                    Certain features require an active paid subscription. Access may be suspended or terminated when a subscription expires.
                  </p>
                </section>

                <section className="space-y-3">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-orange-50 text-orange-600 text-xs font-extrabold">4</span>
                    Acceptable Use
                  </h3>
                  <div className="text-slate-600 pl-8 space-y-2">
                    <p>Users may not:</p>
                    <ul className="list-disc list-inside space-y-1 pl-2 font-medium text-slate-700">
                      <li>Attempt unauthorized access</li>
                      <li>Abuse, disrupt, or interfere with the service</li>
                      <li>Reverse engineer the platform</li>
                      <li>Use Oryn for unlawful purposes</li>
                    </ul>
                  </div>
                </section>

                <section className="space-y-3">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-orange-50 text-orange-600 text-xs font-extrabold">5</span>
                    Intellectual Property
                  </h3>
                  <p className="text-slate-600 pl-8">
                    All content, branding, design, software, and materials provided by Oryn remain the property of Oryn.
                  </p>
                </section>

                <section className="space-y-3">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-orange-50 text-orange-600 text-xs font-extrabold">6</span>
                    Service Availability
                  </h3>
                  <p className="text-slate-600 pl-8">
                    We strive to maintain availability but do not guarantee uninterrupted access. Features may change, be modified, or be removed at any time.
                  </p>
                </section>

                <section className="space-y-3">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-orange-50 text-orange-600 text-xs font-extrabold">7</span>
                    Limitation of Liability
                  </h3>
                  <p className="text-slate-600 pl-8">
                    To the maximum extent permitted by law, Oryn shall not be liable for indirect, incidental, or consequential damages arising from use of the service.
                  </p>
                </section>

                <section className="space-y-3">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-orange-50 text-orange-600 text-xs font-extrabold">8</span>
                    Termination
                  </h3>
                  <p className="text-slate-600 pl-8">
                    We reserve the right to suspend or terminate accounts that violate these Terms.
                  </p>
                </section>

                <section className="space-y-3">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-orange-50 text-orange-600 text-xs font-extrabold">9</span>
                    Changes
                  </h3>
                  <p className="text-slate-600 pl-8">
                    We may update these Terms at any time. Continued use of Oryn constitutes acceptance of updated Terms.
                  </p>
                </section>

                <section className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-950 text-sm">Contact Support</h4>
                      <p className="text-xs text-slate-500">For inquiries or policy questions</p>
                    </div>
                  </div>
                  <a
                    href="mailto:app.oryn@gmail.com"
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-all duration-200 border border-slate-200/30"
                  >
                    app.oryn@gmail.com
                  </a>
                </section>
              </div>
            </article>
          )}

          {activeTab === "privacy" && (
            <article className="prose prose-slate max-w-none">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-6 mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-950">Privacy Policy</h2>
                  <p className="text-slate-500 text-xs mt-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Last Updated: 1-June-2026
                  </p>
                </div>
                <div className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-100/50">
                  Active
                </div>
              </div>

              <div className="text-slate-700 text-sm sm:text-base leading-relaxed space-y-8">
                <p className="font-medium text-slate-800">
                  Welcome to Oryn. Oryn respects your privacy and is committed to protecting your personal information.
                </p>

                <section className="space-y-3">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-orange-50 text-orange-600 text-xs font-extrabold">1</span>
                    Information We Collect
                  </h3>
                  <div className="text-slate-600 pl-8 space-y-2">
                    <p>We may collect:</p>
                    <ul className="list-disc list-inside space-y-1 pl-2 font-medium text-slate-700">
                      <li>Name</li>
                      <li>Email address</li>
                      <li>Profile picture (if you sign in with Google)</li>
                      <li>Account information</li>
                      <li>Subscription and payment information</li>
                      <li>Usage and analytics data</li>
                    </ul>
                    <p className="mt-2 text-slate-500 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <strong>Security Note:</strong> We do not store your payment card details. Payments are processed securely through third-party payment providers.
                    </p>
                  </div>
                </section>

                <section className="space-y-3">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-orange-50 text-orange-600 text-xs font-extrabold">2</span>
                    How We Use Your Information
                  </h3>
                  <div className="text-slate-600 pl-8 space-y-2">
                    <p>We use information to:</p>
                    <ul className="list-disc list-inside space-y-1 pl-2 font-medium text-slate-700">
                      <li>Provide access to Oryn</li>
                      <li>Manage user accounts</li>
                      <li>Process subscriptions</li>
                      <li>Improve our services</li>
                      <li>Communicate important updates</li>
                    </ul>
                  </div>
                </section>

                <section className="space-y-3">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-orange-50 text-orange-600 text-xs font-extrabold">3</span>
                    Data Security
                  </h3>
                  <p className="text-slate-600 pl-8">
                    We take reasonable measures to protect your information. However, no method of electronic storage or transmission is completely secure.
                  </p>
                </section>

                <section className="space-y-3">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-orange-50 text-orange-600 text-xs font-extrabold">4</span>
                    Third-Party Services
                  </h3>
                  <p className="text-slate-600 pl-8">
                    Oryn may use third-party services including authentication, analytics, hosting, and payment providers.
                  </p>
                </section>

                <section className="space-y-3">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-orange-50 text-orange-600 text-xs font-extrabold">5</span>
                    Account Deletion
                  </h3>
                  <p className="text-slate-600 pl-8">
                    Users may request account deletion by contacting support.
                  </p>
                </section>

                <section className="space-y-3">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-orange-50 text-orange-600 text-xs font-extrabold">6</span>
                    Changes
                  </h3>
                  <p className="text-slate-600 pl-8">
                    We may update this Privacy Policy at any time. Continued use of Oryn constitutes acceptance of any updates.
                  </p>
                </section>

                <section className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-950 text-sm">Privacy Inquiries</h4>
                      <p className="text-xs text-slate-500">Contact our privacy team</p>
                    </div>
                  </div>
                  <a
                    href="mailto:app.oryn@gmail.com"
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-all duration-200 border border-slate-200/30"
                  >
                    app.oryn@gmail.com
                  </a>
                </section>
              </div>
            </article>
          )}

          {activeTab === "refund" && (
            <article className="prose prose-slate max-w-none">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-6 mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-950">Refund & Cancellation Policy</h2>
                  <p className="text-slate-500 text-xs mt-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Last Updated: 7-June-2026
                  </p>
                </div>
                <div className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-100/50">
                  Active
                </div>
              </div>

              <div className="text-slate-700 text-sm sm:text-base leading-relaxed space-y-8">
                <p className="font-medium text-slate-800">
                  Thank you for choosing Oryn. Oryn is a digital subscription service that provides access to premium productivity features.
                </p>

                <section className="space-y-3">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-orange-50 text-orange-600 text-xs font-extrabold">1</span>
                    Subscription Plans
                  </h3>
                  <div className="text-slate-600 pl-8 space-y-2">
                    <p>Oryn currently offers:</p>
                    <ul className="list-disc list-inside space-y-1 pl-2 font-medium text-slate-700">
                      <li>Monthly Subscription</li>
                      <li>6-Month Subscription</li>
                      <li>Other promotional plans as announced</li>
                    </ul>
                  </div>
                </section>

                <section className="space-y-3">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-orange-50 text-orange-600 text-xs font-extrabold">2</span>
                    Cancellation
                  </h3>
                  <p className="text-slate-600 pl-8">
                    Users may cancel future renewals at any time. Cancellation does not automatically entitle the user to a refund for the current subscription period. Access will remain active until the subscription end date.
                  </p>
                </section>

                <section className="space-y-3">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-orange-50 text-orange-600 text-xs font-extrabold">3</span>
                    Refund Eligibility
                  </h3>
                  <div className="text-slate-600 pl-8 space-y-2">
                    <p>Refund requests may be considered within 7 days of purchase if:</p>
                    <ul className="list-disc list-inside space-y-1 pl-2 font-medium text-slate-700">
                      <li>The user was charged incorrectly.</li>
                      <li>The user was charged multiple times for the same purchase.</li>
                      <li>A technical issue prevented access to paid features and could not be resolved.</li>
                    </ul>
                  </div>
                </section>

                <section className="space-y-3">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-orange-50 text-orange-600 text-xs font-extrabold">4</span>
                    Non-Refundable Situations
                  </h3>
                  <div className="text-slate-600 pl-8 space-y-2">
                    <p>Refunds will generally not be provided for:</p>
                    <ul className="list-disc list-inside space-y-1 pl-2 font-medium text-slate-700">
                      <li>Change of mind.</li>
                      <li>Failure to use the service after purchase.</li>
                      <li>Dissatisfaction with features that were clearly described before purchase.</li>
                      <li>Subscription periods that have already been substantially used.</li>
                    </ul>
                  </div>
                </section>

                <section className="space-y-3">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-orange-50 text-orange-600 text-xs font-extrabold">5</span>
                    Duplicate Charges
                  </h3>
                  <p className="text-slate-600 pl-8">
                    If a duplicate payment occurs, please contact support with the payment details. Verified duplicate charges will be refunded.
                  </p>
                </section>

                <section className="p-5 bg-orange-50/50 border border-orange-100 rounded-2xl space-y-3">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-sm sm:text-base">
                    <HelpCircle className="w-4 h-4 text-orange-500" />
                    How to request a cancellation or refund:
                  </h4>
                  <div className="text-slate-600 text-xs sm:text-sm pl-6 space-y-2">
                    <p>Please contact support at <strong>app.oryn@gmail.com</strong> with the following details:</p>
                    <ul className="list-disc list-inside space-y-1 pl-1 font-medium text-slate-700">
                      <li>Registered email address</li>
                      <li>Razorpay Payment ID</li>
                      <li>Description of the issue</li>
                    </ul>
                    <p className="text-xs text-slate-500 italic mt-1">We aim to respond within 5 business days.</p>
                  </div>
                </section>
              </div>
            </article>
          )}
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
            <span className="hover:text-slate-900 font-medium transition-colors cursor-pointer" onClick={() => handleTabChange("privacy")}>Privacy</span>
            <span className="hover:text-slate-900 font-medium transition-colors cursor-pointer" onClick={() => handleTabChange("terms")}>Terms</span>
            <span className="hover:text-slate-900 font-medium transition-colors cursor-pointer" onClick={() => handleTabChange("refund")}>Refund</span>
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
              onClick={() => onNavigate("/features")}
              className="text-sm font-semibold tracking-wide transition-colors cursor-pointer focus:outline-none text-slate-500 hover:text-slate-900"
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
