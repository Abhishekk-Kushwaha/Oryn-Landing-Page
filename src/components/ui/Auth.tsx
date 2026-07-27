import React, { useState, useEffect } from 'react';
import { supabase, supabaseUrl, supabaseAnonKey, saveSupabaseConfig } from '../lib/supabase';
import { AlertCircle, Database, Loader2, ArrowRight, ArrowLeft, Mail, Lock, Eye, EyeOff, CheckCircle2, KeyRound } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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

/* ─── Google Icon (compact) ────────────────────────────────────────────────── */
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

/* ─── Error Banner ─────────────────────────────────────────────────────────── */
function ErrorBanner({ message }: { message: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-rose-400/14 bg-rose-500/[0.08] px-4 py-3 text-left text-[13px] leading-6 text-rose-300"
        >
            <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                <p>{message}</p>
            </div>
        </motion.div>
    );
}

function SuccessBanner({ message }: { message: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-emerald-400/14 bg-emerald-500/[0.08] px-4 py-3 text-left text-[13px] leading-6 text-emerald-300"
        >
            <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                <p>{message}</p>
            </div>
        </motion.div>
    );
}

const formInputClass =
    'h-12 w-full rounded-2xl px-4 text-[14px] font-medium outline-none transition-all duration-200 focus:ring-0 oryn-input';


