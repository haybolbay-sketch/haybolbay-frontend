import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { doc, onSnapshot, collection, query, where, orderBy, updateDoc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Shield, 
  CheckCircle2, 
  AlertCircle,
  Calendar,
  DollarSign,
  Star as StarIcon,
  Search,
  Briefcase,
  Loader2,
  Sparkles
} from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { handleFirestoreError, OperationType } from '../../lib/firestore-errors';

export default function CleanerDashboard() {
  const { user, profile } = useAuth();
  const [cleanerData, setCleanerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [availableJobs, setAvailableJobs] = useState<any[]>([]);
  const [acceptedJobs, setAcceptedJobs] = useState<any[]>([]);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const requestPermission = async () => {
    if (typeof Notification === 'undefined') return;
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') {
      new Notification('Notifications Enabled!', {
        body: 'You will now receive alerts for new cleaning requests.',
        icon: '/favicon.ico'
      });
    }
  };

  const sendTestNotification = () => {
    if (typeof Notification !== 'undefined' && permission === 'granted') {
      // Play sound
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(() => {});

      new Notification('Test Notification', {
        body: 'This is a test alert from Haybolbay.',
        icon: '/favicon.ico',
        requireInteraction: true
      });
    }
  };

  useEffect(() => {
    if (!user) return;

    // Fetch cleaner profile
    const unsubscribeProfile = onSnapshot(doc(db, 'cleaners', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setCleanerData(docSnap.data());
      }
      setLoading(false);
    }, (error) => {
      setLoading(false);
      handleFirestoreError(error, OperationType.GET, `cleaners/${user.uid}`);
    });

    // Fetch available jobs (collectionGroup)
    const today = new Date().toISOString().split('T')[0];
    const availableQ = query(
      collection(db, 'bookings'),
      where('status', '==', 'request')
    );

    const unsubscribeAvailable = onSnapshot(availableQ, async (querySnap) => {
      const allJobs = await Promise.all(querySnap.docs.map(async (jobDoc) => {
        const data = jobDoc.data();
        const userId = data.customerId;
        let customerName = 'Unknown Customer';
        let address = 'N/A';

        if (userId) {
          const userSnap = await getDoc(doc(db, 'customers', userId));
          if (userSnap.exists()) {
            customerName = userSnap.data().name;
            address = userSnap.data().address;
          }
        }

        return {
          id: jobDoc.id,
          path: jobDoc.ref.path,
          ...data,
          customerName,
          address
        };
      }));

      // Filter and sort in memory
      const filteredJobs = allJobs
        .filter((job: any) => job.date >= today)
        .sort((a: any, b: any) => (a.date > b.date ? 1 : -1));

      setAvailableJobs(filteredJobs);
    }, (error) => {
      console.error("Available jobs fetch error:", error);
    });

    // Fetch accepted jobs
    const acceptedQ = query(
      collection(db, 'bookings'),
      where('cleanerId', '==', user.uid)
    );

    const unsubscribeAccepted = onSnapshot(acceptedQ, async (querySnap) => {
      const jobs = await Promise.all(querySnap.docs.map(async (jobDoc) => {
        const data = jobDoc.data();
        const userId = data.customerId;
        let customerName = 'Unknown Customer';
        let address = 'N/A';

        if (userId) {
          const userSnap = await getDoc(doc(db, 'customers', userId));
          if (userSnap.exists()) {
            customerName = userSnap.data().name;
            address = userSnap.data().address;
          }
        }

        return {
          id: jobDoc.id,
          path: jobDoc.ref.path,
          ...data,
          customerName,
          address
        };
      }));

      // Sort in memory
      const sortedJobs = jobs.sort((a: any, b: any) => (a.date < b.date ? 1 : -1));

      setAcceptedJobs(sortedJobs);
    }, (error) => {
      console.error("Accepted jobs fetch error:", error);
    });

    return () => {
      unsubscribeProfile();
      unsubscribeAvailable();
      unsubscribeAccepted();
    };
  }, [user]);

  const handleAcceptJob = async (jobPath: string, jobId: string) => {
    if (!user) return;
    setAcceptingId(jobId);
    try {
      const jobRef = doc(db, jobPath);
      
      const result = await runTransaction(db, async (transaction) => {
        const jobSnap = await transaction.get(jobRef);
        if (!jobSnap.exists()) {
          throw new Error("Job does not exist.");
        }

        const data = jobSnap.data();
        // Check if already assigned or not in request status
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

      if (!result.success) {
        alert(result.message);
      }
    } catch (error) {
      console.error("Error accepting job:", error);
      alert("Failed to accept job. Please try again.");
    } finally {
      setAcceptingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <motion.div
           animate={{ rotate: 360 }}
           transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Clock className="w-8 h-8 text-primary opacity-20" />
        </motion.div>
      </div>
    );
  }

  const getStatusColor = (status?: boolean) => {
    if (status === true) return 'bg-accent text-white';
    if (status === false) return 'bg-amber-400 text-white';
    return 'bg-neutral-400 text-white';
  };

  return (
    <div className="min-h-screen bg-secondary">
      <Header />
      
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-serif font-black italic text-primary mb-4">
                Cleaner <span className="text-accent underline decoration-4 underline-offset-4">Portal</span>
              </h1>
              <p className="text-primary/60 font-medium italic">Welcome back, {cleanerData?.firstname}. Here's your status.</p>
            </div>

            {typeof Notification === 'undefined' ? (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-xs text-amber-700 italic">
                Desktop notifications are not supported on this device/browser.
              </div>
            ) : (
              permission === 'denied' ? (
                <div className="bg-red-50 border border-red-200 p-4 rounded-2xl text-xs text-red-600 italic flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Notifications are blocked. Please enable them in your browser settings to receive job alerts.
                </div>
              ) : permission !== 'granted' ? (
                <button 
                  onClick={requestPermission}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-accent/90 transition-all shadow-lg shadow-accent/20"
                >
                  <Sparkles className="w-4 h-4" />
                  Enable Job Alerts
                </button>
              ) : (
                <button 
                  onClick={sendTestNotification}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-secondary text-primary/40 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-primary/5 transition-all border border-primary/5"
                >
                  <Clock className="w-4 h-4" />
                  Test Alert
                </button>
              )
            )}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main column */}
            <div className="lg:col-span-2 space-y-8">
              {/* Status Card */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-8 rounded-[32px] border border-primary/5 shadow-xl shadow-primary/5 relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-serif font-black italic text-primary">Application Status</h2>
                  <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${getStatusColor(cleanerData?.status)}`}>
                    {cleanerData?.status === true ? 'Active' : cleanerData?.status === false ? 'Pending' : 'No Application'}
                  </span>
                </div>

                {cleanerData?.status === false && (
                  <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl flex items-start gap-4">
                    <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />
                    <div>
                      <h4 className="font-bold text-amber-900 mb-1">Under Review</h4>
                      <p className="text-amber-700/80 text-sm italic">Our team is currently reviewing your profile. We'll contact you for an interview shortly.</p>
                    </div>
                  </div>
                )}

                {cleanerData?.status === true && (
                  <div className="bg-accent/5 border border-accent/10 p-6 rounded-2xl flex items-start gap-4">
                    <CheckCircle2 className="w-6 h-6 text-accent shrink-0" />
                    <div>
                      <h4 className="font-bold text-accent mb-1">Active Partner</h4>
                      <p className="text-accent/80 text-sm italic">You are now an official member of the Haybolbay crew! Start accepting jobs now.</p>
                    </div>
                  </div>
                )}

                {!cleanerData && (
                  <div className="py-12 text-center">
                    <p className="text-primary/40 italic mb-6">You haven't submitted an application yet.</p>
                    <button className="px-8 py-3 bg-primary text-white rounded-xl font-bold">Apply Now</button>
                  </div>
                )}
              </motion.div>

              {/* Accepted Jobs Section */}
              {cleanerData?.status === true && acceptedJobs.length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-serif font-black italic text-primary flex items-center gap-2">
                      <CheckCircle2 className="w-6 h-6 text-accent" />
                      My <span className="text-accent">Schedule</span>
                    </h2>
                    <div className="bg-accent/10 px-4 py-2 rounded-xl text-xs font-bold text-accent italic border border-accent/10">
                      {acceptedJobs.length} Active Jobs
                    </div>
                  </div>

                  <div className="grid gap-4">
                    {acceptedJobs.map((job) => (
                      <motion.div
                        key={job.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white p-6 rounded-[32px] border-l-4 border-l-accent border-y border-r border-primary/5 shadow-lg shadow-primary/5 flex flex-col md:flex-row md:items-center justify-between gap-6"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 bg-accent/5 rounded-2xl flex items-center justify-center text-accent shrink-0">
                            <Briefcase className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-serif font-black italic text-primary text-xl">{job.customerName}</h4>
                              <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${
                                job.status === 'confirmed' ? 'bg-accent/10 text-accent' : 'bg-green-100 text-green-600'
                              }`}>
                                {job.status}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1">
                              <div className="flex items-center gap-1.5 text-xs text-primary/40 italic font-medium">
                                <MapPin className="w-3 h-3" />
                                {job.address}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-primary/40 italic font-medium">
                                <Calendar className="w-3 h-3" />
                                {job.date}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-primary/40 italic font-medium">
                                <Clock className="w-3 h-3" />
                                {job.time}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <button className="flex-1 md:flex-none px-6 py-2.5 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-bold rounded-xl transition-all italic">
                            Details
                          </button>
                          {job.status === 'confirmed' && (
                            <button className="flex-1 md:flex-none px-6 py-2.5 bg-accent text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-accent/20 hover:scale-[1.02] transition-all">
                              Complete
                            </button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Jobs Section */}
              {cleanerData?.status === true && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-serif font-black italic text-primary flex items-center gap-2">
                      <Briefcase className="w-6 h-6 text-accent" />
                      Available <span className="text-accent">Requests</span>
                    </h2>
                    <div className="bg-white px-4 py-2 rounded-xl text-xs font-bold text-primary/40 italic border border-primary/5">
                      {availableJobs.length} Jobs Found
                    </div>
                  </div>

                  <div className="grid gap-4">
                    {availableJobs.length > 0 ? (
                      availableJobs.map((job) => (
                        <motion.div
                          key={job.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="bg-white p-6 rounded-[32px] border border-primary/5 shadow-lg shadow-primary/5 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-accent/20 transition-all group"
                        >
                          <div className="flex items-start gap-4">
                            <div className="w-14 h-14 bg-accent/5 rounded-2xl flex items-center justify-center text-accent shrink-0 group-hover:scale-110 transition-transform">
                              <Calendar className="w-6 h-6" />
                            </div>
                            <div>
                              <h4 className="font-serif font-black italic text-primary text-xl mb-1">{job.customerName}</h4>
                              <div className="flex flex-wrap gap-x-4 gap-y-1">
                                <div className="flex items-center gap-1.5 text-xs text-primary/40 italic font-medium">
                                  <MapPin className="w-3 h-3" />
                                  {job.address}
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-primary/40 italic font-medium">
                                  <Calendar className="w-3 h-3" />
                                  {job.date}
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-primary/40 italic font-medium">
                                  <Clock className="w-3 h-3" />
                                  {job.time}
                                </div>
                              </div>
                              {job.notes && (
                                <p className="mt-3 text-xs text-primary/60 bg-secondary/50 p-3 rounded-xl italic leading-relaxed border border-primary/5">
                                  "{job.notes}"
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleAcceptJob(job.path, job.id)}
                            disabled={acceptingId === job.id}
                            className="bg-primary text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:scale-[1.05] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                          >
                            {acceptingId === job.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              'Accept Job'
                            )}
                          </button>
                        </motion.div>
                      ))
                    ) : (
                      <div className="bg-white p-12 rounded-[32px] text-center border border-primary/5 border-dashed">
                        <Search className="w-12 h-12 text-primary/10 mx-auto mb-4" />
                        <h3 className="text-xl font-serif font-black italic text-primary mb-2">No Requests Found</h3>
                        <p className="text-primary/40 italic">New jobs will appear here as soon as they are posted.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { icon: <Calendar className="w-5 h-5" />, label: 'Jobs Done', value: '0' },
                  { icon: <DollarSign className="w-5 h-5" />, label: 'Earnings', value: '₱0' },
                  { icon: <StarIcon className="w-5 h-5" />, label: 'Rating', value: 'N/A' },
                  { icon: <Clock className="w-5 h-5" />, label: 'Hours', value: '0' },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white p-6 rounded-3xl border border-primary/5 text-center"
                  >
                    <div className="w-10 h-10 bg-primary/5 rounded-2xl flex items-center justify-center text-primary mx-auto mb-4">
                      {stat.icon}
                    </div>
                    <div className="text-2xl font-serif font-black italic text-primary">{stat.value}</div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-primary/40">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Sidebar column */}
            <div className="space-y-8">
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-primary text-white p-8 rounded-[32px] shadow-2xl shadow-primary/20"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold italic text-white text-xl">
                      {cleanerData?.firstname} {cleanerData?.lastname}
                    </h3>
                    <p className="text-white/40 text-xs italic">Professional Cleaner</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm text-white/60">
                    <Mail className="w-4 h-4" />
                    <span className="italic">{cleanerData?.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-white/60">
                    <Phone className="w-4 h-4" />
                    <span className="italic">{cleanerData?.contactno}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-white/60">
                    <MapPin className="w-4 h-4" />
                    <span className="italic truncate">{cleanerData?.address}</span>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-white/10">
                   <div className="flex items-center justify-between mb-4">
                     <span className="text-xs font-black uppercase tracking-widest text-white/40">Profile Status</span>
                     <span className="flex items-center gap-2 text-accent text-xs font-bold">
                       <Shield className="w-3 h-3" />
                       {cleanerData?.verified ? 'Verified' : 'Unverified'}
                     </span>
                   </div>
                   <button className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold transition-all">
                     Edit Profile
                   </button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
