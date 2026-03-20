import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { User } from '@supabase/supabase-js';
import { hasSupabaseConfig } from '../lib/env';
import { UserProfile } from '../types';

function buildFallbackProfile(authUser: User, role: UserProfile['role']): UserProfile {
  const metadata = authUser.user_metadata ?? {};
  return {
    uid: authUser.id,
    name: metadata.full_name || metadata.name || '',
    phone: metadata.phone || '',
    email: authUser.email || undefined,
    role,
    savedAddresses: [],
  };
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let supabaseModulePromise: Promise<typeof import('../supabase')> | null = null;
    let unsubscribe = () => {};
    let idleHandle:
      | { type: 'idle'; id: number }
      | { type: 'timeout'; id: ReturnType<typeof setTimeout> }
      | null = null;

    if (!hasSupabaseConfig) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return () => {
        isMounted = false;
      };
    }

    const loadSupabaseModule = () => {
      if (!supabaseModulePromise) {
        supabaseModulePromise = import('../supabase');
      }
      return supabaseModulePromise;
    };

    const syncAuthState = async (authUser: User | null) => {
      setLoading(true);
      try {
        if (!isMounted) return;
        setUser(authUser);
        if (authUser) {
          const { mapUserProfileRow, mapUserProfileToRow, supabase } = await loadSupabaseModule();
          const fallbackProfile = buildFallbackProfile(authUser, 'customer');
          const { data: existingProfileRow, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .maybeSingle();

          if (profileError) {
            throw profileError;
          }

          if (existingProfileRow) {
            const existingProfile = mapUserProfileRow(existingProfileRow);
            const mergedProfile: UserProfile = {
              ...fallbackProfile,
              ...existingProfile,
              role: existingProfile.role,
            };

            if (isMounted) {
              setProfile(mergedProfile);
            }
          } else {
            const newProfile: UserProfile = fallbackProfile;
            const { error: insertError } = await supabase
              .from('users')
              .upsert(mapUserProfileToRow(newProfile), { onConflict: 'id' });

            if (insertError) {
              throw insertError;
            }

            if (isMounted) {
              setProfile(newProfile);
            }
          }
        } else if (isMounted) {
          setProfile(null);
        }
      } catch (error) {
        console.error('Failed to initialize auth state', error);
        if (!isMounted) return;
        if (authUser) {
          setProfile(buildFallbackProfile(authUser, 'customer'));
        } else {
          setProfile(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    const initializeAuth = async () => {
      try {
        const { auth } = await loadSupabaseModule();
        const { data, error } = await auth.getSession();

        if (error) {
          console.error('Failed to load auth session', error);
          if (isMounted) {
            setLoading(false);
          }
          return;
        }

        await syncAuthState(data.session?.user ?? null);

        const { data: subscription } = auth.onAuthStateChange((_event, session) => {
          void syncAuthState(session?.user ?? null);
        });
        unsubscribe = () => subscription.subscription.unsubscribe();
      } catch (error) {
        console.error('Failed to initialize auth module', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleHandle = {
        type: 'idle',
        id: window.requestIdleCallback(() => {
          void initializeAuth();
        }, { timeout: 1500 }),
      };
    } else if (typeof window !== 'undefined') {
      idleHandle = {
        type: 'timeout',
        id: setTimeout(() => {
          void initializeAuth();
        }, 800),
      };
    } else {
      void initializeAuth();
    }

    return () => {
      isMounted = false;
      if (idleHandle?.type === 'timeout') {
        clearTimeout(idleHandle.id);
      } else if (idleHandle?.type === 'idle' && typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleHandle.id);
      }
      unsubscribe();
    };
  }, []);

  const isAdmin = profile?.role === 'admin';
  const value = useMemo(() => ({ user, profile, loading, isAdmin }), [user, profile, loading, isAdmin]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
