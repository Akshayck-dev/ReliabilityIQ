import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { FullPageSpinner } from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

const AuthContext = createContext({});

// Removed MANAGER_EMAILS hardcoding; users explicitely choose roles during CompleteSignup.

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const initSession = async () => {
            try {
                const { data, error } = await supabase.auth.getSession();
                if (error) throw error;

                const currentSession = data?.session;
                if (mounted) setUser(currentSession?.user ?? null);

                if (currentSession?.user) {
                    await fetchUserRole(currentSession.user);
                }
            } catch (err) {
                console.error("Auth init error:", err);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        // Bootstrap on mount
        initSession();

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mounted) return;

            // Handle session expiry / token refresh failure
            if (event === 'TOKEN_REFRESHED' && !session) {
                setUser(null);
                setRole(null);
                setLoading(false);
                toast.error('Session expired. Please login again.');
                window.location.href = '/login';
                return;
            }

            if (event === 'SIGNED_OUT') {
                setUser(null);
                setRole(null);
                if (mounted) setLoading(false);
                return;
            }

            setUser(session?.user ?? null);

            if (session?.user) {
                try {
                    await fetchUserRole(session.user);
                } catch (e) {
                    console.error("Error fetching role on Auth Change event:", e);
                } finally {
                    if (mounted) setLoading(false);
                }
            } else {
                setRole(null);
                if (mounted) setLoading(false);
            }
        });

        return () => {
            mounted = false;
            subscription?.unsubscribe();
        };
    }, []);

    const fetchUserRole = async (currentUser) => {
        try {
            console.log("DEBUG: fetchUserRole called for", currentUser.email);

            const fetchPromise = async () => {
                // Try to fetch from 'users' table 
                const { data, error } = await supabase
                    .from('users')
                    .select('role')
                    .eq('id', currentUser.id)
                    .single();

                if (error) {
                    // PGRST116 means zero rows returned (user not in DB yet)
                    if (error.code === 'PGRST116') {
                        console.log("DEBUG: User not in DB, returning 'pending_signup'.");
                        return 'pending_signup';
                    }
                    // For network errors or other issues, throw so we don't overwrite DB
                    throw error;
                }

                if (data?.role) {
                    return data.role;
                } else {
                    return 'pending_signup';
                }
            };

            // Implement an 8 second timeout for the DB operations to avoid strict demotions
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Role fetch DB timeout')), 8000);
            });

            const resolvedRole = await Promise.race([fetchPromise(), timeoutPromise]);
            setRole(resolvedRole);
            console.log("DEBUG: Role successfully resolved to", resolvedRole);

        } catch (err) {
            console.error("Error fetching user role or timed out:", err);
            // GUARANTEE FALLBACK: Keep existing role if we already have one to avoid UI flicker
            setRole(prevRole => {
                if (prevRole) {
                    console.log("DEBUG: Retaining existing role on error:", prevRole);
                    return prevRole;
                }
                console.log("DEBUG: Cannot determine role, treating as pending_signup due to error.");
                return 'pending_signup';
            });
        } finally {
            setLoading(false);
        }
    };

    // Called after the user fills out the Complete Signup form
    const completeOnboarding = async (name, selectedRole, designation = null) => {
        if (!user) throw new Error("No authenticated user session.");

        const insertData = {
            id: user.id,
            email: user.email,
            name: name,
            role: selectedRole
        };

        if (selectedRole === 'employee' && designation) {
            insertData.designation = designation;
        }

        const { error } = await supabase.from('users').insert([insertData]);

        if (error) throw error;

        // Also save name to auth user_metadata so Topbar and Profile can read it
        await supabase.auth.updateUser({
            data: { name: name, full_name: name }
        });

        // Update local state to immediately unlock ProtectedRoutes
        setRole(selectedRole);
    };

    // Removed signUp as we use Google Auth
    const signIn = async (email, password) => {
        return await supabase.auth.signInWithPassword({ email, password });
    };

    const signUp = async (email, password, metadata = {}) => {
        return await supabase.auth.signUp({
            email,
            password,
            options: { data: metadata }
        });
    };

    const signInWithGoogle = async () => {
        // No longer storing pending roles. Role will be enforced strictly by fetchUserRole
        return await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/dashboard'
            }
        });
    };

    const signOut = async () => {
        return await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ user, role, signIn, signUp, signInWithGoogle, signOut, completeOnboarding, loading }}>
            {loading ? <FullPageSpinner message="Authenticating..." /> : children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    return useContext(AuthContext);
};
