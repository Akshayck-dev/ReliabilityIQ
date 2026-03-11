import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, AlertCircle, ShieldCheck, BarChart2, Users } from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';
import toast from 'react-hot-toast';

const FEATURES = [
    { icon: BarChart2, title: 'Real-time Analytics', desc: 'Track task completion and team reliability at a glance.' },
    { icon: Users, title: 'Team Management', desc: 'Assign, monitor and review work across your entire team.' },
    { icon: ShieldCheck, title: 'Reliability Scoring', desc: 'Automated on-time completion scoring per employee.' },
];

const Login = () => {
    const { signIn, signInWithGoogle, user } = useAuth();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [touched, setTouched] = useState({});
    const [formError, setFormError] = useState('');

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

    useEffect(() => {
        if (user) navigate('/dashboard', { replace: true });
    }, [user, navigate]);

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
        } catch {
            setFormError('Unable to connect. Please check your internet connection.');
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        const { error } = await signInWithGoogle();
        if (error) {
            toast.error(error.message || 'Google sign in failed.');
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 flex bg-white dark:bg-slate-950 overflow-hidden">

            {/* ── Left Dark Panel ─────────────────────────────────── */}
            <div className="hidden lg:flex w-[500px] bg-[#0b1120] flex-col justify-between p-12 relative overflow-hidden shrink-0">
                {/* Glow effects */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-[-15%] right-[-15%] w-[400px] h-[400px] rounded-full bg-blue-600/10 blur-[120px]" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[350px] h-[350px] rounded-full bg-blue-400/5 blur-[100px]" />
                </div>

                {/* Top: Logo */}
                <div className="relative z-10">
                    <div className="flex items-center gap-2.5 mb-16">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/30">
                            <span className="text-white font-bold text-xs tracking-tight">RiQ</span>
                        </div>
                        <span className="text-xl font-bold text-white tracking-tight">
                            Reliability<span className="text-blue-400">IQ</span>
                        </span>
                    </div>

                    {/* Headline */}
                    <div className="max-w-[340px] mb-12">
                        <h1 className="text-[40px] leading-[1.1] font-bold text-white mb-4 tracking-tight">
                            Smart Task &<br />
                            <span className="text-blue-400">Reliability</span><br />
                            Management
                        </h1>
                        <p className="text-slate-400 text-base leading-relaxed">
                            Optimize your team's productivity with data-driven insights and real-time reliability tracking.
                        </p>
                    </div>

                    {/* Feature list */}
                    <div className="space-y-4">
                        {FEATURES.map(({ icon: Icon, title, desc }) => (
                            <div key={title} className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-600/15 border border-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                    <Icon size={15} className="text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white">{title}</p>
                                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom: Social proof */}
                <div className="relative z-10 flex items-center gap-4">
                    <div className="flex -space-x-2.5">
                        {['bg-blue-200', 'bg-emerald-200', 'bg-violet-200', 'bg-amber-200'].map((bg, i) => (
                            <div key={i} className={`w-9 h-9 rounded-full border-2 border-[#0b1120] ${bg}`} style={{ zIndex: 4 - i }} />
                        ))}
                    </div>
                    <p className="text-xs font-medium text-slate-400">
                        Trusted by <span className="text-white font-bold">10,000+</span> teams worldwide
                    </p>
                </div>
            </div>

            {/* ── Right Form Panel ─────────────────────────────────── */}
            <div className="flex-1 flex flex-col justify-center items-center p-8 relative">
                <div className="w-full max-w-[420px] animate-fade-in">

                    {/* Header */}
                    <div className="mb-8 text-center lg:text-left">
                        {/* Mobile-only logo */}
                        <div className="flex items-center gap-2 mb-6 lg:hidden justify-center">
                            <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center">
                                <span className="text-white font-bold text-[10px]">RiQ</span>
                            </div>
                            <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">ReliabilityIQ</span>
                        </div>
                        <h2 className="text-[30px] font-bold text-slate-900 dark:text-white tracking-tight mb-1.5">Welcome back</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Enter your details to sign in to your account.</p>
                    </div>

                    {/* Error Banner */}
                    {formError && (
                        <div className="mb-5 flex items-start gap-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-3.5 animate-fade-in">
                            <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                            <p className="text-sm font-medium text-red-700 dark:text-red-400 flex-1">{formError}</p>
                            <button onClick={() => setFormError('')} className="text-red-400 hover:text-red-600 dark:hover:text-red-300 shrink-0 text-lg leading-none">×</button>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                Email address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); setFormError(''); }}
                                onBlur={() => markTouched('email')}
                                placeholder="name@company.com"
                                className={`w-full px-4 py-3 bg-white dark:bg-slate-900 border rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                                    touched.email && errors.email ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-700'
                                }`}
                            />
                            {touched.email && errors.email && (
                                <p className="flex items-center gap-1 text-[11px] font-medium text-red-500 mt-1.5">
                                    <AlertCircle size={11} />{errors.email}
                                </p>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <div className="flex justify-between items-center mb-1.5">
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Password</label>
                                <a href="#" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                                    Forgot password?
                                </a>
                            </div>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); setFormError(''); }}
                                    onBlur={() => markTouched('password')}
                                    placeholder="••••••••"
                                    className={`w-full pl-4 pr-10 py-3 bg-white dark:bg-slate-900 border rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                                        touched.password && errors.password ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-700'
                                    }`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                                </button>
                            </div>
                            {touched.password && errors.password && (
                                <p className="flex items-center gap-1 text-[11px] font-medium text-red-500 mt-1.5">
                                    <AlertCircle size={11} />{errors.password}
                                </p>
                            )}
                        </div>

                        {/* Remember me */}
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="remember"
                                className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 dark:bg-slate-800 text-blue-600 focus:ring-blue-500 accent-blue-600"
                            />
                            <label htmlFor="remember" className="ml-2 text-sm text-slate-500 dark:text-slate-400">
                                Remember me for 30 days
                            </label>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading || !isValid}
                            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/25 text-white rounded-xl text-sm font-bold shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                        >
                            {loading ? (
                                <><Loader2 size={17} className="animate-spin" /><span>Signing in...</span></>
                            ) : 'Log In'}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="my-6 relative text-center">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                        </div>
                        <span className="relative z-10 bg-white dark:bg-slate-950 px-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                            Or continue with
                        </span>
                    </div>

                    {/* Google */}
                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full py-3 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-100 dark:focus:ring-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : (
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                        )}
                        Continue with Google
                    </button>

                    {/* Sign up link */}
                    <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
                        Don't have an account?{' '}
                        <Link to="/signup" className="font-bold text-blue-600 dark:text-blue-400 hover:underline">
                            Create Account
                        </Link>
                    </p>
                </div>

                {/* Footer */}
                <div className="absolute bottom-6 w-full text-center">
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                        © 2024 ReliabilityIQ ·{' '}
                        <a href="#" className="hover:text-slate-600 dark:hover:text-slate-300 hover:underline">Privacy</a>{' '}·{' '}
                        <a href="#" className="hover:text-slate-600 dark:hover:text-slate-300 hover:underline">Terms</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
