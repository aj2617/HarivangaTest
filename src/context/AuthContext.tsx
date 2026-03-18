import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UserProfile } from '../types';

const ADMIN_EMAIL = 'ashadujjaman2617@gmail.com';

function buildFallbackProfile(firebaseUser: User, role: UserProfile['role']): UserProfile {
  return {
    uid: firebaseUser.uid,
    name: firebaseUser.displayName || '',
    phone: firebaseUser.phoneNumber || '',
    email: firebaseUser.email || undefined,
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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      try {
        setUser(firebaseUser);
        if (firebaseUser) {
          const docRef = doc(db, 'users', firebaseUser.uid);
          const isAdminEmail = firebaseUser.email === ADMIN_EMAIL;
          const fallbackProfile = buildFallbackProfile(firebaseUser, isAdminEmail ? 'admin' : 'customer');
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const existingProfile = docSnap.data() as UserProfile;

            if (isAdminEmail && existingProfile.role !== 'admin') {
              const adminProfile: UserProfile = { ...existingProfile, role: 'admin' };
              await setDoc(docRef, adminProfile, { merge: true });
              setProfile(adminProfile);
            } else {
              setProfile({ ...fallbackProfile, ...existingProfile });
            }
          } else {
            // Create default profile for new users.
            const newProfile: UserProfile = fallbackProfile;
            await setDoc(docRef, newProfile);
            setProfile(newProfile);
          }
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error('Failed to initialize auth state', error);
        if (firebaseUser) {
          const isAdminEmail = firebaseUser.email === ADMIN_EMAIL;
          setProfile(buildFallbackProfile(firebaseUser, isAdminEmail ? 'admin' : 'customer'));
        } else {
          setProfile(null);
        }
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const isAdmin = profile?.role === 'admin' || user?.email === ADMIN_EMAIL;

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
