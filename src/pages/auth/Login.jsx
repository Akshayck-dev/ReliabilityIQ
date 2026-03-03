import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
    const { signIn, signInWithGoogle, user } = useAuth();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [touched, setTouched] = useState({});

    const markTouched = (field) => setTouched(prev => ({ ...prev, [field]: true }));

    const errors = useMemo(() => {
        const e = {};
        if (!email.trim()) e.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email';
        if (!password) e.password = 'Password is required';
        else if (password.length < 8) e.password = 'Minimum 8 characters';
        return e;
    }, [email, password]);

    const isValid = Object.keys(errors).length === 0;

    // Redirect to dashboard if they are already logged in (e.g. returning from Google Auth)
    useEffect(() => {
        if (user) {
            navigate('/dashboard', { replace: true });
        }
    }, [user, navigate]);

    const [formError, setFormError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isValid) return;
        setFormError('');
        setLoading(true);

        try {
            const { error } = await signIn(email, password);

            if (error) {
                const msg = error.message || '';
                if (msg.includes('Invalid login') || msg.includes('invalid_credentials')) {
                    setFormError('The email or password you entered is incorrect. Please try again.');
                } else if (msg.includes('Email not confirmed')) {
                    setFormError('Your email is not verified yet. Please check your inbox and click the verification link.');
                } else if (msg.includes('rate') || msg.includes('too many')) {
                    setFormError('Too many login attempts. Please wait a moment and try again.');
                } else {
                    setFormError(msg || 'Something went wrong. Please try again.');
                }
                setLoading(false);
            } else {
                toast.success('Welcome back!');
                navigate('/dashboard');
            }
        } catch (err) {
            setFormError('Unable to connect. Please check your internet connection.');
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        const { error } = await signInWithGoogle();
        if (error) {
            toast.error(error.message || "Google sign in failed.");
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 flex bg-white dark:bg-slate-950 overflow-hidden">
            {/* Left Dark Panel */}
            <div className="hidden lg:flex w-[480px] bg-[#111424] flex-col justify-between p-12 relative overflow-hidden">
                {/* Background glow effects to match image */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] rounded-full bg-white/5 blur-[100px]"></div>
                    <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-orange-500/10 blur-[120px]"></div>
                </div>

                <div className="relative z-10">
                    {/* Logo Section */}
                    <div className="flex items-center gap-2 mb-20">
                        <div className="w-8 h-8 bg-[#ea580c] rounded flex items-center justify-center">
                            <span className="text-white font-bold text-sm tracking-tighter">RiQ</span>
                        </div>
                        <span className="text-xl font-bold text-white tracking-tight">ReliabilityIQ</span>
                    </div>

                    {/* Headline */}
                    <div className="max-w-[320px]">
                        <h1 className="text-[44px] leading-[1.1] font-bold text-white mb-6 tracking-tight">
                            Smart Task & <br />
                            <span className="text-[#ea580c]">Reliability</span> <br />
                            Management
                        </h1>
                        <p className="text-[#a1a1aa] text-lg leading-relaxed">
                            Optimize your productivity with data-driven insights and task reliability tracking.
                        </p>
                    </div>
                </div>

                {/* Footer Profiles */}
                <div className="relative z-10 flex items-center gap-4 mt-12">
                    <div className="flex -space-x-3">
                        <div className="w-10 h-10 rounded-full border-2 border-[#111424] bg-[#fef3c7] z-30"></div>
                        <div className="w-10 h-10 rounded-full border-2 border-[#111424] bg-[#dcfce7] z-20"></div>
                        <div className="w-10 h-10 rounded-full border-2 border-[#111424] bg-[#ffedd5] z-10"></div>
                    </div>
                    <span className="text-sm font-medium text-[#a1a1aa]">Joined by over 10,000+ teams worldwide</span>
                </div>
            </div>

            {/* Right Form Panel */}
            <div className="flex-1 flex flex-col justify-center items-center p-8 relative">
                <div className="w-full max-w-[420px]">
                    <div className="mb-10 text-center lg:text-left">
                        <h2 className="text-[32px] font-bold text-[#0f172a] dark:text-white tracking-tight mb-2">Welcome Back</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Please enter your details to sign in.</p>
                    </div>

                    {/* Error Banner */}
                    {formError && (
                        <div className="mb-5 flex items-start gap-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3.5 animate-fade-in">
                            <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-red-700 dark:text-red-400">{formError}</p>
                            </div>
                            <button onClick={() => setFormError('')} className="text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors shrink-0">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 mb-1.5">Email address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); setFormError(''); }}
                                onBlur={() => markTouched('email')}
                                placeholder="name@company.com"
                                className={`w-full px-4 py-3 bg-white dark:bg-slate-900 border rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ea580c]/20 focus:border-[#ea580c] transition-all ${touched.email && errors.email ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-700'
                                    }`}
                            />
                            {touched.email && errors.email && (
                                <p className="flex items-center gap-1 text-[11px] font-medium text-red-500 mt-1.5">
                                    <AlertCircle size={12} />{errors.email}
                                </p>
                            )}
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1.5">
                                <label className="block text-xs font-bold text-[#334155] dark:text-slate-300">Password</label>
                                <a href="#" className="text-xs font-bold text-[#ea580c] dark:text-[#f97316] hover:underline">Forgot password?</a>
                            </div>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); setFormError(''); }}
                                    onBlur={() => markTouched('password')}
                                    placeholder="••••••••"
                                    className={`w-full pl-4 pr-10 py-3 bg-white dark:bg-slate-900 border rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ea580c]/20 focus:border-[#ea580c] transition-all ${touched.password && errors.password ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-700'
                                        }`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {touched.password && errors.password && (
                                <p className="flex items-center gap-1 text-[11px] font-medium text-red-500 mt-1.5">
                                    <AlertCircle size={12} />{errors.password}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center mb-6">
                            <input type="checkbox" id="remember" className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 dark:bg-slate-800 text-[#ea580c] focus:ring-[#ea580c]" />
                            <label htmlFor="remember" className="ml-2 text-sm text-slate-500 dark:text-slate-400 font-medium">Remember me for 30 days</label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !isValid}
                            className="w-full py-3 px-4 bg-[#ea580c] hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-500/30 text-white rounded-lg text-sm font-bold shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    <span>Signing in...</span>
                                </>
                            ) : (
                                'Log In'
                            )}
                        </button>
                    </form>

                    <div className="mt-8 mb-6 relative text-center">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
                        </div>
                        <span className="relative z-10 bg-white dark:bg-slate-950 px-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                            Or continue with
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full py-3 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-100 dark:focus:ring-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-bold shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                        )}
                        Continue with Google
                    </button>

                    {/* Signup link */}
                    <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
                        Don't have an account?{' '}
                        <Link to="/signup" className="font-bold text-[#ea580c] dark:text-[#f97316] hover:underline">
                            Create Account
                        </Link>
                    </p>
                </div>

                {/* Footer Copyright */}
                <div className="absolute bottom-6 w-full text-center">
                    <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                        © 2024 ReliabilityIQ. All rights reserved. <a href="#" className="hover:underline">Privacy Policy</a> • <a href="#" className="hover:underline">Terms of Service</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
