import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Shield, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft,
  Mail,
  UserCheck,
  FileSearch
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';

export default function CustomerVerify() {
  const { user, profile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const userId = location.state?.userId || user?.uid;
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.verified === true) {
      navigate('/dashboard');
    }
  }, [profile, navigate]);

  useEffect(() => {
    async function fetchStatus() {
      if (!userId) {
        setLoading(false);
        return;
      }
      try {
        const docRef = doc(db, 'customers', userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setStatus(docSnap.data());
        }
      } catch (error) {
        console.error('Error fetching status:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchStatus();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
          <Clock className="w-8 h-8 text-primary opacity-20" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full bg-white rounded-[40px] shadow-2xl overflow-hidden"
      >
        <div className="bg-primary p-12 text-white relative">
          <div className="absolute top-0 right-0 opacity-10">
            <Shield className="w-64 h-64 transform translate-x-1/4 -translate-y-1/4" />
          </div>
          
          <button 
            onClick={async () => {
              await logout();
              navigate('/login');
            }} 
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8 text-sm font-bold uppercase tracking-widest cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </button>
          
          <h1 className="text-4xl font-serif font-black italic mb-4">Account <span className="text-accent underline decoration-2 underline-offset-4">Verification</span></h1>
          <p className="text-white/60 italic">Waiting for Admin Approval</p>
        </div>

        <div className="p-12">
          {!status ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-primary mb-2">No Profile Found</h3>
              <p className="text-primary/60 italic mb-8">We couldn't find a customer profile associated with this account.</p>
              <button 
                onClick={async () => {
                  await logout();
                  navigate('/login');
                }} 
                className="px-8 py-3 bg-primary text-white rounded-xl font-bold inline-block cursor-pointer"
              >
                Return to Login
              </button>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Status Indicator */}
              <div className="flex items-center gap-6">
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center ${
                  status.verified === true ? 'bg-accent/10' : 'bg-amber-50'
                }`}>
                  {status.verified === true ? (
                    <CheckCircle2 className="w-10 h-10 text-accent" />
                  ) : (
                    <Clock className="w-10 h-10 text-amber-500" />
                  )}
                </div>
                <div>
                  <h3 className="text-2xl font-serif font-black italic text-primary">
                    {status.verified === true ? 'Account Verified!' : 'Status: Pending Verification'}
                  </h3>
                  <p className="text-primary/40 text-sm italic font-medium">Customer ID: {userId.substring(0, 8)}...</p>
                </div>
              </div>

              {/* Progress Steps */}
              <div className="space-y-8 relative before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-[2px] before:bg-primary/5">
                {[
                  { 
                    icon: <Mail className="w-4 h-4" />, 
                    title: 'Email Verification', 
                    desc: 'You have successfully verified your email address.',
                    done: true 
                  },
                  { 
                    icon: <UserCheck className="w-4 h-4" />, 
                    title: 'Profile Created', 
                    desc: 'Your customer profile is registered in our system.',
                    done: true 
                  },
                  { 
                    icon: <FileSearch className="w-4 h-4" />, 
                    title: 'Admin Review', 
                    desc: 'Our team is reviewing your account for safety and security.',
                    done: status.verified 
                  },
                  { 
                    icon: <Shield className="w-4 h-4" />, 
                    title: 'System Access', 
                    desc: 'Full access to booking and maintenance services.',
                    done: status.verified && status.status !== false 
                  }
                ].map((step, i) => (
                  <div key={i} className="flex gap-6 relative z-10">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                      step.done ? 'bg-accent text-white' : 'bg-white border-2 border-primary/5 text-primary/20'
                    }`}>
                      {step.icon}
                    </div>
                    <div>
                      <h4 className={`font-bold italic ${step.done ? 'text-primary' : 'text-primary/20'}`}>{step.title}</h4>
                      <p className="text-xs text-primary/40 italic mt-1 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {status.verified !== true && (
                <div className="bg-primary/5 p-6 rounded-3xl border border-primary/5">
                  <p className="text-xs text-primary/60 italic leading-relaxed">
                    <strong>Note:</strong> Customer verification is a security measure to ensure the safety of our community. This usually takes a few hours. You'll receive an email once your account is ready.
                  </p>
                </div>
              )}

              {status.verified === true && (
                <Link 
                  to="/dashboard" 
                  className="w-full bg-accent text-white py-4 rounded-2xl font-black uppercase tracking-widest text-center block shadow-xl shadow-accent/20 hover:scale-[1.02] transition-all"
                >
                  Proceed to Dashboard
                </Link>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
