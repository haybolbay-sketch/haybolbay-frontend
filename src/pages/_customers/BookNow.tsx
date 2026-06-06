import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Clock, FileText, Loader2, Check, Sparkles, ArrowLeft, Info, DollarSign, ListChecks, MapPin } from 'lucide-react';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { handleFirestoreError, OperationType } from '../../lib/firestore-errors';

interface Service {
  id: string;
  type: string;
  duration: string;
  rate: number;
  description: string;
  inclusion: string[];
}

export default function BookNow() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);

  // Form states
  const [selectedServiceId, setSelectedServiceId] = useState<string>(location.state?.serviceId || '');
  const [selectedAddress, setSelectedAddress] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');

  const selectedService = services.find(s => s.id === selectedServiceId);

  useEffect(() => {
    if (profile) {
      if (Array.isArray(profile.address) && profile.address.length > 0) {
        setSelectedAddress(profile.address[0]);
      } else if (profile.address) {
        setSelectedAddress(profile.address);
      }
    }
  }, [profile]);

  useEffect(() => {
    const q = query(collection(db, 'services'), orderBy('rate', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const servicesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Service[];
      setServices(servicesList);
      setServicesLoading(false);
    }, (err) => {
      console.error("Error fetching services (BookNow):", err);
      setServicesLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedService) return;

    setLoading(true);
    try {
      const bookingsRef = collection(db, 'bookings');
      await addDoc(bookingsRef, {
        date,
        time,
        notes,
        status: 'request',
        customerId: user.uid,
        customerAddress: selectedAddress || 'Address not provided',
        customerName: profile?.name || 'Customer',
        serviceId: selectedService.id,
        serviceName: selectedService.type,
        serviceRate: selectedService.rate,
        createdAt: serverTimestamp(),
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'bookings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary">
      <Header />
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-neutral-400 hover:text-primary transition-colors text-sm font-bold uppercase tracking-widest mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back
          </button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[40px] shadow-xl overflow-hidden"
          >
            <div className="bg-primary p-12 text-white relative overflow-hidden text-center">
              <div className="relative z-10">
                <h1 className="text-4xl md:text-5xl font-serif italic mb-2">Book a Cleaning</h1>
                <p className="text-white/60 text-lg italic tracking-tight">Tell us when you'd like your home to sparkle.</p>
              </div>
              <Sparkles className="absolute -top-10 -right-10 w-60 h-60 text-white/5" />
            </div>

            <div className="p-12">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Service Selection */}
                <div>
                  <label className="text-xs uppercase tracking-widest font-bold text-neutral-400 mb-2 block px-2">Select Cleaning Package</label>
                  <div className="relative">
                    <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-300 pointer-events-none" />
                    <select 
                      required
                      value={selectedServiceId}
                      onChange={(e) => setSelectedServiceId(e.target.value)}
                      disabled={servicesLoading}
                      className="w-full bg-secondary pl-12 pr-10 py-4 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium appearance-none"
                    >
                      <option value="">{servicesLoading ? 'Loading Services...' : 'Choose a Package'}</option>
                      {services.map(service => (
                        <option key={service.id} value={service.id}>
                          {service.type} — ₱{service.rate}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Service Details Display */}
                <AnimatePresence>
                  {selectedService && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-primary/5 rounded-[32px] p-8 border border-primary/10 space-y-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-xl font-serif italic font-bold text-primary">{selectedService.type}</h3>
                            <div className="flex items-center gap-2 text-neutral-500 text-xs italic mt-1">
                              <Clock className="w-3 h-3" />
                              <span>{selectedService.duration}</span>
                            </div>
                          </div>
                          <div className="text-right">
                             <div className="text-2xl font-bold text-primary">₱{selectedService.rate}</div>
                             <div className="text-[10px] font-black uppercase tracking-widest text-primary/40">Base Rate</div>
                          </div>
                        </div>

                        <div className="space-y-2">
                           <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary/40">
                             <Info className="w-3 h-3" />
                             Description
                           </div>
                           <p className="text-sm text-neutral-600 italic leading-relaxed">
                             {selectedService.description}
                           </p>
                        </div>

                        {selectedService.inclusion && selectedService.inclusion.length > 0 && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary/40">
                              <ListChecks className="w-3 h-3" />
                              What's Included
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {selectedService.inclusion.map((item, idx) => (
                                <span key={idx} className="bg-white px-3 py-1.5 rounded-xl text-[10px] font-bold text-primary border border-primary/5 shadow-sm italic">
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Address Selection */}
                <div>
                  <label className="text-xs uppercase tracking-widest font-bold text-neutral-400 mb-2 block px-2">Service Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-300 pointer-events-none" />
                    {Array.isArray(profile?.address) && profile.address.length > 1 ? (
                      <select 
                        required
                        value={selectedAddress}
                        onChange={(e) => setSelectedAddress(e.target.value)}
                        className="w-full bg-secondary pl-12 pr-10 py-4 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium appearance-none"
                      >
                        {profile.address.map((addr: string, idx: number) => (
                          <option key={idx} value={addr}>{addr}</option>
                        ))}
                      </select>
                    ) : (
                      <input 
                        type="text"
                        required
                        value={selectedAddress}
                        onChange={(e) => setSelectedAddress(e.target.value)}
                        placeholder="Enter service address"
                        className="w-full bg-secondary pl-12 pr-6 py-4 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium"
                      />
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <label className="text-xs uppercase tracking-widest font-bold text-neutral-400 mb-2 block px-2">Preferred Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-300" />
                      <input 
                        type="date"
                        required
                        value={date}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-secondary pl-12 pr-6 py-4 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs uppercase tracking-widest font-bold text-neutral-400 mb-2 block px-2">Preferred Time</label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-300" />
                      <select 
                        required
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-full bg-secondary pl-12 pr-6 py-4 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium appearance-none"
                      >
                        <option value="">Select Time</option>
                        <option value="08:00 AM">08:00 AM</option>
                        <option value="10:00 AM">10:00 AM</option>
                        <option value="12:00 PM">12:00 PM</option>
                        <option value="02:00 PM">02:00 PM</option>
                        <option value="04:00 PM">04:00 PM</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-widest font-bold text-neutral-400 mb-2 block px-2">Additional Notes</label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-4 w-5 h-5 text-neutral-300" />
                    <textarea 
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Instructions for access, specific areas to focus on..."
                      rows={4}
                      className="w-full bg-secondary pl-12 pr-6 py-4 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium"
                    ></textarea>
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit"
                    disabled={loading || success || !selectedService}
                    className="w-full bg-primary text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-all shadow-xl shadow-primary/20 disabled:opacity-70 disabled:hover:scale-100 text-lg"
                  >
                    {loading ? <Loader2 className="animate-spin w-6 h-6" /> : success ? <Check className="w-6 h-6" /> : 'Confirm Booking'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
