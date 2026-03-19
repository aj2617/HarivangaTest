import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { User } from '@supabase/supabase-js';
import { auth, mapUserProfileRow, mapUserProfileToRow, supabase } from '../supabase';
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

    if (!hasSupabaseConfig) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return () => {
        isMounted = false;
      };
    }

    const syncAuthState = async (authUser: User | null) => {
      setLoading(true);
      try {
        if (!isMounted) return;
        setUser(authUser);
        if (authUser) {
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

    void auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error('Failed to load auth session', error);
        if (isMounted) {
          setLoading(false);
        }
        return;
      }

      void syncAuthState(data.session?.user ?? null);
    });

    const { data: subscription } = auth.onAuthStateChange((_event, session) => {
      void syncAuthState(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription.subscription.unsubscribe();
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