/* ─── Main Auth Component ──────────────────────────────────────────────────── */
export const Auth = ({ onAuthSuccess, selectedPlan }: { onAuthSuccess?: (email?: string) => void, selectedPlan?: string | null }) => {
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [isEmailLoading, setIsEmailLoading] = useState(false);
    const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'verify-otp'>('signup');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [otpCode, setOtpCode] = useState('');
    const [isOtpLoading, setIsOtpLoading] = useState(false);
    const [otpResendCooldown, setOtpResendCooldown] = useState(0);
    const [resendSuccess, setResendSuccess] = useState<string | null>(null);

    const [error, setError] = useState<string | null>(null);
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

    // Handle Browser Back Button for OTP screen
    useEffect(() => {
        if (authMode === 'verify-otp') {
            window.history.pushState({ authStep: 'otp' }, "", window.location.pathname);
        }
    }, [authMode]);

    useEffect(() => {
        const handlePopState = () => {
            if (authMode === 'verify-otp') {
                setAuthMode('signup');
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [authMode]);

    useEffect(() => {
        const handleResize = () => {
            setIsKeyboardOpen(window.innerHeight < 500);
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (otpResendCooldown <= 0) return;
        const timer = setInterval(() => {
            setOtpResendCooldown((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [otpResendCooldown]);

    const handleGoogleAuth = async () => {
        setIsGoogleLoading(true);
        setError(null);

        try {
            const { error: googleAuthError } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: window.location.origin },
            });

            if (googleAuthError) throw googleAuthError;

            const handleReturn = () => {
                if (document.visibilityState === 'visible') {
                    setIsGoogleLoading(false);
                    document.removeEventListener('visibilitychange', handleReturn);
                    window.removeEventListener('focus', handleReturn);
                }
            };
            document.addEventListener('visibilitychange', handleReturn);
            window.addEventListener('focus', handleReturn);
            window.setTimeout(() => {
                setIsGoogleLoading(false);
                document.removeEventListener('visibilitychange', handleReturn);
                window.removeEventListener('focus', handleReturn);
            }, 3000);
        } catch (err: unknown) {
            console.error('[Auth] Error caught:', err);
            setError(err instanceof Error && err.message ? err.message : 'An error occurred during Google sign-in.');
            setIsGoogleLoading(false);
        }
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        
        let cleanedEmail = email.trim().toLowerCase();
        
        if (email !== cleanedEmail) {
            setEmail(cleanedEmail);
        }

        if (!cleanedEmail || !password) {
            setError('Please enter both email and password.');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,6}$/;
        if (!emailRegex.test(cleanedEmail)) {
            setError('Please enter a valid email address.');
            return;
        }

        // Strict Whitelist Validation
        const domain = cleanedEmail.split('@')[1];
        if (domain) {
            const allowedDomains = [
                'gmail.com',
                'yahoo.com', 'yahoo.co.in', 'yahoo.in',
                'hotmail.com', 'outlook.com', 'live.com', 'msn.com',
                'icloud.com', 'me.com', 'mac.com'
            ];
            
            if (!allowedDomains.includes(domain)) {
                setError('Please use a major email provider (Gmail, Yahoo, Outlook, etc.).');
                return;
            }
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        setIsEmailLoading(true);
        setError(null);
        setSuccessMessage(null);
        setResendSuccess(null);

        try {
            if (authMode === 'signup') {
                const { data, error: signUpError } = await supabase.auth.signUp({
                    email: cleanedEmail,
                    password,
                    options: { emailRedirectTo: window.location.origin },
                });

                let isUserAlreadyRegistered = false;

                if (signUpError) {
                    if (signUpError.message.toLowerCase().includes('already registered')) {
                        isUserAlreadyRegistered = true;
                    } else {
                        throw signUpError;
                    }
                } else if (data?.user?.identities && data.user.identities.length === 0) {
                    isUserAlreadyRegistered = true;
                }

                if (isUserAlreadyRegistered) {
                    const { error: signInError } = await supabase.auth.signInWithPassword({
                        email,
                        password,
                    });

                    if (signInError) {
                        if (signInError.message.toLowerCase().includes('email not confirmed')) {
                            const { error: resendError } = await supabase.auth.resend({
                                type: 'signup',
                                email,
                                options: { emailRedirectTo: window.location.origin },
                            });

                            if (resendError) throw resendError;

                            setAuthMode('verify-otp');
                            setOtpResendCooldown(60);
                            return;
                        }
                        throw new Error('An account with this email already exists. Please sign in.');
                    }

                    onAuthSuccess?.(email);
                    return;
                }

                setAuthMode('verify-otp');
                setOtpResendCooldown(60);
            } else {
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (signInError) {
                    if (signInError.message.toLowerCase().includes('email not confirmed')) {
                        // Option to seamlessly transition to OTP verification during signin if unverified
                        const { error: resendError } = await supabase.auth.resend({
                            type: 'signup',
                            email,
                            options: { emailRedirectTo: window.location.origin },
                        });
                        if (!resendError) {
                            setAuthMode('verify-otp');
                            setOtpResendCooldown(60);
                            return;
                        }
                    }
                    throw signInError;
                }
                
                // Successful normal sign-in without OTP requirement
                onAuthSuccess?.(email);
            }
        } catch (err: unknown) {
            setError(err instanceof Error && err.message ? err.message : 'An error occurred.');
        } finally {
            setIsEmailLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !otpCode) {
            setError('Please enter the verification code.');
            return;
        }
        if (otpCode.length < 4 || otpCode.length > 12) {
            setError('Please enter a valid verification code.');
            return;
        }

        setIsOtpLoading(true);
        setError(null);

        try {
            const { error: verifyError } = await supabase.auth.verifyOtp({
                email,
                token: otpCode.trim(),
                type: 'signup',
            });

            if (verifyError) throw verifyError;

            // Successful OTP verification
            onAuthSuccess?.(email);
        } catch (err: unknown) {
            setError(err instanceof Error && err.message ? err.message : 'Invalid verification code.');
        } finally {
            setIsOtpLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (otpResendCooldown > 0) return;
        setError(null);
        setResendSuccess(null);

        try {
            const { error: resendError } = await supabase.auth.resend({
                type: 'signup',
                email,
                options: {
                    emailRedirectTo: window.location.origin,
                },
            });

            if (resendError) throw resendError;
            setResendSuccess('A new verification code has been sent to your email.');
            setOtpResendCooldown(60);
        } catch (err: unknown) {
            setError(err instanceof Error && err.message ? err.message : 'Failed to resend verification code.');
        }
    };

    const handleForgotPassword = async () => {
        if (!email) {
            setError('Please enter your email address to reset password.');
            return;
        }

        setIsEmailLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '#account',
            });
            if (error) throw error;
            setSuccessMessage('Password reset link sent to your email.');
        } catch (err: unknown) {
            setError(err instanceof Error && err.message ? err.message : 'Failed to send reset email.');
        } finally {
            setIsEmailLoading(false);
        }
    };

    /* ── Main login screen ── */
    return (
        <div className="oryn-auth-light relative min-h-screen overflow-hidden" style={{ background: "var(--app-bg)", color: "var(--text-primary)" }}>
            <AuthBackground />

            {/* ── Ambient drifting orbs (Desktop Only) ── */}
            <div className="pointer-events-none absolute left-1/2 top-1/4 hidden h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500/[0.07] blur-[64px] opacity-60 md:block" />
            <div className="pointer-events-none absolute left-1/4 top-1/2 hidden h-48 w-48 rounded-full bg-orange-400/[0.05] blur-[48px] opacity-60 md:block" />
            <div className="pointer-events-none absolute right-1/4 top-1/3 hidden h-40 w-40 rounded-full bg-amber-500/[0.04] blur-[40px] opacity-50 md:block" />

            {/* ═══ DESKTOP: single centered card ═══ */}
            <div className="relative z-10 hidden min-h-screen items-center justify-center md:flex">
                <motion.div
                    initial={{ opacity: 0, y: 28, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="relative w-full max-w-[420px] overflow-hidden rounded-3xl p-10 backdrop-blur-2xl oryn-surface-modal"
                >
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: "var(--planner-header-shine)" }} />

                    <div className="relative flex flex-col items-center text-center">
                        {/* Logo */}
                        <div className="relative mb-8 flex justify-center">
                            <AppLogo size={112} />
                        </div>

                        {/* Wordmark */}
                        {authMode !== 'verify-otp' && (
                            <motion.div initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.15 }} className="mb-8 px-4">
                                <h1 className="text-[28px] font-bold tracking-[-0.04em] leading-tight" style={{ color: "var(--text-primary)" }}>Create Account</h1>
                                <div className="mt-4 flex flex-col items-center gap-3">
                                    <p className="text-[14.5px] font-medium" style={{ color: "var(--text-secondary)" }}>
                                        Create your account to continue your purchase.
                                    </p>
                                    <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.05] px-3.5 py-1.5">
                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500/80" />
                                        <span className="text-[12px] font-medium text-emerald-600/90">
                                            Your purchase will be securely linked to this email
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        <div className="mb-6 h-px w-full" style={{ background: "var(--divider)" }} />

                        <AnimatePresence>
                            {error && (<div className="mb-4 w-full"><ErrorBanner message={error} /></div>)}
                            {successMessage && (<div className="mb-4 w-full"><SuccessBanner message={successMessage} /></div>)}
                        </AnimatePresence>

                        <AnimatePresence mode="wait">
                            {authMode === 'verify-otp' ? (
                                <motion.div
                                    key="otp"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                    className="flex w-full flex-col items-center py-4 text-center"
                                >
                                    <button 
                                        type="button"
                                        onClick={() => setAuthMode('signup')}
                                        className="mb-4 text-[13px] font-semibold text-slate-400 hover:text-slate-600 flex items-center gap-1.5 transition-colors"
                                    >
                                        <ArrowLeft className="w-3.5 h-3.5" /> Back to email
                                    </button>
                                    {/* Order Summary Pill */}
                                    {selectedPlan && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.4, delay: 0.15 }}
                                            className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-1.5 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,1)] border border-slate-200/60 backdrop-blur-md"
                                        >
                                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                                            <span className="text-[12.5px] font-semibold tracking-wide text-slate-700">
                                                {selectedPlan === 'monthly' ? 'Monthly Plan — ₹99' : '6-Month Plan — ₹249'}
                                            </span>
                                        </motion.div>
                                    )}

                                    {/* Animated Key Icon badge */}
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                                        className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-orange-400/20 bg-orange-500/[0.08]"
                                    >
                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.3, delay: 0.35 }}>
                                            <KeyRound className="h-8 w-8 text-orange-400" />
                                        </motion.div>
                                    </motion.div>

                                    <motion.h2
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4, delay: 0.2 }}
                                        className="mb-2 text-[18px] font-semibold tracking-[-0.02em]"
                                        style={{ color: "var(--text-primary)" }}
                                    >
                                        Confirm your email
                                    </motion.h2>
                                    <motion.p
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4, delay: 0.3 }}
                                        className="mb-1 text-[13px] leading-5 text-center px-4"
                                        style={{ color: "var(--text-muted)" }}
                                    >
                                        We sent a verification code to
                                    </motion.p>
                                    <motion.p
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4, delay: 0.35 }}
                                        className="mb-6 text-[14px] font-medium"
                                        style={{ color: "var(--text-secondary)" }}
                                    >
                                        {email}
                                    </motion.p>

                                    <motion.form
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4, delay: 0.4 }}
                                        onSubmit={handleVerifyOtp}
                                        className="w-full space-y-4"
                                    >
                                        <div className="relative">
                                            <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--text-faint)" }} />
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                maxLength={10}
                                                value={otpCode}
                                                onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                                                className={formInputClass + ' pl-11 tracking-[0.2em] text-center font-bold text-[18px]'}
                                                placeholder="0000"
                                                required
                                            />
                                        </div>

                                        {resendSuccess && (
                                            <div className="rounded-xl border border-emerald-400/14 bg-emerald-500/[0.08] px-4 py-2.5 text-left text-[12px] leading-5 text-emerald-300">
                                                {resendSuccess}
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={isOtpLoading}
                                            className="group relative flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-orange-300 to-orange-400 text-[15px] font-semibold tracking-[-0.01em] text-white shadow-[inset_0px_1px_1px_rgba(255,255,255,0.34),0px_8px_24px_-8px_rgba(251,146,60,0.42)] transition-all duration-200 hover:from-orange-200 hover:to-orange-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {isOtpLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><span>Verify & Continue to Payment</span><ArrowRight className="h-4 w-4" /></>}
                                        </button>
                                        
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.5 }}
                                            className="mt-3 flex items-center justify-center gap-1.5 text-[11.5px] font-medium text-emerald-600/90"
                                        >
                                            <Lock className="h-3 w-3" />
                                            <span>Secure checkout via Razorpay will open next</span>
                                        </motion.div>
                                    </motion.form>

                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.4, delay: 0.45 }}
                                        className="mt-6 flex flex-col items-center gap-3 w-full"
                                    >
                                        <button
                                            type="button"
                                            onClick={handleResendOtp}
                                            disabled={otpResendCooldown > 0}
                                            className="text-[13px] font-semibold text-orange-400/80 transition-colors hover:text-orange-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {otpResendCooldown > 0 ? `Resend code in ${otpResendCooldown}s` : 'Resend verification code'}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => { setAuthMode('signup'); setOtpCode(''); setError(null); setResendSuccess(null); }}
                                            className="text-[13px] font-medium transition-colors hover:text-[var(--text-primary)]"
                                            style={{ color: "var(--text-faint)" }}
                                        >
                                            ← Back to sign up
                                        </button>
                                    </motion.div>
                                </motion.div>
                            ) : (
                                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
                                    {/* Email/password form */}
                                    <form onSubmit={handleEmailAuth} className="w-full space-y-3">
                                        <div className="relative">
                                            <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--text-faint)" }} />
                                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={formInputClass + ' pl-11'} placeholder="Email address" autoComplete="email" required />
                                        </div>
                                        <div className="relative">
                                            <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--text-faint)" }} />
                                            <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className={formInputClass + ' pl-11 pr-11'} placeholder="Password" autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'} required minLength={6} />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors" style={{ color: "var(--text-faint)" }} tabIndex={-1}>
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>

                                        <button type="submit" disabled={isEmailLoading} className="group relative flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-orange-300 to-orange-400 text-[15px] font-semibold tracking-[-0.01em] text-white shadow-[inset_0px_1px_1px_rgba(255,255,255,0.34),0px_8px_24px_-8px_rgba(251,146,60,0.42)] transition-all duration-200 hover:from-orange-200 hover:to-orange-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60">
                                            {isEmailLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><span>Verify your email</span><ArrowRight className="h-4 w-4" /></>}
                                        </button>
                                    </form>




                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>

            {/* ═══ MOBILE: split layout — hero top + bottom sheet ═══ */}
            <div className={`relative z-10 flex min-h-[100dvh] flex-col md:hidden ${isKeyboardOpen ? 'justify-center p-4' : 'justify-end'}`}>
                <AnimatePresence>
                    {!isKeyboardOpen && (
                        <motion.div
                            initial={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                            animate={{ opacity: 1, height: 'auto' }}
                            transition={{ duration: 0.3 }}
                            className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 pb-8 pt-16 text-center"
                        >
                            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} className="relative mb-8 flex justify-center">
                                <AppLogo size={112} />
                            </motion.div>

                            {authMode !== 'verify-otp' && (
                                <motion.div initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.22 }} className="px-4">
                                    <h1 className="text-[28px] font-bold tracking-[-0.04em] leading-tight" style={{ color: "var(--text-primary)" }}>Create Account</h1>
                                    <div className="mt-4 flex flex-col items-center gap-3">
                                        <p className="text-[14.5px] font-medium" style={{ color: "var(--text-secondary)" }}>
                                            Create your account to continue your purchase.
                                        </p>
                                        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.05] px-3.5 py-1.5 text-left">
                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500/80 shrink-0" />
                                            <span className="text-[12px] font-medium text-emerald-600/90 leading-tight">
                                                Your purchase will be securely linked to this email
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.div layout initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.44, ease: [0.16, 1, 0.3, 1], delay: 0.18 }} className={`relative px-6 pb-[calc(20px+env(safe-area-inset-bottom))] pt-6 backdrop-blur-2xl ${isKeyboardOpen ? 'rounded-[32px]' : 'rounded-t-[32px]'}`} style={{ background: "var(--surface-modal)", border: `1px solid var(--surface-border-strong)`, boxShadow: "var(--surface-shadow-deep)" }}>
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: "var(--planner-header-shine)" }} />
                    <div className="relative">
                        <AnimatePresence>
                            {error && (<div className="mb-3"><ErrorBanner message={error} /></div>)}
                            {successMessage && (<div className="mb-3"><SuccessBanner message={successMessage} /></div>)}
                        </AnimatePresence>

                        <AnimatePresence mode="wait">
                            {authMode === 'verify-otp' ? (
                                <motion.div
                                    key="otp-m"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                    className="flex flex-col items-center py-2 text-center"
                                >
                                    <button 
                                        type="button"
                                        onClick={() => setAuthMode('signup')}
                                        className="mb-4 text-[13px] font-semibold text-slate-400 hover:text-slate-600 flex items-center gap-1.5 transition-colors"
                                    >
                                        <ArrowLeft className="w-3.5 h-3.5" /> Back to email
                                    </button>
                                    {/* Order Summary Pill */}
                                    {selectedPlan && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.4, delay: 0.15 }}
                                            className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-1.5 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,1)] border border-slate-200/60 backdrop-blur-md"
                                        >
                                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                                            <span className="text-[12.5px] font-semibold tracking-wide text-slate-700">
                                                {selectedPlan === 'monthly' ? 'Monthly Plan — ₹99' : '6-Month Plan — ₹249'}
                                            </span>
                                        </motion.div>
                                    )}

                                    {/* Animated Key Icon badge */}
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                                        className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-400/20 bg-orange-500/[0.08]"
                                    >
                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.3, delay: 0.35 }}>
                                            <KeyRound className="h-7 w-7 text-orange-400" />
                                        </motion.div>
                                    </motion.div>

                                    <motion.h2
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4, delay: 0.2 }}
                                        className="mb-1.5 text-[17px] font-semibold tracking-[-0.02em]"
                                        style={{ color: "var(--text-primary)" }}
                                    >
                                        Confirm your email
                                    </motion.h2>
                                    <motion.p
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4, delay: 0.3 }}
                                        className="mb-0.5 text-[13px] leading-5 text-center px-4"
                                        style={{ color: "var(--text-muted)" }}
                                    >
                                        We sent a verification code to
                                    </motion.p>
                                    <motion.p
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4, delay: 0.35 }}
                                        className="mb-5 text-[13px] font-medium"
                                        style={{ color: "var(--text-secondary)" }}
                                    >
                                        {email}
                                    </motion.p>

                                    <motion.form
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4, delay: 0.4 }}
                                        onSubmit={handleVerifyOtp}
                                        className="w-full space-y-3"
                                    >
                                        <div className="relative">
                                            <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--text-faint)" }} />
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                maxLength={10}
                                                value={otpCode}
                                                onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                                                className={formInputClass + ' pl-11 tracking-[0.2em] text-center font-bold text-[18px]'}
                                                placeholder="0000"
                                                required
                                            />
                                        </div>

                                        {resendSuccess && (
                                            <div className="rounded-xl border border-emerald-400/14 bg-emerald-500/[0.08] px-4 py-2 text-left text-[12px] leading-4 text-emerald-300">
                                                {resendSuccess}
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={isOtpLoading}
                                            className="group relative flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-orange-300 to-orange-400 text-[15px] font-semibold tracking-[-0.01em] text-white shadow-[inset_0px_1px_1px_rgba(255,255,255,0.34),0px_8px_24px_-8px_rgba(251,146,60,0.42)] transition-all duration-200 hover:from-orange-200 hover:to-orange-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {isOtpLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><span>Verify & Continue to Payment</span><ArrowRight className="h-4 w-4" /></>}
                                        </button>
                                        
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.5 }}
                                            className="mt-3 flex items-center justify-center gap-1.5 text-[11.5px] font-medium text-emerald-600/90"
                                        >
                                            <Lock className="h-3 w-3" />
                                            <span>Secure checkout via Razorpay will open next</span>
                                        </motion.div>
                                    </motion.form>

                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.4, delay: 0.45 }}
                                        className="mt-5 flex flex-col items-center gap-2.5 w-full"
                                    >
                                        <button
                                            type="button"
                                            onClick={handleResendOtp}
                                            disabled={otpResendCooldown > 0}
                                            className="text-[13px] font-semibold text-orange-400/80 transition-colors hover:text-orange-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {otpResendCooldown > 0 ? `Resend code in ${otpResendCooldown}s` : 'Resend verification code'}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => { setAuthMode('signup'); setOtpCode(''); setError(null); setResendSuccess(null); }}
                                            className="text-[13px] font-medium transition-colors hover:text-[var(--text-primary)]"
                                            style={{ color: "var(--text-faint)" }}
                                        >
                                            ← Back to sign up
                                        </button>
                                    </motion.div>
                                </motion.div>
                            ) : (
                                <motion.div key="form-m" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    {/* Email/password form */}
                                    <form onSubmit={handleEmailAuth} className="space-y-2.5">
                                        <div className="relative">
                                            <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--text-faint)" }} />
                                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={formInputClass + ' pl-11'} placeholder="Email address" autoComplete="email" required />
                                        </div>
                                        <div className="relative">
                                            <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--text-faint)" }} />
                                            <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className={formInputClass + ' pl-11 pr-11'} placeholder="Password" autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'} required minLength={6} />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors" style={{ color: "var(--text-faint)" }} tabIndex={-1}>
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>

                                        <button type="submit" disabled={isEmailLoading} className="group relative flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-orange-300 to-orange-400 text-[15px] font-semibold tracking-[-0.01em] text-white shadow-[inset_0px_1px_1px_rgba(255,255,255,0.34),0px_8px_24px_-8px_rgba(251,146,60,0.42)] transition-all duration-200 hover:from-orange-200 hover:to-orange-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60">
                                            {isEmailLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><span>Verify your email</span><ArrowRight className="h-4 w-4" /></>}
                                        </button>
                                    </form>




                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};


/* ─── Background ───────────────────────────────────────────────────────────── */
function AuthBackground() {
    return (
        <>
            <div className="pointer-events-none absolute inset-0" style={{ background: "var(--page-overlay)" }} />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-64" style={{ background: "var(--page-radial)" }} />
        </>
    );
}
