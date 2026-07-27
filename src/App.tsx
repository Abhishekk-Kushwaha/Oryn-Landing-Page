import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import { LandingPage } from "./components/LandingPage";
import { FeaturesPage } from "./components/FeaturesPage";
import { PricingPage } from "./components/PricingPage";
import { AuthGate } from "./components/ui/AuthGate";
import { VALID_VIEWS, type ViewType } from "./hooks/useAppRouter";
import { handleRazorpayCheckout } from "./lib/razorpay";
import { ThankYouPage } from "./components/ThankYouPage";
import { supabase } from "./components/lib/supabase";
import type { Session } from "@supabase/supabase-js";
import { PolicyPage } from "./components/PolicyPage";

const AppContent = lazy(() => import("./AppContent"));

// True while an OAuth redirect's credentials are still sitting in the URL waiting
// to be exchanged. Nothing may rewrite the URL until this goes false.
function hasPendingAuthParams() {
  return (
    window.location.search.includes("code=") ||
    window.location.hash.includes("access_token=")
  );
}

export default function App() {
  const [showApp, setShowApp] = useState(() => {
    const path = window.location.pathname.replace(/\/$/, "");
    const hash = window.location.hash.replace("#", "");
    return path === "/demo" || VALID_VIEWS.includes(hash as ViewType);
  });
  const [landingPath, setLandingPath] = useState(() => {
    return window.location.pathname.replace(/\/$/, "") || "/";
  });
  const [selectedPlan, setSelectedPlan] = useState<string | null>(() => {
    return sessionStorage.getItem('oryn_selected_plan') || 'biannual';
  });
  const [purchaseInfo, setPurchaseInfo] = useState<{
    plan: string;
    amount: number;
    email: string;
    paymentId: string;
    expiryDate: string;
  } | null>(() => {
    try {
      const saved = sessionStorage.getItem("oryn_latest_purchase");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("Failed to parse saved purchase info:", e);
      return null;
    }
  });
  const savedScrollPositionRef = useRef(0);
  const paymentInProgressRef = useRef(false);

  // ─── Auth session ────────────────────────────────────────────────────────────
  // The demo is gated on having an account, so payment later attaches to a user
  // that already exists instead of stopping to build one at checkout.
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthResolving, setIsAuthResolving] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // Returning from Google leaves ?code= (PKCE) or #access_token= in the URL, which
    // supabase-js exchanges asynchronously. Stay in the resolving state until that
    // lands, otherwise we flash the gate at someone who just signed in.
    const returningFromOAuth = hasPendingAuthParams();

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      if (data.session || !returningFromOAuth) setIsAuthResolving(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (cancelled) return;
      setSession(nextSession);
      setIsAuthResolving(false);
    });

    // Fallback so a failed exchange can't leave the loader up forever.
    const timeout = window.setTimeout(() => {
      if (!cancelled) setIsAuthResolving(false);
    }, 8000);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      listener.subscription.unsubscribe();
    };
  }, []);

  // Restore scroll position when leaving the app back to the landing page
  useEffect(() => {
    if (!showApp && savedScrollPositionRef.current > 0) {
      const timer = setTimeout(() => {
        window.scrollTo(0, savedScrollPositionRef.current);
      }, 40);
      return () => clearTimeout(timer);
    }
  }, [showApp]);

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const isDemoUrl = (path: string, hash: string) => {
      const cleanPath = path.replace(/\/$/, "");
      const cleanHash = hash.replace("#", "");
      return cleanPath === "/demo" || VALID_VIEWS.includes(cleanHash as ViewType);
    };

    const handleNavigation = () => {
      // Don't let popstate override routing while payment verification is running
      if (paymentInProgressRef.current) return;
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (isDemoUrl(path, hash)) {
        setShowApp(true);
      } else {
        setShowApp(false);
        setLandingPath(path.replace(/\/$/, "") || "/");
      }
    };

    window.addEventListener("popstate", handleNavigation);
    window.addEventListener("hashchange", handleNavigation);

    // Initial check: if loaded with a valid app view or demo path, show the app immediately.
    const initialPath = window.location.pathname;
    const initialHash = window.location.hash.replace("#", "");
    if (isDemoUrl(initialPath, window.location.hash)) {
      // Rewriting the URL here would strip a pending OAuth `?code=` before
      // supabase-js has exchanged it. Leave it alone; the effect below restores
      // these history entries once the session has resolved.
      if (!window.history.state?.orynDemoEntry && !hasPendingAuthParams()) {
        const landingUrl = "/pricing";
        const appUrl = `/demo#${VALID_VIEWS.includes(initialHash as ViewType) ? initialHash : "today"}`;
        window.history.replaceState({ orynLandingEntry: true }, "", landingUrl);
        window.history.pushState({ orynDemoEntry: true }, "", appUrl);
      }
      setShowApp(true);
    }

    return () => {
      window.removeEventListener("popstate", handleNavigation);
      window.removeEventListener("hashchange", handleNavigation);
    };
  }, []);

  // Captured on first render, before supabase-js gets a chance to strip the params
  // itself. Checking inside the effect below would miss a successful exchange.
  const isOAuthReturnRef = useRef(hasPendingAuthParams());
  const didNormalizeUrlRef = useRef(false);

  // Once supabase has consumed the OAuth credentials, strip them from the URL and
  // lay down the history entries the mount effect deliberately skipped.
  useEffect(() => {
    if (isAuthResolving) return;
    if (!isOAuthReturnRef.current || didNormalizeUrlRef.current) return;
    didNormalizeUrlRef.current = true;

    if (showApp) {
      window.history.replaceState({ orynLandingEntry: true }, "", "/pricing");
      window.history.pushState({ orynDemoEntry: true }, "", "/demo#today");
    } else {
      window.history.replaceState(window.history.state, "", window.location.pathname);
    }
  }, [isAuthResolving, showApp]);

  const handleEnterApp = () => {
    savedScrollPositionRef.current = window.scrollY || document.documentElement.scrollTop || 0;
    setShowApp(true);
    // Replace the current history entry (e.g. '/') with '/pricing' so the back button traps them in the pricing funnel
    window.history.replaceState({ orynLandingEntry: true }, "", "/pricing");
    window.history.pushState({ orynDemoEntry: true }, "", "/demo#today");
  };

  const handleLandingNavigate = (path: string) => {
    console.log("[App] handleLandingNavigate called with path:", path);
    window.history.pushState({ orynLandingEntry: true }, "", path);
    setLandingPath(path.replace(/\/$/, "") || "/");
    window.scrollTo(0, 0);
  };

  // Opens Razorpay against an already-authenticated user. The account is created at
  // the demo gate, so by the time anyone reaches checkout there is a user to bill —
  // no signup step in the middle of the purchase.
  const startCheckout = async (plan: string, userId: string, userEmail: string) => {
    paymentInProgressRef.current = true;
    handleRazorpayCheckout(
      userId,
      plan,
      async (paymentId: string, orderId: string, signature: string) => {
        // IMMEDIATELY show Thank You page — no flash of pricing
        setLandingPath("/thank-you");
        window.history.pushState({ orynLandingEntry: true }, "", "/thank-you");

        const API_BASE_URL = import.meta.env.VITE_API_URL || '';

        try {
          const verifyRes = await fetch(`${API_BASE_URL}/api/verify-payment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: orderId,
              razorpay_payment_id: paymentId,
              razorpay_signature: signature,
              userId,
              planId: plan,
              purchase_source: "landing_page"
            })
          });
          const verifyData = await verifyRes.json();

          if (!verifyRes.ok || !verifyData.success) {
            throw new Error(verifyData.message || "Verification failed");
          }

          // Payment verified — update receipt with real data
          const date = new Date();
          if (plan === 'monthly') {
            date.setDate(date.getDate() + 30);
          } else {
            date.setDate(date.getDate() + 180);
          }
          const formattedExpiry = date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric"
          });

          const pInfo = {
            plan: plan === 'monthly' ? 'Monthly Plan' : '6 Months Plan',
            amount: plan === 'monthly' ? 99 : 249,
            email: userEmail,
            paymentId: paymentId,
            expiryDate: formattedExpiry
          };
          setPurchaseInfo(pInfo);
          try {
            sessionStorage.setItem("oryn_latest_purchase", JSON.stringify(pInfo));
          } catch (e) {
            console.error("Failed to save purchase info to sessionStorage:", e);
          }

          paymentInProgressRef.current = false;

        } catch (err: any) {
          console.error("Payment verification error:", err);
          paymentInProgressRef.current = false;
          alert("Payment successful but activation verification failed. Please contact support: " + err.message);
        }
      },
      userEmail
    );
  };

  const handleStartCheckout = (planId?: string) => {
    const plan = planId || selectedPlan || 'biannual';
    setSelectedPlan(plan);
    sessionStorage.setItem('oryn_selected_plan', plan);

    if (session?.user) {
      startCheckout(plan, session.user.id, session.user.email || '');
      return;
    }

    // No account yet (someone deep-linked straight to /pricing). Send them through
    // the same gate and resume checkout on the way back.
    sessionStorage.setItem('oryn_pending_checkout', '1');
    window.history.pushState({ orynLandingEntry: true }, "", "/auth");
    setLandingPath("/auth");
    window.scrollTo(0, 0);
  };

  // Resume a checkout that was interrupted by the gate — covers the Google round
  // trip, which leaves and re-enters the page rather than resolving in place.
  const resumedCheckoutRef = useRef(false);
  useEffect(() => {
    if (resumedCheckoutRef.current) return;
    if (isAuthResolving || !session?.user) return;
    if (sessionStorage.getItem('oryn_pending_checkout') !== '1') return;

    resumedCheckoutRef.current = true;
    sessionStorage.removeItem('oryn_pending_checkout');

    const plan = sessionStorage.getItem('oryn_selected_plan') || selectedPlan || 'biannual';
    setLandingPath("/pricing");
    window.history.replaceState({ orynLandingEntry: true }, "", "/pricing");
    startCheckout(plan, session.user.id, session.user.email || '');
  }, [isAuthResolving, session]);

  const handleExitApp = () => {
    document.cookie = "oryn_customer_v1=; Max-Age=0; Path=/";
    supabase.auth.signOut().then(() => {
      setShowApp(false);
      setLandingPath("/pricing");
      window.history.pushState(
        { orynLandingEntry: true },
        "",
        "/pricing",
      );
    });
  };

  console.log("[App] rendering state: showApp =", showApp, "landingPath =", landingPath);

  if (!showApp) {
    if (landingPath === "/thank-you") {
      console.log("[App] Rendering ThankYouPage component");
      return <ThankYouPage key="thank-you-page" purchaseInfo={purchaseInfo} onEnter={handleEnterApp} />;
    }
    if (landingPath === "/auth") {
      // Only reachable when someone deep-links to /pricing without an account.
      // Coming back lands on /pricing, where the resume effect opens Razorpay.
      return <AuthGate key="auth-page" redirectPath="/pricing" />;
    }
    if (landingPath === "/features") {
      console.log("[App] Rendering FeaturesPage component");
      return <FeaturesPage key="features-page" onEnter={handleEnterApp} onNavigate={handleLandingNavigate} />;
    }
    if (landingPath === "/pricing") {
      console.log("[App] Rendering PricingPage component");
      return <PricingPage key="pricing-page" onEnter={handleEnterApp} onNavigate={handleLandingNavigate} onStartAuth={handleStartCheckout} />;
    }
    if (landingPath === "/terms") {
      console.log("[App] Rendering PolicyPage (Terms) component");
      return <PolicyPage key="terms-page" onEnter={handleEnterApp} onNavigate={handleLandingNavigate} initialTab="terms" />;
    }
    if (landingPath === "/privacy") {
      console.log("[App] Rendering PolicyPage (Privacy) component");
      return <PolicyPage key="privacy-page" onEnter={handleEnterApp} onNavigate={handleLandingNavigate} initialTab="privacy" />;
    }
    if (landingPath === "/refund") {
      console.log("[App] Rendering PolicyPage (Refund) component");
      return <PolicyPage key="refund-page" onEnter={handleEnterApp} onNavigate={handleLandingNavigate} initialTab="refund" />;
    }
    console.log("[App] Rendering LandingPage component");
    return <LandingPage key="landing-page" onEnter={handleEnterApp} onNavigate={handleLandingNavigate} />;
  }

  // Gate the demo on an account. This covers the CTA path and cold deep links to
  // /demo#today alike — putting it on the button alone would make the wall cosmetic.
  if (isAuthResolving) {
    return <LoadingScreen />;
  }

  if (!session) {
    return <AuthGate key="auth-gate" />;
  }

  return (
    <AppErrorBoundary>
      <Suspense fallback={<LoadingScreen />}>
        <AppContent onExit={handleExitApp} />
      </Suspense>
    </AppErrorBoundary>
  );
}

function LoadingScreen() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#09090b",
        color: "#a1a1aa",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "3px solid #27272a",
            borderTopColor: "#fb923c",
            borderRadius: "50%",
            animation: "oryn-spin 1s linear infinite",
            margin: "0 auto 16px",
          }}
        />
        <p style={{ fontSize: "14px", fontWeight: 500 }}>Loading Oryn...</p>
        <style>{`
          @keyframes oryn-spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
