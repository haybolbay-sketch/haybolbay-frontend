import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowRight, Loader2, Lock } from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  useEffect(() => {
    if (user && profile && (profile.role === 'admin' || profile.role === 'superadmin')) {
      navigate('/admin');
    }
  }, [user, profile, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Check Firestore first for admin account
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const adminQuery = query(collection(db, 'admin'), where('email', '==', email));
      const adminSnap = await getDocs(adminQuery);
      
      let adminData = null;
      let adminId = null;

      if (!adminSnap.empty) {
        adminData = adminSnap.docs[0].data();
        adminId = adminSnap.docs[0].id;
        
        // Simple password check if it exists in the document
        if (adminData.password && adminData.password !== password) {
          setError('Invalid password.');
          setLoading(false);
          return;
        }

        if (adminData.status !== true) {
          setError('Your admin account has been deactivated.');
          setLoading(false);
          return;
        }
      }

      // 2. Attempt Firebase Auth Sign-in
      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } catch (err: any) {
        // If Auth fails but we have a valid Firestore admin, try to create Auth account
        if (adminData && (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential')) {
          try {
            const { createUserWithEmailAndPassword } = await import('firebase/auth');
            userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            // Link the new Auth UID to the Firestore document if they differ
            if (userCredential.user.uid !== adminId) {
              const { setDoc, deleteDoc, doc } = await import('firebase/firestore');
              await setDoc(doc(db, 'admin', userCredential.user.uid), {
                ...adminData,
                authLinked: true
              });
              // Optionally delete the old document if the ID was random
              // await deleteDoc(doc(db, 'admin', adminId));
            }
          } catch (createErr: any) {
            console.error('Auto-creation failed:', createErr);
            if (createErr.code === 'auth/operation-not-allowed') {
              setError('Admin account found, but Email/Password login is not enabled in Firebase. Please contact the system administrator.');
            } else {
              setError('Failed to securely link your admin account.');
            }
            setLoading(false);
            return;
          }
        } else {
          // Fallback for bootstrap users (like the provided hotmail/gmail)
          if ((email === 'jfresnidojr@hotmail.com' || email === 'jfresnidojr@gmail.com') && 
              (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential')) {
             try {
                const { createUserWithEmailAndPassword } = await import('firebase/auth');
                userCredential = await createUserWithEmailAndPassword(auth, email, password);
             } catch (bootstrapErr) {
                throw err;
             }
          } else {
            throw err;
          }
        }
      }
      
      // 3. Final verification of admin document existence
      const { getDoc, doc } = await import('firebase/firestore');
      let finalAdminDoc = await getDoc(doc(db, 'admin', userCredential.user.uid));
      
      if (!finalAdminDoc.exists()) {
        // Bootstrap new admin if specific emails
        if (email === 'jfresnidojr@gmail.com' || email === 'jfresnidojr@hotmail.com') {
          const { setDoc, serverTimestamp } = await import('firebase/firestore');
          await setDoc(doc(db, 'admin', userCredential.user.uid), {
            name: email === 'jfresnidojr@gmail.com' ? 'Super Admin' : 'Jojo Fresnido',
            email: email,
            contactno: '',
            status: true,
            type: email === 'jfresnidojr@gmail.com' ? 'superadmin' : 'admin',
            createdAt: serverTimestamp()
          });
          finalAdminDoc = await getDoc(doc(db, 'admin', userCredential.user.uid));
        } else {
          await auth.signOut();
          setError('Access denied. Admin record not found in system.');
          setLoading(false);
          return;
        }
      }

      if (finalAdminDoc.exists() && finalAdminDoc.data().status !== true) {
        await auth.signOut();
        setError('Your admin account has been deactivated.');
        setLoading(false);
        return;
      }

      navigate('/admin');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection or disable any extensions (like ad-blockers) that might be blocking Firebase.');
      } else {
        setError('Invalid email or password.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center px-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[40px] shadow-2xl p-10"
      >
        <div className="flex flex-col items-center mb-8">
          <img 
            src="/logo.png" 
            alt="Haybolbay" 
            className="h-16 w-auto mb-6" 
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget.nextElementSibling;
              if (fallback) (fallback as HTMLElement).style.display = 'block';
            }}
          />
          <h1 className="text-3xl font-serif italic">Admin Portal</h1>
          <p className="text-neutral-500 text-sm mt-2 italic text-center">
            Sign in to manage the Haybolbay platform
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium mb-6 italic text-center flex items-center justify-center gap-2">
            <Lock className="w-4 h-4" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-widest font-bold text-neutral-400 mb-2 block px-2">Admin Email</label>
            <input 
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-secondary px-6 py-4 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium"
              placeholder="admin@haybolbay.com"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest font-bold text-neutral-400 mb-2 block px-2">Password</label>
            <input 
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-secondary px-6 py-4 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium"
              placeholder="••••••••"
            />
          </div>

          <button 
            disabled={loading}
            className="w-full bg-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-all shadow-xl shadow-primary/20 disabled:opacity-70 disabled:hover:scale-100 mt-4"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (
              <>
                Access Dashboard
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center pt-8 border-t border-neutral-100">
          <Link 
            to="/" 
            className="text-xs uppercase tracking-widest font-bold text-neutral-400 hover:text-primary transition-colors"
          >
            Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
