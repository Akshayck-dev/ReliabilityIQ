import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, CheckCircle2, XCircle, AlertCircle, Shield, UserCheck } from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';
import toast from 'react-hot-toast';

const Signup = () => {
    const { signUp, signInWithGoogle, user } = useAuth();
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [selectedRole, setSelectedRole] = useState('employee');
    const [designation, setDesignation] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [touched, setTouched] = useState({});

    const DESIGNATIONS = [
        'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
        'QA Engineer', 'DevOps Engineer', 'UI/UX Designer',
        'HR', 'Analyst', 'Support'
    ];

    useEffect(() => {
        if (user) navigate('/dashboard', { replace: true });
    }, [user, navigate]);

    const markTouched = (field) => setTouched(prev => ({ ...prev, [field]: true }));

    // --- Validation ---
    const errors = useMemo(() => {
        const e = {};
        if (!name.trim()) e.name = 'Name is required';
        else if (name.trim().length < 3) e.name = 'Name must be at least 3 characters';

        if (!email.trim()) e.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email address';

        if (!password) e.password = 'Password is required';
        else if (password.length < 8) e.password = 'Password must be at least 8 characters';

        if (!confirmPassword) e.confirmPassword = 'Please confirm your password';
        else if (confirmPassword !== password) e.confirmPassword = 'Passwords do not match';

        if (selectedRole === 'employee' && !designation) e.designation = 'Please select your designation';

        return e;
    }, [name, email, password, confirmPassword, selectedRole, designation]);

    const isValid = Object.keys(errors).length === 0;

    // --- Password strength ---
    const strength = useMemo(() => {
        let score = 0;
        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        return score;
    }, [password]);

    const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
    const strengthColor = ['', 'bg-red-500', 'bg-amber-500', 'bg-blue-500', 'bg-green-500'][strength];

    // --- Handlers ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isValid) return;

        setLoading(true);
        try {
            const { data, error } = await signUp(email, password, {
                full_name: name.trim(),
                signup_role: selectedRole,
                signup_designation: selectedRole === 'employee' ? designation : null
            });

            if (error) {
                if (error.message?.includes('already registered')) {
                    toast.error('This email is already registered. Please log in instead.');
                } else if (error.message?.includes('invalid')) {
                    toast.error('Invalid email or password format.');
                } else {
                    toast.error(error.message || 'Signup failed. Please try again.');
                }
                setLoading(false);
                return;
            }

            // Supabase returns a user with empty identities when email already exists
            // (security feature — doesn't reveal if email is taken when confirmation is ON)
            if (data?.user?.identities?.length === 0) {
                toast.error('This email is already registered. Please log in instead.');
                setLoading(false);
                return;
            }

            if (data?.user) {
                toast.success('Account created! Complete your profile to get started.');
                navigate('/complete-signup', {
                    state: { prefillName: name, prefillRole: selectedRole, prefillDesignation: designation }
                });
            }
        } catch (err) {
            toast.error('Network error. Please check your connection.');
            setLoading(false);
        }
    };

    const handleGoogleSignup = async () => {
        setLoading(true);
        const { error } = await signInWithGoogle();
        if (error) {
            toast.error(error.message || 'Google sign up failed.');
            setLoading(false);
        }
    };

    const FieldError = ({ field }) => {
        if (!touched[field] || !errors[field]) return null;
        return (
            <p className="flex items-center gap-1 text-[11px] font-medium text-red-500 mt-1.5">
                <AlertCircle size={12} />
                {errors[field]}
            </p>
        );
    };

    const FieldCheck = ({ field }) => {
        if (!touched[field] || errors[field]) return null;
        return <CheckCircle2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />;
    };

    return (
        <div className="fixed inset-0 flex bg-white dark:bg-slate-950 overflow-hidden">
            {/* Left Dark Panel */}
            <div className="hidden lg:flex w-[480px] bg-[#111424] flex-col justify-between p-12 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] rounded-full bg-white/5 blur-[100px]"></div>
                    <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-orange-500/10 blur-[120px]"></div>
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-20">
                        <div className="w-8 h-8 bg-[#ea580c] rounded flex items-center justify-center">
                            <span className="text-white font-bold text-sm tracking-tighter">RiQ</span>
                        </div>
                        <span className="text-xl font-bold text-white tracking-tight">ReliabilityIQ</span>
                    </div>
                    <div className="max-w-[320px]">
                        <h1 className="text-[44px] leading-[1.1] font-bold text-white mb-6 tracking-tight">
                            Join Your <br />
                            <span className="text-[#ea580c]">Team</span> <br />
                            Today
                        </h1>
                        <p className="text-[#a1a1aa] text-lg leading-relaxed">
                            Start tracking reliability, hit deadlines, and boost your team's performance.
                        </p>
                    </div>
                </div>

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
            <div className="flex-1 flex flex-col justify-center items-center p-8 relative overflow-y-auto">
                <div className="w-full max-w-[420px]">
                    <div className="mb-8 text-center lg:text-left">
                        <h2 className="text-[32px] font-bold text-[#0f172a] dark:text-white tracking-tight mb-2">Create Account</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Fill in the details below to get started.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                        {/* Full Name */}
                        <div>
                            <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 mb-1.5">Full Name</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    onBlur={() => markTouched('name')}
                                    placeholder="John Doe"
                                    className={`w-full px-4 py-3 bg-white dark:bg-slate-900 border rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ea580c]/20 focus:border-[#ea580c] transition-all ${touched.name && errors.name ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-700'
                                        }`}
                                />
                                <FieldCheck field="name" />
                            </div>
                            <FieldError field="name" />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 mb-1.5">Email address</label>
                            <div className="relative">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onBlur={() => markTouched('email')}
                                    placeholder="name@company.com"
                                    className={`w-full px-4 py-3 bg-white dark:bg-slate-900 border rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ea580c]/20 focus:border-[#ea580c] transition-all ${touched.email && errors.email ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-700'
                                        }`}
                                />
                                <FieldCheck field="email" />
                            </div>
                            <FieldError field="email" />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 mb-1.5">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onBlur={() => markTouched('password')}
                                    placeholder="••••••••"
                                    className={`w-full pl-4 pr-10 py-3 bg-white dark:bg-slate-900 border rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ea580c]/20 focus:border-[#ea580c] transition-all ${touched.password && errors.password ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-700'
                                        }`}
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            <FieldError field="password" />
                            {/* Strength bar */}
                            {password.length > 0 && (
                                <div className="mt-2">
                                    <div className="flex gap-1 h-1.5">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className={`flex-1 rounded-full transition-colors ${i <= strength ? strengthColor : 'bg-slate-200 dark:bg-slate-700'}`} />
                                        ))}
                                    </div>
                                    <p className={`text-[11px] font-medium mt-1 ${strength <= 1 ? 'text-red-500' : strength === 2 ? 'text-amber-500' : strength === 3 ? 'text-blue-500' : 'text-green-500'
                                        }`}>{strengthLabel}</p>
                                </div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 mb-1.5">Confirm Password</label>
                            <div className="relative">
                                <input
                                    type={showConfirm ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    onBlur={() => markTouched('confirmPassword')}
                                    placeholder="••••••••"
                                    className={`w-full pl-4 pr-10 py-3 bg-white dark:bg-slate-900 border rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ea580c]/20 focus:border-[#ea580c] transition-all ${touched.confirmPassword && errors.confirmPassword ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-700'
                                        }`}
                                />
                                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            <FieldError field="confirmPassword" />
                        </div>

                        {/* Role Selection */}
                        <div>
                            <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 mb-2">I am a</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => { setSelectedRole('employee'); setDesignation(''); }}
                                    className={`flex items-center gap-2.5 p-3 rounded-lg border-2 text-left transition-all ${selectedRole === 'employee'
                                        ? 'border-[#ea580c] bg-orange-50 dark:bg-orange-950/30'
                                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                        }`}
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedRole === 'employee' ? 'bg-[#ea580c] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                        }`}>
                                        <UserCheck size={16} />
                                    </div>
                                    <div>
                                        <p className={`text-sm font-bold ${selectedRole === 'employee' ? 'text-[#ea580c]' : 'text-slate-700 dark:text-slate-300'
                                            }`}>Employee</p>
                                        <p className="text-[10px] text-slate-400">I complete tasks</p>
                                    </div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setSelectedRole('manager'); setDesignation(''); }}
                                    className={`flex items-center gap-2.5 p-3 rounded-lg border-2 text-left transition-all ${selectedRole === 'manager'
                                        ? 'border-[#ea580c] bg-orange-50 dark:bg-orange-950/30'
                                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                        }`}
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedRole === 'manager' ? 'bg-[#ea580c] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                        }`}>
                                        <Shield size={16} />
                                    </div>
                                    <div>
                                        <p className={`text-sm font-bold ${selectedRole === 'manager' ? 'text-[#ea580c]' : 'text-slate-700 dark:text-slate-300'
                                            }`}>Manager</p>
                                        <p className="text-[10px] text-slate-400">I assign tasks</p>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Designation (employees only) */}
                        {selectedRole === 'employee' && (
                            <div>
                                <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 mb-1.5">Designation</label>
                                <select
                                    value={designation}
                                    onChange={(e) => setDesignation(e.target.value)}
                                    onBlur={() => markTouched('designation')}
                                    className={`w-full px-4 py-3 bg-white dark:bg-slate-900 border rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#ea580c]/20 focus:border-[#ea580c] transition-all appearance-none cursor-pointer ${touched.designation && errors.designation ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-700'
                                        }`}
                                >
                                    <option value="" disabled>Select your designation</option>
                                    {DESIGNATIONS.map(d => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                                <FieldError field="designation" />
                            </div>
                        )}

                        {/* Submit */}
                        <div className="pt-1">
                            <button
                                type="submit"
                                disabled={loading || !isValid}
                                className="w-full py-3 px-4 bg-[#ea580c] hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-500/30 text-white rounded-lg text-sm font-bold shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        <span>Creating Account...</span>
                                    </>
                                ) : (
                                    'Create Account'
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Divider */}
                    <div className="mt-6 mb-5 relative text-center">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
                        </div>
                        <span className="relative z-10 bg-white dark:bg-slate-950 px-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                            Or continue with
                        </span>
                    </div>

                    {/* Google */}
                    <button
                        type="button"
                        onClick={handleGoogleSignup}
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

                    {/* Login Link */}
                    <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
                        Already have an account?{' '}
                        <Link to="/login" className="font-bold text-[#ea580c] dark:text-[#f97316] hover:underline">
                            Log In
                        </Link>
                    </p>
                </div>

                {/* Footer */}
                <div className="absolute bottom-6 w-full text-center">
                    <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                        © 2026 ReliabilityIQ. All rights reserved. <a href="#" className="hover:underline">Privacy Policy</a> • <a href="#" className="hover:underline">Terms of Service</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Signup;
