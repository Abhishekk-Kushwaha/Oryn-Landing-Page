import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { AlertCircle, ArrowLeft, ArrowRight, KeyRound, Loader2, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

/* ─── Where Google sends the user back to ───────────────────────────────────────
   Must NOT contain a fragment. Supabase appends the PKCE `?code=` to this URL, and
   a fragment can swallow it into the hash where supabase-js will never find it.
   /demo alone is enough — the router defaults the view to today.
──────────────────────────────────────────────────────────────────────────────── */
export const DEMO_ENTRY_URL = '/demo';

/* Set immediately before redirecting to Google, read once we come back. Survives the
   round trip independently of the URL, which supabase-js rewrites asynchronously. */
export const OAUTH_PENDING_KEY = 'oryn_oauth_pending';

/* ─── Embedded browser detection ───────────────────────────────────────────────
   Google blocks OAuth inside embedded webviews (disallowed_useragent), and most
   of our paid traffic arrives through the Instagram in-app browser. Detect it so
   we can lead with the email code instead of sending people into a Google error.
──────────────────────────────────────────────────────────────────────────────── */
function isEmbeddedBrowser() {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    return /Instagram|FBAN|FBAV|FB_IAB|FBIOS|Line\/|Snapchat|LinkedInApp|Pinterest/i.test(ua);
}

/* ─── App Logo ─────────────────────────────────────────────────────────────── */
function AppLogo({ size = 52 }: { size?: number }) {
    return (
        <img
            src="/logo.png"
            width={size}
            height={size}
            className="shrink-0 object-contain rounded-xl select-none"
            alt="Oryn Logo"
        />
    );
}

/* ─── Google Icon ──────────────────────────────────────────────────────────── */
function GoogleIcon({ size = 18 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M23.64 12.2c0-.82-.07-1.61-.21-2.36H12v4.46h6.54a5.6 5.6 0 0 1-2.43 3.68v2.99h3.93c2.3-2.13 3.6-5.27 3.6-8.77z" />
            <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.93-2.99c-1.08.73-2.47 1.16-4.01 1.16-3.13 0-5.78-2.1-6.73-4.94H1.21v3.08A12 12 0 0 0 12 24z" />
            <path fill="#FBBC05" d="M5.27 14.32A7.18 7.18 0 0 1 4.89 12c0-.8.14-1.58.38-2.32V6.6H1.21A12 12 0 0 0 0 12c0 1.94.46 3.78 1.21 5.4l4.06-3.08z" />
            <path fill="#EA4335" d="M12 4.74c1.76 0 3.35.6 4.6 1.8l3.43-3.43A11.54 11.54 0 0 0 12 0 12 12 0 0 0 1.21 6.6l4.06 3.08C6.22 6.84 8.87 4.74 12 4.74z" />
        </svg>
    );
}

/* ─── Banners ──────────────────────────────────────────────────────────────── */
function ErrorBanner({ message }: { message: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-rose-400/20 bg-rose-500/[0.08] px-4 py-3 text-left text-[13px] leading-6 text-rose-600"
        >
            <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                <p>{message}</p>
            </div>
        </motion.div>
    );
}

function NoticeBanner({ message }: { message: string }) {
    return (
        <div className="rounded-2xl border border-amber-400/25 bg-amber-500/[0.07] px-4 py-3 text-left text-[12.5px] leading-5 text-amber-700">
            {message}
        </div>
    );
}

const formInputClass =
    'h-12 w-full rounded-2xl px-4 text-[14px] font-medium outline-none transition-all duration-200 focus:ring-0 oryn-input';

const primaryButtonClass =
    'group relative flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-orange-300 to-orange-400 text-[15px] font-semibold tracking-[-0.01em] text-white shadow-[inset_0px_1px_1px_rgba(255,255,255,0.34),0px_8px_24px_-8px_rgba(251,146,60,0.42)] transition-all duration-200 hover:from-orange-200 hover:to-orange-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60';

/* ─── Entry gate ────────────────────────────────────────────────────────────────
   Creates the account that a later purchase attaches to. The demo itself stays a
   sandbox — this only establishes identity so checkout has a user to link to.

   `redirectPath` is where Google sends the browser back to. Defaults to the demo;
   checkout passes /pricing so an unauthenticated deep link resumes buying instead
   of dumping the user into the demo.
──────────────────────────────────────────────────────────────────────────────── */
export function AuthGate({ redirectPath = DEMO_ENTRY_URL }: { redirectPath?: string } = {}) {
    const [step, setStep] = useState<'choose' | 'email' | 'code'>('choose');
    const [email, setEmail] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [isEmailLoading, setIsEmailLoading] = useState(false);
    const [isCodeLoading, setIsCodeLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [resendNotice, setResendNotice] = useState<string | null>(null);
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

    const embedded = React.useMemo(() => isEmbeddedBrowser(), []);

    useEffect(() => {
        const handleResize = () => setIsKeyboardOpen(window.innerHeight < 500);
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setInterval(() => setResendCooldown((prev) => prev - 1), 1000);
        return () => clearInterval(timer);
    }, [resendCooldown]);

    /* ── Google ── */
    const handleGoogle = async () => {
        setIsGoogleLoading(true);
        setError(null);
        try {
            // Flag the round trip before we leave. App.tsx needs to know we came back
            // from Google even if supabase-js has already stripped ?code= from the URL,
            // so it can put one of our own pages behind the demo in history.
            try {
                sessionStorage.setItem(OAUTH_PENDING_KEY, '1');
            } catch {
                /* private mode — fall back to URL detection */
            }

            const { error: oauthError } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: window.location.origin + redirectPath },
            });
            if (oauthError) throw oauthError;
            // On success the browser navigates away to Google; the session is picked
            // up by the onAuthStateChange listener in App.tsx when we come back.
        } catch (err: unknown) {
            // We never left, so the flag would be a lie on the next load.
            try {
                sessionStorage.removeItem(OAUTH_PENDING_KEY);
            } catch {
                /* private mode */
            }
            setError(err instanceof Error && err.message ? err.message : 'Could not start Google sign-in.');
            setIsGoogleLoading(false);
        }
    };

    /* ── Email code ── */
    const sendCode = async (targetEmail: string) => {
        const { error: otpError } = await supabase.auth.signInWithOtp({
            email: targetEmail,
            options: { shouldCreateUser: true, emailRedirectTo: window.location.origin + redirectPath },
        });
        if (otpError) throw otpError;
    };

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanedEmail = email.trim().toLowerCase();
        setEmail(cleanedEmail);

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanedEmail)) {
            setError('Please enter a valid email address.');
            return;
        }

        setIsEmailLoading(true);
        setError(null);
        try {
            await sendCode(cleanedEmail);
            setStep('code');
            setResendCooldown(60);
        } catch (err: unknown) {
            setError(err instanceof Error && err.message ? err.message : 'Could not send the code. Please try again.');
        } finally {
            setIsEmailLoading(false);
        }
    };

    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otpCode.length < 6) {
            setError('Enter the 6-digit code from your email.');
            return;
        }

        setIsCodeLoading(true);
        setError(null);
        try {
            const { error: verifyError } = await supabase.auth.verifyOtp({
                email,
                token: otpCode.trim(),
                type: 'email',
            });
            if (verifyError) throw verifyError;
            // Session established — App.tsx reacts via onAuthStateChange.
        } catch (err: unknown) {
            setError(err instanceof Error && err.message ? err.message : 'That code was not valid.');
            setIsCodeLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0) return;
        setError(null);
        setResendNotice(null);
        try {
            await sendCode(email);
            setResendNotice('A new code is on its way.');
            setResendCooldown(60);
        } catch (err: unknown) {
            setError(err instanceof Error && err.message ? err.message : 'Could not resend the code.');
        }
    };

    /* ── Shared inner content ── */
    const heading = step === 'code' ? 'Check your email' : 'Start exploring Oryn';

    // Rendered once per layout (desktop card + mobile sheet). The step switcher is a
    // plain keyed motion.div rather than AnimatePresence: two presence trees rendering
    // the same steps deadlocked on exit, leaving the outgoing step mounted forever.
    // Keying on step gives the fade-in without any exit tracking to stall.
    const renderContent = (variant: 'd' | 'm') => (
        <>
            {error && (
                <div className="mb-4 w-full">
                    <ErrorBanner message={error} />
                </div>
            )}

            <motion.div
                key={`${step}-${variant}`}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="w-full"
            >
                {step === 'code' ? (
                    <div
                        className="flex w-full flex-col items-center text-center"
                    >
                        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-400/20 bg-orange-500/[0.08]">
                            <KeyRound className="h-7 w-7 text-orange-400" />
                        </div>

                        <p className="mb-1 text-[13px] leading-5" style={{ color: 'var(--text-muted)' }}>
                            We sent a 6-digit code to
                        </p>
                        <p className="mb-6 text-[14px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                            {email}
                        </p>

                        <form onSubmit={handleVerifyCode} className="w-full space-y-3">
                            <input
                                type="text"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                maxLength={6}
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                                className={formInputClass + ' text-center text-[18px] font-bold tracking-[0.3em]'}
                                placeholder="000000"
                                required
                                autoFocus
                            />

                            {resendNotice && (
                                <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/[0.08] px-4 py-2.5 text-[12px] leading-5 text-emerald-600">
                                    {resendNotice}
                                </div>
                            )}

                            <button type="submit" disabled={isCodeLoading} className={primaryButtonClass}>
                                {isCodeLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        <span>Open the demo</span>
                                        <ArrowRight className="h-4 w-4" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-5 flex flex-col items-center gap-2.5">
                            <button
                                type="button"
                                onClick={handleResend}
                                disabled={resendCooldown > 0}
                                className="text-[13px] font-semibold text-orange-500/90 transition-colors hover:text-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setStep('email');
                                    setOtpCode('');
                                    setError(null);
                                    setResendNotice(null);
                                }}
                                className="flex items-center gap-1.5 text-[13px] font-medium transition-colors hover:text-[var(--text-primary)]"
                                style={{ color: 'var(--text-faint)' }}
                            >
                                <ArrowLeft className="h-3.5 w-3.5" /> Use a different email
                            </button>
                        </div>
                    </div>
                ) : step === 'email' ? (
                    <div className="w-full">
                        <form onSubmit={handleEmailSubmit} className="w-full space-y-3">
                            <div className="relative">
                                <Mail
                                    className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2"
                                    style={{ color: 'var(--text-faint)' }}
                                />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={formInputClass + ' pl-11'}
                                    placeholder="Email address"
                                    autoComplete="email"
                                    required
                                    autoFocus
                                />
                            </div>

                            <button type="submit" disabled={isEmailLoading} className={primaryButtonClass}>
                                {isEmailLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        <span>Email me a code</span>
                                        <ArrowRight className="h-4 w-4" />
                                    </>
                                )}
                            </button>
                        </form>

                        {!embedded && (
                            <button
                                type="button"
                                onClick={() => {
                                    setStep('choose');
                                    setError(null);
                                }}
                                className="mt-4 flex w-full items-center justify-center gap-1.5 text-[13px] font-medium transition-colors hover:text-[var(--text-primary)]"
                                style={{ color: 'var(--text-faint)' }}
                            >
                                <ArrowLeft className="h-3.5 w-3.5" /> Back
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="w-full space-y-3">
                        {embedded && (
                            <NoticeBanner message="You're browsing inside another app, where Google sign-in is blocked. Use your email below, or open oryn-app.com in Chrome or Safari." />
                        )}

                        {!embedded && (
                            <>
                                <button
                                    type="button"
                                    onClick={handleGoogle}
                                    disabled={isGoogleLoading}
                                    className="flex h-12 w-full items-center justify-center gap-3 rounded-2xl border bg-white text-[15px] font-semibold text-slate-700 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-200 hover:bg-slate-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                                    style={{ borderColor: 'var(--surface-border-strong)' }}
                                >
                                    {isGoogleLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <>
                                            <GoogleIcon size={18} />
                                            <span>Continue with Google</span>
                                        </>
                                    )}
                                </button>

                                <div className="flex items-center gap-3 py-1">
                                    <div className="h-px flex-1" style={{ background: 'var(--divider)' }} />
                                    <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>
                                        or
                                    </span>
                                    <div className="h-px flex-1" style={{ background: 'var(--divider)' }} />
                                </div>
                            </>
                        )}

                        <button
                            type="button"
                            onClick={() => {
                                setStep('email');
                                setError(null);
                            }}
                            className={embedded ? primaryButtonClass : 'flex h-12 w-full items-center justify-center gap-2 rounded-2xl border text-[15px] font-semibold transition-all duration-200 hover:bg-black/[0.02] active:scale-[0.98]'}
                            style={embedded ? undefined : { borderColor: 'var(--surface-border-strong)', color: 'var(--text-primary)' }}
                        >
                            <Mail className="h-4 w-4" />
                            <span>Continue with email</span>
                        </button>
                    </div>
                )}
            </motion.div>
        </>
    );

    return (
        <div className="oryn-auth-light relative min-h-screen overflow-hidden" style={{ background: 'var(--app-bg)', color: 'var(--text-primary)' }}>
            <div className="pointer-events-none absolute inset-0" style={{ background: 'var(--page-overlay)' }} />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-64" style={{ background: 'var(--page-radial)' }} />

            {/* Ambient orbs (desktop) */}
            <div className="pointer-events-none absolute left-1/2 top-1/4 hidden h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500/[0.07] blur-[64px] opacity-60 md:block" />
            <div className="pointer-events-none absolute left-1/4 top-1/2 hidden h-48 w-48 rounded-full bg-orange-400/[0.05] blur-[48px] opacity-60 md:block" />
            <div className="pointer-events-none absolute right-1/4 top-1/3 hidden h-40 w-40 rounded-full bg-amber-500/[0.04] blur-[40px] opacity-50 md:block" />

            {/* ═══ DESKTOP ═══ */}
            <div className="relative z-10 hidden min-h-screen items-center justify-center md:flex">
                <motion.div
                    initial={{ opacity: 0, y: 28, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="relative w-full max-w-[420px] overflow-hidden rounded-3xl p-10 backdrop-blur-2xl oryn-surface-modal"
                >
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: 'var(--planner-header-shine)' }} />
                    <div className="relative flex flex-col items-center text-center">
                        <div className="mb-7 flex justify-center">
                            <AppLogo size={96} />
                        </div>
                        <h1 className="text-[26px] font-bold leading-tight tracking-[-0.04em]" style={{ color: 'var(--text-primary)' }}>
                            {heading}
                        </h1>
                        <div className="my-6 h-px w-full" style={{ background: 'var(--divider)' }} />
                        {renderContent('d')}
                    </div>
                </motion.div>
            </div>

            {/* ═══ MOBILE ═══ */}
            <div className={`relative z-10 flex min-h-[100dvh] flex-col md:hidden ${isKeyboardOpen ? 'justify-center p-4' : 'justify-end'}`}>
                <AnimatePresence>
                    {!isKeyboardOpen && (
                        <motion.div
                            initial={{ opacity: 1, height: 'auto' }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                            transition={{ duration: 0.3 }}
                            className="relative flex flex-1 flex-col items-center justify-center px-6 pb-8 pt-16 text-center"
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                                className="mb-7 flex justify-center"
                            >
                                <AppLogo size={96} />
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
                                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                                className="px-4"
                            >
                                <h1 className="text-[26px] font-bold leading-tight tracking-[-0.04em]" style={{ color: 'var(--text-primary)' }}>
                                    {heading}
                                </h1>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.div
                    layout
                    initial={{ opacity: 0, y: 32 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.44, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
                    className={`relative px-6 pb-[calc(20px+env(safe-area-inset-bottom))] pt-6 backdrop-blur-2xl ${isKeyboardOpen ? 'rounded-[32px]' : 'rounded-t-[32px]'}`}
                    style={{
                        background: 'var(--surface-modal)',
                        border: '1px solid var(--surface-border-strong)',
                        boxShadow: 'var(--surface-shadow-deep)',
                    }}
                >
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: 'var(--planner-header-shine)' }} />
                    <div className="relative flex flex-col items-center text-center">{renderContent('m')}</div>
                </motion.div>
            </div>
        </div>
    );
}
