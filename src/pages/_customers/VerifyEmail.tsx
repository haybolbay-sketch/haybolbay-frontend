import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, ArrowRight, RefreshCw, Loader2 } from 'lucide-react';
import { auth } from '../../lib/firebase';
import { sendEmailVerification } from 'firebase/auth';
import { useState, useEffect, useCallback } from 'react';

export default function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || 'your email';
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
    <div className="min-h-screen bg-secondary flex items-center justify-center px-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-[40px] shadow-2xl p-12 text-center"
      >
        <div className="flex flex-col items-center">
          <div className="bg-primary/10 p-6 rounded-full mb-8">
            <Mail className="w-12 h-12 text-primary" />
          </div>
          
          <h1 className="text-3xl font-serif italic mb-6">Verify your email</h1>
          
          <p className="text-neutral-600 leading-relaxed mb-8 italic">
            At <span className="text-primary font-bold not-italic">{email}</span>. Please verify it and log in.
          </p>

          <div className="space-y-4 w-full">
            <button 
              onClick={() => navigate('/login')}
              className="w-full bg-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-all shadow-xl shadow-primary/20"
            >
              Go to Login
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={handleResend}
              disabled={loading || sent}
              className="w-full py-2 text-neutral-400 hover:text-primary transition-colors flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {sent ? 'Sent!' : 'Resend link'}
            </button>

            {error && <p className="text-red-500 text-[10px] font-bold italic">{error}</p>}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
