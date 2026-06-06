import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, ArrowRight, Shield, Sparkles, RefreshCw, Loader2 } from 'lucide-react';
import { auth } from '../../lib/firebase';
import { sendEmailVerification } from 'firebase/auth';
import { useState, useEffect, useCallback } from 'react';

export default function CleanerVerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || 'your professional email';
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleResend = useCallback(async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    setError('');
    try {
      await sendEmailVerification(auth.currentUser);
      setSent(true);
      setTimeout(() => setSent(false), 5000);
    } catch (err: any) {
      // If already sent recently, don't show as error if it's the auto-call
      if (err.code !== 'auth/too-many-requests') {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    handleResend();
  }, [handleResend]);

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center px-6 overflow-hidden relative">
      {/* Decorative background */}
      <div className="absolute top-0 right-0 opacity-10">
        <Shield className="w-[600px] h-[600px] text-white transform translate-x-1/4 -translate-y-1/4" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-[40px] shadow-2xl p-12 text-center relative z-10"
      >
        <div className="flex flex-col items-center">
          <div className="bg-primary/5 p-6 rounded-[32px] mb-8 relative">
            <Mail className="w-12 h-12 text-primary" />
            <div className="absolute -top-2 -right-2 bg-accent p-2 rounded-lg">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </div>
          
          <h1 className="text-3xl font-serif font-black italic text-primary mb-6">Staff Email <span className="text-accent underline decoration-2 underline-offset-4">Security</span></h1>
          
          <p className="text-primary/60 italic font-medium leading-relaxed mb-10">
            Professional excellence starts with security. Please verify your identity at <span className="text-primary font-black not-italic">{email}</span> to continue your onboarding.
          </p>

          <div className="space-y-4 w-full">
            <button 
              onClick={() => {
                navigate('/join-crew');
                auth.signOut();
              }}
              className="w-full bg-primary text-white py-5 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] transition-all shadow-xl shadow-primary/20"
            >
              Return to Login
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={handleResend}
              disabled={loading || sent}
              className="w-full py-4 text-primary/40 hover:text-primary transition-colors flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {sent ? 'Email Sent!' : 'Resend Verification Link'}
            </button>

            {error && <p className="text-red-500 text-[10px] font-bold italic">{error}</p>}
            
            <p className="text-[10px] font-black uppercase tracking-widest text-primary/20">
              Check your inbox or spam folder for the link.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
