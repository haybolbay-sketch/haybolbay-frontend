import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  Loader2, 
  Sparkles,
  Shield,
  Star,
  CheckCircle2
} from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification
} from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';

export default function CleanerLogin() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const cleanerDoc = await getDoc(doc(db, 'cleaners', userCredential.user.uid));
        
        if (!cleanerDoc.exists()) {
          await auth.signOut();
          setError("Account not found in cleaning crew records.");
          return;
        }

        const data = cleanerDoc.data();
        if (data.status === false) { // Hard rejection if status is explicitly false (inactive)
          await auth.signOut();
          setError("Your account is currently inactive. Please contact support.");
          return;
        }

        navigate('/dashboard');
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Cleaners onboarding is handled in the JoinCrew page or a separate setup
        await sendEmailVerification(userCredential.user);
        navigate('/join-crew');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

    const handleJoinOurTeam = () => {
    window.location.href = '/join-crew';
  };

  return (
    <div className="min-h-screen bg-secondary flex">
      {/* Left Side: Branding/Info */}
      <div className="hidden lg:flex flex-1 bg-primary relative overflow-hidden flex-col justify-between p-16">
        <div className="absolute top-0 right-0 opacity-10">
          <Shield className="w-[600px] h-[600px] text-white transform translate-x-1/4 -translate-y-1/4" />
        </div>
        
        <Link to="/" className="relative z-10 flex items-center gap-2">
          <img 
            src="/logo.png" 
            alt="Haybolbay" 
            className="h-16 w-auto brightness-0 invert" 
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget.nextElementSibling;
              if (fallback) (fallback as HTMLElement).style.display = 'block';
            }}
          />
          <span className="hidden text-2xl font-serif font-bold text-white italic">Haybolbay</span>
        </Link>

        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 text-accent text-[10px] font-black uppercase tracking-[0.2em] mb-8 rounded-full">
            <Star className="w-3 h-3 fill-accent" />
            <span>Professional Network</span>
          </div>
          <h1 className="text-6xl font-serif font-black italic text-white leading-tight mb-8">
            The Hub for <br />
            <span className="text-accent underline decoration-4 underline-offset-8">Cleaning Pros</span>
          </h1>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center shrink-0 mt-1">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              <p className="text-white/60 italic font-medium leading-relaxed">Access your dashboard to manage bookings, track earnings, and update your availability.</p>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-white/40 text-sm font-medium italic">© 2026 Haybolbay Cleaning Crew. Professional Standards.</p>
        </div>
      </div>

      {/* Right Side: Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <div className="mb-12">
            <h2 className="text-4xl font-serif font-black italic text-primary mb-2">
              {isLogin ? 'Welcome Back!' : 'Join the Crew'}
            </h2>
            <p className="text-primary/60 font-medium italic">
              {isLogin ? 'Access your professional cleaner portal.' : 'Start your journey as a Haybolbay professional.'}
            </p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-4 bg-red-50 border border-red-100 text-red-500 rounded-2xl text-sm font-bold italic flex items-center gap-3"
            >
              <Shield className="w-4 h-4" />
              {error}
            </motion.div>
          )}

          {resetSent && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-4 bg-accent/10 border border-accent/20 text-accent rounded-2xl text-sm font-bold italic flex items-center gap-3"
            >
              <CheckCircle2 className="w-4 h-4" />
              Password reset link sent to your email!
            </motion.div>
          )}

          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 ml-4">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/30" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-white pl-14 pr-6 py-4 rounded-2xl border border-primary/5 focus:ring-2 focus:ring-primary/10 transition-all font-medium text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-primary/40">Password</label>
                {isLogin && (
                  <button 
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[10px] font-black uppercase tracking-widest text-accent hover:underline"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/30" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white pl-14 pr-6 py-4 rounded-2xl border border-primary/5 focus:ring-2 focus:ring-primary/10 transition-all font-medium text-sm"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-primary text-white rounded-2xl font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  {isLogin ? 'Sign In to Portal' : 'Register as Crew'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

            <p className="text-center mt-8 text-sm font-medium italic text-primary/60">
              {isLogin ? "Don't have a crew account? " : "Already have a crew account? "}
              {isLogin ? (
                <button 
                  onClick={handleJoinOurTeam}
                  className="text-primary font-black hover:underline"
                >
                  Join Our Team
                </button>
              ):(
                <button 
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-primary font-black hover:underline"
                >
                  Sign In Now
                </button>
              )}
            </p>
            
            <p className="text-center mt-4 text-[10px] font-black uppercase tracking-widest text-primary/20">
              <Link to="/join-crew" className="text-accent hover:underline">Home</Link>
            </p>
        </motion.div>
      </div>
    </div>
  );
}
