import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

interface UserProfile {
  uid: string;
  name: string;
  email: string;
  address?: string;
  contactno?: string;
  onboarding: boolean;
  plan?: string;
  role?: 'customer' | 'cleaner' | 'admin' | 'superadmin';
  verified?: boolean;
  createdAt: any;
  status?: boolean | string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;
    let unsubscribeUser: (() => void) | undefined;
    let unsubscribeCleaner: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        const adminDocRef = doc(db, 'admin', firebaseUser.uid);
        const userDocRef = doc(db, 'customers', firebaseUser.uid);
        const cleanerDocRef = doc(db, 'cleaners', firebaseUser.uid);

        unsubscribeProfile = onSnapshot(adminDocRef, async (adminSnap) => {
          if (adminSnap.exists()) {
            const adminData = adminSnap.data();
            const prof: UserProfile = {
              uid: firebaseUser.uid,
              name: adminData.name,
              email: adminData.email,
              contactno: adminData.contactno,
              onboarding: true,
              role: adminData.type,
              verified: true,
              status: adminData.status,
              createdAt: adminData.createdAt
            };
            setProfile(prof);
            localStorage.setItem('haybolbay_last_role', prof.role || 'admin');
            setLoading(false);
          } else {
            unsubscribeUser = onSnapshot(userDocRef, (userSnap) => {
              if (userSnap.exists()) {
                const userData = userSnap.data();
                const prof: UserProfile = { 
                  ...userData as UserProfile, 
                  role: userData.role || 'customer',
                  verified: userData.verified ?? false
                };
                setProfile(prof);
                localStorage.setItem('haybolbay_last_role', prof.role || 'customer');
                setLoading(false);
              } else {
                unsubscribeCleaner = onSnapshot(cleanerDocRef, (cleanerSnap) => {
                  if (cleanerSnap.exists()) {
                    const data = cleanerSnap.data();
                    const prof: UserProfile = {
                      uid: firebaseUser.uid,
                      name: `${data.firstname} ${data.lastname}`,
                      email: data.email,
                      address: data.address,
                      contactno: data.contactno,
                      onboarding: true,
                      role: 'cleaner',
                      verified: data.verified ?? false,
                      status: data.status,
                      createdAt: data.createdAt
                    };
                    setProfile(prof);
                    localStorage.setItem('haybolbay_last_role', 'cleaner');
                  } else {
                    setProfile(null);
                  }
                  setLoading(false);
                }, (error) => {
                  setLoading(false);
                  handleFirestoreError(error, OperationType.GET, `cleaners/${firebaseUser.uid}`);
                });
              }
            }, (error) => {
              setLoading(false);
              handleFirestoreError(error, OperationType.GET, `customers/${firebaseUser.uid}`);
            });
          }
        }, (error) => {
          // Fallback logic for non-admin
          unsubscribeUser = onSnapshot(userDocRef, (userSnap) => {
            if (userSnap.exists()) {
              const userData = userSnap.data();
              const prof: UserProfile = { 
                ...userData as UserProfile, 
                role: userData.role || 'customer',
                verified: userData.verified ?? false
              };
              setProfile(prof);
              localStorage.setItem('haybolbay_last_role', prof.role || 'customer');
              setLoading(false);
            } else {
              unsubscribeCleaner = onSnapshot(cleanerDocRef, (cleanerSnap) => {
                if (cleanerSnap.exists()) {
                  const data = cleanerSnap.data();
                  const prof: UserProfile = {
                    uid: firebaseUser.uid,
                    name: `${data.firstname} ${data.lastname}`,
                    email: data.email,
                    address: data.address,
                    contactno: data.contactno,
                    onboarding: true,
                    role: 'cleaner',
                    verified: data.verified ?? false,
                    status: data.status,
                    createdAt: data.createdAt
                  };
                  setProfile(prof);
                  localStorage.setItem('haybolbay_last_role', 'cleaner');
                } else {
                  setProfile(null);
                }
                setLoading(false);
              }, (err3) => {
                setLoading(false);
                handleFirestoreError(err3, OperationType.GET, `cleaners/${firebaseUser.uid}`);
              });
            }
          }, (err2) => {
            setLoading(false);
            handleFirestoreError(err2, OperationType.GET, `customers/${firebaseUser.uid}`);
          });
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
      if (unsubscribeUser) unsubscribeUser();
      if (unsubscribeCleaner) unsubscribeCleaner();
    };
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
       console.error("Error signing out", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
