import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
  signOut,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp, query, collection, where, getDocs } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, Loader2, Phone, Mail } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifier, setVerifier] = useState<RecaptchaVerifier | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (authMethod === 'phone' && !verifier) {
      try {
        const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          'size': 'invisible',
          'callback': () => {
            console.log('reCAPTCHA solved');
          },
          'expired-callback': () => {
             console.log('reCAPTCHA expired');
          }
        });
        setVerifier(recaptchaVerifier);
      } catch (err) {
        console.error('Error initializing reCAPTCHA:', err);
      }
    }

    return () => {
      if (verifier) {
        verifier.clear();
        setVerifier(null);
      }
    };
  }, [authMethod]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // Check if account is active in database
        const userDoc = await getDoc(doc(db, 'customers', userCredential.user.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Check if account is active
          if (userData.status === false) {
            await signOut(auth);
            setError('Your account is currently inactive. Please contact support.');
            return;
          }

          // If onboarding is not complete, skip verification and go to profile
          if (!userData.onboarding) {
            navigate('/customer/profile');
            return;
          }

          // Check if email is verified for existing onboarded accounts
          if (!userCredential.user.emailVerified) {
            const userEmail = userCredential.user.email;
            await signOut(auth);
            navigate('/verify-email', { state: { email: userEmail } });
            return;
          }
        } else {
          // Profile not found - allow to proceed to onboarding without email verification check
          navigate('/customer/profile');
          return;
        }

        navigate('/dashboard');
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'customers', userCredential.user.uid), {
          email,
          name: email.split('@')[0],
          role: 'customer',
          onboarding: false,
          status: true, // New customers are active by default
          verified: false, // Must be verified by admin
          createdAt: serverTimestamp()
        });
        
        // Send email verification
        await sendEmailVerification(userCredential.user);
        
        navigate('/customer/profile');
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/network-request-failed') {
        setError('Network connection failed. Please check your internet or disable ad-blockers/VPNs.');
        setLoading(false);
        return;
      }
      if (isLogin) {
        setError('Email or password is incorrect');
      } else {
        if (err.code === 'auth/email-already-in-use') {
          setError('User already exists. Please sign in');
        } else {
          setError(err.message || 'An error occurred during authentication');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!showOTP) {
        if (!verifier) {
          setError('reCAPTCHA failed to initialize. Please refresh.');
          setLoading(false);
          return;
        }
        
        // Format phone number if needed (e.g. ensure it starts with +)
        const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
        
        const confirmation = await signInWithPhoneNumber(auth, formattedPhone, verifier);
        setConfirmationResult(confirmation);
        setShowOTP(true);
      } else {
        if (!confirmationResult) {
          setError('Session expired. Please try again.');
          setShowOTP(false);
          return;
        }

        const result = await confirmationResult.confirm(otp);
        const user = result.user;

        // Same logic as email login/signup
        const userDoc = await getDoc(doc(db, 'customers', user.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.status === false) {
            await signOut(auth);
            setError('Your account is currently inactive. Please contact support.');
            return;
          }

          navigate('/customer/profile');
          return;
        } else {
          // New user signup via phone
          await setDoc(doc(db, 'customers', user.uid), {
            contactno: user.phoneNumber,
            name: user.phoneNumber || 'User',
            role: 'customer',
            onboarding: false,
            status: true,
            verified: false,
            createdAt: serverTimestamp()
          });
          navigate('/customer/profile');
          return;
        }
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-phone-number') {
        setError('Invalid phone number format. Please include country code (e.g., +15550000000)');
      } else if (err.code === 'auth/code-expired') {
        setError('Verification code expired. Please try again.');
      } else if (err.code === 'auth/invalid-verification-code') {
        setError('Invalid verification code. Please check and try again.');
      } else {
        setError(err.message || 'An error occurred during phone authentication');
      }
      if (err.code !== 'auth/invalid-verification-code' && err.code !== 'auth/code-expired') {
         setShowOTP(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const userCredential = await signInWithPopup(auth, provider);
      const userDoc = await getDoc(doc(db, 'customers', userCredential.user.uid));
      
      let profileFound = true;
      if (!userDoc.exists()) {
        profileFound = false;
        await setDoc(doc(db, 'customers', userCredential.user.uid), {
          email: userCredential.user.email,
          name: userCredential.user.displayName || 'User',
          role: 'customer',
          onboarding: false,
          status: true,
          verified: false,
          createdAt: serverTimestamp()
        });
      } else {
        const userData = userDoc.data();
        if (userData.status === false) {
          await signOut(auth);
          setError('Your account is currently inactive. Please contact support.');
          return;
        }
        // If profile exists but onboarding not complete, go to profile
        if (!userData.onboarding) {
          navigate('/customer/profile');
          return;
        }
      }

      // Check for email verification only for existing profiles
      if (profileFound && !userCredential.user.emailVerified) {
        const userEmail = userCredential.user.email;
        await signOut(auth);
        navigate('/verify-email', { state: { email: userEmail } });
        return;
      }

      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/network-request-failed') {
        setError('Google sign-in failed due to a network connection issue.');
      } else {
        setError(err.message || 'Error signing in with Google');
      }
    } finally {
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
          <h1 className="hidden text-3xl font-serif italic mb-6">Haybolbay</h1>
          <h1 className="text-3xl font-serif italic">
            {isLogin ? 'Welcome back' : 'Create Account'}
          </h1>
          <p className="text-neutral-500 text-sm mt-2 italic">
            {isLogin ? 'Sign in to manage your bookings' : 'Start your journey with Haybolbay'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium mb-6 italic text-center">
            {error}
          </div>
        )}

        <div className="flex gap-2 mb-8 bg-neutral-50 p-1.5 rounded-2xl">
          <button
            onClick={() => { setAuthMethod('email'); setError(''); setShowOTP(false); }}
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
              authMethod === 'email' ? 'bg-white text-primary shadow-sm' : 'text-neutral-400 hover:text-primary'
            }`}
          >
            <Mail className="w-4 h-4" />
            Email
          </button>
          <button
            onClick={() => { setAuthMethod('phone'); setError(''); setShowOTP(false); }}
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
              authMethod === 'phone' ? 'bg-white text-primary shadow-sm' : 'text-neutral-400 hover:text-primary'
            }`}
          >
            <Phone className="w-4 h-4" />
            Phone
          </button>
        </div>

        <div id="recaptcha-container"></div>

        <AnimatePresence mode="wait">
          {authMethod === 'email' ? (
            <motion.form 
              key="email-form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleSubmit} 
              className="space-y-4"
            >
              <div>
                <label className="text-xs uppercase tracking-widest font-bold text-neutral-400 mb-2 block px-2">Email Address</label>
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-secondary px-6 py-4 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium"
                  placeholder="hello@example.com"
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
                className="w-full bg-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-all shadow-xl shadow-primary/20 disabled:opacity-70 disabled:hover:scale-100"
              >
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (
                  <>
                    {isLogin ? 'Sign In' : 'Create Account'}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </motion.form>
          ) : (
            <motion.form 
              key="phone-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handlePhoneSubmit} 
              className="space-y-4"
            >
              {!showOTP ? (
                <div>
                  <label className="text-xs uppercase tracking-widest font-bold text-neutral-400 mb-2 block px-2">Phone Number</label>
                  <input 
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-secondary px-6 py-4 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium"
                    placeholder="+1 555 000 0000"
                  />
                  <p className="text-[10px] text-neutral-400 italic mt-2 px-2">Include country code (e.g., +1 for US, +63 for PH)</p>
                </div>
              ) : (
                <div>
                  <label className="text-xs uppercase tracking-widest font-bold text-neutral-400 mb-2 block px-2">Verification Code</label>
                  <input 
                    type="text"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full bg-secondary px-6 py-4 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium tracking-[0.5em] text-center"
                    placeholder="000000"
                    maxLength={6}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowOTP(false)}
                    className="text-[10px] text-primary font-bold uppercase tracking-widest mt-2 px-2 hover:underline"
                  >
                    Change Phone Number
                  </button>
                </div>
              )}

              <button 
                disabled={loading}
                className="w-full bg-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-all shadow-xl shadow-primary/20 disabled:opacity-70 disabled:hover:scale-100"
              >
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (
                  <>
                    {!showOTP ? 'Send Code' : 'Verify & Continue'}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-100"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
            <span className="bg-white px-4 text-neutral-400">Or continue with</span>
          </div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-white border border-neutral-100 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-neutral-50 transition-all mb-4"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Google
        </button>

        <div className="mt-4 text-center space-y-4">
          <button 
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm font-medium text-neutral-400 hover:text-primary transition-colors italic block w-full"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
          
          <Link 
            to="/" 
            className="text-xs uppercase tracking-widest font-bold text-neutral-400 hover:text-primary transition-colors inline-block"
          >
            Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
