import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../features/auth/AuthContext';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { Camera, Mail, Shield, Check, Loader2, Briefcase } from 'lucide-react';

const Profile = () => {
    const { user, role } = useAuth();

    const [name, setName] = useState('');
    const [designation, setDesignation] = useState('');
    const [originalDesignation, setOriginalDesignation] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isSavingDesignation, setIsSavingDesignation] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

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

    // Initialize state when user loads
    useEffect(() => {
        if (user) {
            // Try user_metadata first, then fetch from DB as fallback
            const metaName = user.user_metadata?.name || '';
            setName(metaName);

            const fetchUserData = async () => {
                const { data } = await supabase
                    .from('users')
                    .select('name, designation')
                    .eq('id', user.id)
                    .single();
                if (data) {
                    // If metadata name is empty but DB has a name, use DB name
                    if (!metaName && data.name) {
                        setName(data.name);
                        // Also sync it to user_metadata so Topbar picks it up
                        await supabase.auth.updateUser({
                            data: { name: data.name, full_name: data.name }
                        });
                    }
                    if (data.designation) {
                        setDesignation(data.designation);
                        setOriginalDesignation(data.designation);
                    }
                }
            };
            fetchUserData();
        }
    }, [user]);

    const hasNameChanged = name.trim() !== (user?.user_metadata?.name || '');
    const isNameValid = name.trim().length >= 2 && name.trim().length <= 50;

    const handleSaveName = async () => {
        if (!hasNameChanged || !isNameValid) return;

        setIsSaving(true);
        try {
            // Update auth metadata
            const { error: authError } = await supabase.auth.updateUser({
                data: { name: name.trim() }
            });
            if (authError) throw authError;

            // Use the secure RPC function to update the public users table safely
            const { error: dbError } = await supabase
                .rpc('update_user_profile', {
                    new_name: name.trim(),
                    new_avatar_url: user?.user_metadata?.profile_image || null // Pass existing avatar so it isn't erased
                });

            if (dbError) throw dbError;

            toast.success('Profile updated successfully');
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error(error.message || 'Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    const handleImageUpload = async (event) => {
        try {
            setIsUploading(true);
            const file = event.target.files?.[0];

            if (!file) return;

            if (!file.type.startsWith('image/')) {
                toast.error('Please upload an image file');
                return;
            }

            if (file.size > 2 * 1024 * 1024) {
                toast.error('Image must be less than 2MB');
                return;
            }

            const fileExt = file.name.split('.').pop();
            const filePath = `${user.id}/avatar.${fileExt}`; // We use extension so preview registers changes

            // Upload image to storage
            const { error: uploadError } = await supabase.storage
                .from('profile-images')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('profile-images')
                .getPublicUrl(filePath);

            // Add cache buster query string so avatar updates immediately visually
            const publicUrlWithCacheBuster = `${publicUrl}?t=${new Date().getTime()}`;

            // Update user metadata
            const { error: updateAuthError } = await supabase.auth.updateUser({
                data: { profile_image: publicUrlWithCacheBuster }
            });

            if (updateAuthError) throw updateAuthError;

            // Use the secure RPC function to update the public users table safely
            const { error: dbError } = await supabase
                .rpc('update_user_profile', {
                    new_name: user?.user_metadata?.name || null, // Preserve name
                    new_avatar_url: publicUrlWithCacheBuster
                });

            if (dbError) throw dbError;

            toast.success('Avatar updated successfully');
        } catch (error) {
            console.error('Upload error:', error);
            toast.error(error.message || 'Error uploading image');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <div className="flex flex-col h-full max-w-4xl mx-auto py-8 px-4 sm:px-8 w-full animate-fade-in">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-[28px] font-bold text-[#0f172a] dark:text-white tracking-tight">Your Profile</h1>
                <p className="text-[15px] text-slate-500 dark:text-slate-400 mt-0.5">Manage your personal information and preferences.</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-10 shadow-sm">
                <div className="flex flex-col md:flex-row gap-10 items-start">
                    {/* Avatar Upload Column */}
                    <div className="shrink-0 flex flex-col items-center gap-4 w-full md:w-auto">
                        <div className="relative group rounded-full">
                            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center text-4xl font-bold text-blue-600 dark:text-blue-400 border-4 border-white dark:border-slate-900 shadow-md overflow-hidden relative">
                                {user?.user_metadata?.profile_image ? (
                                    <img src={user.user_metadata.profile_image} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span>{user?.email?.charAt(0).toUpperCase() || '?'}</span>
                                )}

                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-100 cursor-pointer"
                                >
                                    {isUploading ? (
                                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                                    ) : (
                                        <>
                                            <Camera className="w-8 h-8 text-white mb-1" />
                                            <span className="text-white text-xs font-semibold">Change</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                accept="image/*"
                                className="hidden"
                            />
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium text-center max-w-[140px]">
                            JPG, GIF or PNG. 2MB max.
                        </p>
                    </div>

                    {/* Details Column */}
                    <div className="w-full flex-1 flex flex-col gap-6">

                        {/* Name Field */}
                        <div>
                            <label className="block text-[13px] font-bold text-slate-800 dark:text-slate-200 mb-2">
                                Full Name
                            </label>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter your name"
                                    className="flex-1 px-4 py-2.5 bg-[#f8fafc] dark:bg-slate-800 border-slate-200 dark:border-slate-700 border rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                                />
                                <button
                                    onClick={handleSaveName}
                                    disabled={!hasNameChanged || !isNameValid || isSaving}
                                    className="shrink-0 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                    Save
                                </button>
                            </div>
                            {name.trim().length > 0 && !isNameValid && (
                                <p className="text-red-500 text-xs mt-1.5 font-medium">Name must be between 2 and 50 characters.</p>
                            )}
                        </div>

                        <hr className="border-slate-100 dark:border-slate-800" />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {/* Email Readonly */}
                            <div>
                                <label className="block text-[13px] font-bold text-slate-800 dark:text-slate-200 mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Mail className="h-4 w-4 text-slate-400" />
                                    </div>
                                    <input
                                        type="email"
                                        readOnly
                                        disabled
                                        value={user?.email || ''}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 border rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 cursor-not-allowed shadow-sm"
                                    />
                                </div>
                            </div>

                            {/* Role Readonly */}
                            <div>
                                <label className="block text-[13px] font-bold text-slate-800 dark:text-slate-200 mb-2">
                                    Account Role
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Shield className="h-4 w-4 text-slate-400" />
                                    </div>
                                    <input
                                        type="text"
                                        readOnly
                                        disabled
                                        value={role === 'manager' ? 'Manager' : 'Employee'}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 border rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 cursor-not-allowed shadow-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Designation Field - Employees Only */}
                        {role === 'employee' && (
                            <>
                                <hr className="border-slate-100 dark:border-slate-800" />
                                <div>
                                    <label className="block text-[13px] font-bold text-slate-800 dark:text-slate-200 mb-2">
                                        Designation
                                    </label>
                                    <div className="flex gap-3">
                                        <div className="relative flex-1">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                                <Briefcase className="h-4 w-4 text-slate-400" />
                                            </div>
                                            <select
                                                value={designation}
                                                onChange={(e) => setDesignation(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2.5 bg-[#f8fafc] dark:bg-slate-800 border-slate-200 dark:border-slate-700 border rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm appearance-none cursor-pointer"
                                            >
                                                <option value="" disabled>Select designation</option>
                                                {DESIGNATIONS.map(d => (
                                                    <option key={d} value={d}>{d}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                if (!designation || designation === originalDesignation) return;
                                                setIsSavingDesignation(true);
                                                try {
                                                    const { error } = await supabase.rpc('update_user_profile', {
                                                        new_name: user?.user_metadata?.name || null,
                                                        new_avatar_url: user?.user_metadata?.profile_image || null,
                                                        new_designation: designation
                                                    });
                                                    if (error) throw error;
                                                    setOriginalDesignation(designation);
                                                    toast.success('Designation updated successfully');
                                                } catch (error) {
                                                    console.error('Error updating designation:', error);
                                                    toast.error(error.message || 'Failed to update designation');
                                                } finally {
                                                    setIsSavingDesignation(false);
                                                }
                                            }}
                                            disabled={!designation || designation === originalDesignation || isSavingDesignation}
                                            className="shrink-0 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {isSavingDesignation ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                            Save
                                        </button>
                                    </div>
                                    {!designation && (
                                        <p className="text-amber-500 text-xs mt-1.5 font-medium">No designation selected. Please choose your designation.</p>
                                    )}
                                </div>
                            </>
                        )}

                        {/* Auth Provider */}
                        <div className="mt-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div>
                                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Authentication</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Your account is secured via Single Sign-On.</p>
                            </div>
                            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                                <svg className="w-4 h-4" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Google</span>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
