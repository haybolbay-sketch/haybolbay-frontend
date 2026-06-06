import { useEffect, useState, useRef } from 'react';
import { collection, query, where, onSnapshot, getDoc, doc, runTransaction, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Clock, Calendar, FileText, Bell, X, Sparkles, Loader2 } from 'lucide-react';

// Helper to convert VAPID public key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

interface AlertJob {
  id: string;
  customerName: string;
  address: string;
  date: string;
  time: string;
  notes: string;
}

export default function NotificationManager() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [activeAlerts, setActiveAlerts] = useState<AlertJob[]>([]);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  
  // Persistence refs
  const notifiedIdsRef = useRef<Set<string>>(new Set(
    JSON.parse(localStorage.getItem('haybolbay_notified_jobs') || '[]')
  ));
  const isInitialLoadRef = useRef(true);

  // Sync notified IDs to localStorage
  const markAsNotified = (jobId: string) => {
    if (!notifiedIdsRef.current.has(jobId)) {
      notifiedIdsRef.current.add(jobId);
      const list = Array.from(notifiedIdsRef.current).slice(-100); // Keep last 100
      localStorage.setItem('haybolbay_notified_jobs', JSON.stringify(list));
      return true;
    }
    return false;
  };

  const handleAcceptJob = async (jobId: string) => {
    if (!user) {
      navigate('/cleaner-login');
      return;
    }

    setAcceptingId(jobId);
    try {
      const jobRef = doc(db, 'bookings', jobId);
      
      const result = await runTransaction(db, async (transaction) => {
        const jobSnap = await transaction.get(jobRef);
        if (!jobSnap.exists()) {
          throw new Error("Job does not exist.");
        }

        const data = jobSnap.data();
        if (data.status !== 'request' || data.cleanerId) {
          return { success: false, message: "This job is already accepted and no longer available." };
        }

        transaction.update(jobRef, {
          status: 'confirmed',
          cleanerId: user.uid,
          updatedAt: serverTimestamp()
        });

        return { success: true };
      });

      if (result.success) {
        setActiveAlerts(prev => prev.filter(a => a.id !== jobId));
        navigate('/dashboard');
      } else {
        alert(result.message);
        setActiveAlerts(prev => prev.filter(a => a.id !== jobId));
      }
    } catch (error) {
      console.error("Error accepting job:", error);
      alert("Failed to accept job. Please try again.");
    } finally {
      setAcceptingId(null);
    }
  };

  useEffect(() => {
    if (!('Notification' in window)) return;

    // We'll listen for notifications if they are a logged-in cleaner OR if they were last seen as a cleaner
    const lastRole = localStorage.getItem('haybolbay_last_role');
    const isCleaner = profile ? (profile.role === 'cleaner') : (lastRole === 'cleaner');
    
    console.info('NotificationManager: Status check', { 
      role: profile?.role, 
      lastRole, 
      isCleaner, 
      authenticated: !!user,
      permission: Notification.permission 
    });
    
    if (!isCleaner) {
      // Clear alerts if they are no longer a cleaner (logged out or role change)
      if (activeAlerts.length > 0) setActiveAlerts([]);
      return;
    }

    // --- PUSH SUBSCRIPTION LOGIC ---
    const subscribeToPush = async () => {
      if (!('serviceWorker' in navigator)) return;
      
      try {
        const registration = await navigator.serviceWorker.ready;
        const pushSubscription = await registration.pushManager.getSubscription();
        
        if (!pushSubscription) {
          // Use a cast to avoid TS error in some environments, or fallback to default
          const meta = (import.meta as any);
          const publicKey = (meta.env && meta.env.VITE_VAPID_PUBLIC_KEY) || "BG8fofx4_yG3hY8hYhB4S4V_Dq6K_9E9S2I7U5W6h3U7P5X6R5S6T7U8V9W0X1Y2Z3A4B5C6D7E8F9G";
          const newSubscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey)
          });
          
          if (user) {
            await setDoc(doc(db, 'push_subscriptions', user.uid), {
              userId: user.uid,
              subscription: newSubscription.toJSON(),
              updatedAt: serverTimestamp()
            });
          }
        } else if (user) {
            // Keep it updated
            await setDoc(doc(db, 'push_subscriptions', user.uid), {
                userId: user.uid,
                subscription: pushSubscription.toJSON(),
                updatedAt: serverTimestamp()
            });
        }
      } catch (err) {
        console.warn('Push subscription failed:', err);
      }
    };

    if (Notification.permission === 'granted') {
      subscribeToPush();
    }

    // Request permission if not already granted - usually should be triggered by user action, 
    // but we can check here.
    if (Notification.permission === 'default') {
      console.log('NotificationManager: permission is default');
    }

    // Listen for new booking requests
    const q = query(
      collection(db, 'bookings'),
      where('status', '==', 'request')
    );

    console.log('NotificationManager: starting Firestore listener for bookings...');

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('NotificationManager: snapshot received', { 
        count: snapshot.size, 
        isInitialLoad: isInitialLoadRef.current,
        changes: snapshot.docChanges().length 
      });

      // Special handling for new jobs (either in initial pulse or subsequent ones)
      const processJob = async (jobId: string, jobData: any) => {
        if (markAsNotified(jobId)) {
          console.log('NotificationManager: notifying for new/missed job:', jobId);
          
          const alertData: AlertJob = {
            id: jobId,
            customerName: jobData.customerName || 'New Customer',
            address: jobData.customerAddress || 'Address not specified',
            date: jobData.date || 'Unknown Date',
            time: jobData.time || 'Unknown Time',
            notes: jobData.notes || 'No extra notes'
          };

          // ADD TO IN-APP ALERTS
          setActiveAlerts(prev => {
            if (prev.some(a => a.id === jobId)) return prev;
            return [alertData, ...prev];
          });

          // Play notification sound
          try {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.play().catch(e => console.warn("Audio playback stalled:", e));
          } catch (err) {
            console.warn("Audio playback failed:", err);
          }

          // NATIVE NOTIFICATION
          if (Notification.permission === 'granted') {
            try {
              const title = '🏠 New Cleaning Request!';
              const options = {
                body: `📍 ${alertData.address}\n📅 ${alertData.date} at ${alertData.time}\n📝 ${alertData.notes}`,
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                tag: jobId,
                requireInteraction: true,
                silent: false
              };

              if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
                navigator.serviceWorker.ready.then(registration => {
                  registration.showNotification(title, options);
                });
              } else {
                const notification = new Notification(title, options);
                notification.onclick = (e) => {
                  e.preventDefault();
                  window.focus();
                  navigate('/dashboard');
                  setActiveAlerts(prev => prev.filter(a => a.id !== jobId));
                  notification.close();
                };
              }
            } catch (err) {
              console.error("Native notification failed:", err);
            }
          }
        }
      };

      // On first load, check all current 'request' jobs
      if (isInitialLoadRef.current) {
        snapshot.docs.forEach(doc => {
          processJob(doc.id, doc.data());
        });
        isInitialLoadRef.current = false;
        return;
      }

      // Subsequent changes
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          processJob(change.doc.id, change.doc.data());
        }
      });
    }, (error) => {
      console.error("NotificationManager: Firestore listener error:", error);
    });

    return () => {
      console.log('NotificationManager: cleaning up listener');
      unsubscribe();
    };
  }, [profile, navigate, user]);

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center p-6">
      <div className="flex flex-col gap-4 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {activeAlerts.map((alert) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, scale: 0.8, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -40 }}
              className="bg-white rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] border border-primary/10 p-6 pointer-events-auto overflow-hidden relative group"
            >
              {/* Sound effect logic - handled in useEffect, but we could play here too if needed */}
              
              {/* Background Accent / Logo Watermark */}
              <div className="absolute -right-8 -bottom-8 opacity-[0.03] rotate-12 transition-transform group-hover:rotate-0">
                <img src="/favicon.ico" alt="" className="w-48 h-48 grayscale" />
              </div>

              <div className="relative">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                        <img src="/favicon.ico" alt="Logo" className="w-6 h-6 object-contain" />
                        <h3 className="font-serif font-black italic text-primary text-xl">New Job Offer!</h3>
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-accent flex items-center gap-1.5 px-2 py-0.5 bg-accent/10 rounded-full w-fit">
                        <Sparkles className="w-2.5 h-2.5" />
                        Fresh Live Request
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveAlerts(prev => prev.filter(a => a.id !== alert.id))}
                    className="p-2 hover:bg-primary/5 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-primary/30" />
                  </button>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-xl bg-accent/5 flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4 text-accent" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-primary/40 uppercase tracking-widest mb-0.5">Location</p>
                      <p className="text-base font-semibold text-primary leading-tight">{alert.address}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-xl bg-accent/5 flex items-center justify-center shrink-0">
                        <Calendar className="w-4 h-4 text-accent" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-primary/40 uppercase tracking-widest mb-0.5">Date</p>
                        <p className="text-sm font-semibold text-primary leading-tight">{alert.date}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-xl bg-accent/5 flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4 text-accent" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-primary/40 uppercase tracking-widest mb-0.5">Time</p>
                        <p className="text-sm font-semibold text-primary leading-tight">{alert.time}</p>
                      </div>
                    </div>
                  </div>

                  {alert.notes && (
                    <div className="flex items-start gap-4 p-4 bg-secondary rounded-2xl border border-primary/5">
                      <FileText className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                      <p className="text-xs italic font-medium text-primary/70">
                        &quot;{alert.notes}&quot;
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => handleAcceptJob(alert.id)}
                    disabled={acceptingId === alert.id}
                    className="w-full py-4 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-primary/95 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {acceptingId === alert.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      user ? 'Accept Job Now' : 'Login to Accept Job'
                    )}
                  </button>
                  <button
                    onClick={() => setActiveAlerts(prev => prev.filter(a => a.id !== alert.id))}
                    disabled={acceptingId === alert.id}
                    className="w-full py-4 bg-transparent text-primary/40 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-primary/5 transition-all"
                  >
                    Ignore for now
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
