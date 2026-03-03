import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

const CompleteSignup = () => {
    const { user, completeOnboarding, role } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Pre-fill from user_metadata (persisted in Supabase) OR location.state (same-tab navigate)
    const meta = user?.user_metadata || {};
    const navState = location.state || {};

    const [name, setName] = useState(
        navState.prefillName || meta.full_name || ''
    );
    const [selectedRole, setSelectedRole] = useState(
        navState.prefillRole || meta.signup_role || 'employee'
    );
    const [designation, setDesignation] = useState(
        navState.prefillDesignation || meta.signup_designation || ''
    );
    const [loading, setLoading] = useState(false);

    const DESIGNATIONS = [
        'Frontend Developer',
        'Backend Developer',
        'Full Stack Developer',
        'QA Engineer',
        'DevOps Engineer',
        'UI/UX Designer',
        'HR',
        'Analyst',
        'Support'
    ];

    useEffect(() => {
        // If they already have a valid role, bounce them to the dashboard
        if (role && role !== 'pending_signup') {
            navigate('/dashboard', { replace: true });
        }
    }, [user, role, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!name.trim()) throw new Error("Please enter your full name.");
            if (selectedRole === 'employee' && !designation) throw new Error("Please select your designation.");
            await completeOnboarding(name, selectedRole, selectedRole === 'employee' ? designation : null);
            toast.success("Profile fully set up!");
            navigate('/dashboard', { replace: true });
        } catch (err) {
            console.error("Signup completion error:", err);
            toast.error(err.message || "Failed to complete signup. Please try again.");
            setLoading(false);
        }
    };

    if (!user) {
        // User signed up with email but hasn't confirmed yet — show verification prompt
        return (
            <div className="flex h-screen w-screen bg-slate-50 dark:bg-slate-950 items-center justify-center p-4">
                <div className="w-full max-w-[480px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-8 relative overflow-hidden text-center">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#ea580c] to-orange-400"></div>

                    <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-6 mt-4">
                        <svg className="w-8 h-8 text-[#ea580c]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>

                    <h2 className="text-[28px] font-bold text-[#0f172a] dark:text-white tracking-tight mb-2">Check Your Email</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">
                        We've sent a verification link to your email address.<br />
                        Please click the link to activate your account, then come back and log in.
                    </p>

                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 mb-6 border border-slate-100 dark:border-slate-700">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            💡 <span className="font-medium">Didn't receive it?</span> Check your spam folder or try signing up again.
                        </p>
                    </div>

                    <a
                        href="/login"
                        className="inline-flex items-center justify-center w-full py-3 px-4 bg-[#ea580c] hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-500/30 text-white rounded-lg text-sm font-bold shadow-sm transition-all"
                    >
                        Go to Login
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-screen bg-slate-50 dark:bg-slate-950 items-center justify-center p-4">
            <div className="w-full max-w-[480px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-8 relative overflow-hidden">
                {/* Decorative header accent */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#ea580c] to-orange-400"></div>

                <div className="mb-8 text-center sm:text-left">
                    <h2 className="text-[28px] font-bold text-[#0f172a] dark:text-white tracking-tight mb-2">Complete Your Profile</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">You're almost there! Help us set up your workspace.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 mb-1.5">Email address</label>
                        <input
                            type="email"
                            value={user?.email || ''}
                            disabled
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed"
                        />
                        <p className="text-[11px] text-slate-400 mt-1 flex justify-end">Linked to your Google account</p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 mb-1.5">Full Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="John Doe"
                            required
                            className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ea580c]/20 focus:border-[#ea580c] transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 mb-1.5">Select your role</label>
                        <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#ea580c]/20 focus:border-[#ea580c] transition-all appearance-none cursor-pointer"
                        >
                            <option value="employee">Employee - I complete tasks assigned to me</option>
                            <option value="manager">Manager - I oversee teams and assign tasks</option>
                        </select>
                        <div className="pointer-events-none absolute right-[40px] top-[260px] flex items-center px-2 text-slate-500">
                            {/* Optional: Add custom dropdown icon if needed, native select arrow will suffice for now */}
                        </div>
                    </div>

                    {selectedRole === 'employee' && (
                        <div>
                            <label className="block text-xs font-bold text-[#334155] dark:text-slate-300 mb-1.5">Designation</label>
                            <select
                                value={designation}
                                onChange={(e) => setDesignation(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#ea580c]/20 focus:border-[#ea580c] transition-all appearance-none cursor-pointer"
                            >
                                <option value="" disabled>Select your designation</option>
                                {DESIGNATIONS.map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 bg-[#ea580c] hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-500/30 text-white rounded-lg text-sm font-bold shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    <span>Setting up Profile...</span>
                                </>
                            ) : (
                                'Complete Signup'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CompleteSignup;
