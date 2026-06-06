import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { User, LogOut, Calendar, Shield, Settings, Mail, MapPin, Phone, Loader2, Sparkles, Check, Camera, Upload, Image, X, ChevronRight, Plus } from 'lucide-react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function Profile() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [addresses, setAddresses] = useState<string[]>(['']);
  const [contactno, setContactno] = useState('');
  
  // ID states
  const [idPreview, setIdPreview] = useState<string | null>(null);
  const [idFile, setIdFile] = useState<File | Blob | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name || user?.displayName || '');
      if (Array.isArray(profile.address)) {
        setAddresses(profile.address.length > 0 ? profile.address : ['']);
      } else if (profile.address) {
        setAddresses([profile.address]);
      } else {
        setAddresses(['']);
      }
      setContactno(profile.contactno || user?.phoneNumber || '');
      setIdPreview(profile.identification || null);
    } else if (user) {
      setName(user.displayName || '');
      if (user.phoneNumber) {
        setContactno(user.phoneNumber);
      }
    }
  }, [profile, user]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCapturing(true);
      }
    } catch (err) {
      console.error("Camera error:", err);
      setError("Unable to access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      setIsCapturing(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        
        canvasRef.current.toBlob((blob) => {
          if (blob) {
            setIdFile(blob);
            setIdPreview(URL.createObjectURL(blob));
            stopCamera();
          }
        }, 'image/jpeg', 0.8);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIdFile(file);
      setIdPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    // Mandatory check
    if (!idPreview && !idFile) {
      setError("Valid identification document is mandatory.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      let identificationUrl = idPreview;

      // Upload file if new one was captured/selected
      if (idFile) {
        const fileExt = idFile instanceof File ? idFile.name.split('.').pop() : 'jpg';
        const storageRef = ref(storage, `customers/${user.uid}/identification_${Date.now()}.${fileExt}`);
        const snapshot = await uploadBytes(storageRef, idFile);
        identificationUrl = await getDownloadURL(snapshot.ref);
      }

      const userRef = doc(db, 'customers', user.uid);
      await setDoc(userRef, {
        name,
        email: user.email,
        address: addresses.filter(a => a.trim() !== ''),
        contactno,
        identification: identificationUrl,
        onboarding: true,
        // Add defaults if it's a new profile
        ...(profile ? {} : {
          role: 'customer',
          verified: false,
          status: true,
          createdAt: serverTimestamp()
        })
      }, { merge: true });
      
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        navigate('/dashboard');
      }, 1500);
    } catch (error) {
      console.error("Error saving profile:", error);
      setError("Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const role = profile?.role;
    if (role === 'cleaner') {
      navigate('/join-crew');
    } else {
      navigate('/');
    }
    
    setTimeout(async () => {
      await logout();
    }, 50);
  };

  return (
    <div className="min-h-screen bg-secondary">
      <Header />
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          {!profile?.onboarding && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-primary/10 border border-primary/20 p-6 rounded-[32px] mb-8 text-center"
            >
              <h2 className="text-xl font-serif italic text-primary">Complete your onboarding</h2>
              <p className="text-sm text-primary/70 italic">Please fill in your details and upload a valid ID to start using Haybolbay.</p>
            </motion.div>
          )}

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl mb-8 text-center text-sm font-medium"
            >
              {error}
            </motion.div>
          )}

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[40px] shadow-xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-primary p-12 text-white relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/30">
                  <User className="w-12 h-12 text-white" />
                </div>
                <div className="text-center md:text-left">
                  <h1 className="text-4xl font-serif italic mb-2">My Profile</h1>
                  <p className="text-white/60 text-lg italic tracking-tight">{user?.email}</p>
                </div>
              </div>
              <Sparkles className="absolute -top-10 -right-10 w-60 h-60 text-white/5" />
            </div>

            {/* Content */}
            <div className="p-12">
              <form onSubmit={handleSave} className="space-y-12">
                <div className="grid md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <h2 className="text-2xl font-serif italic border-b border-neutral-100 pb-4">Personal Details</h2>
                    
                    <div>
                      <label className="text-xs uppercase tracking-widest font-bold text-neutral-400 mb-2 block px-2">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-300" />
                        <input 
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Julian Fernandez"
                          className="w-full bg-secondary pl-12 pr-6 py-4 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs uppercase tracking-widest font-bold text-neutral-400 mb-2 block px-2">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-300" />
                        <input 
                          type="email"
                          disabled
                          value={user?.email || ''}
                          className="w-full bg-neutral-50 pl-12 pr-6 py-4 rounded-2xl border-none text-neutral-400 text-sm font-medium italic"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-2">
                        <label className="text-xs uppercase tracking-widest font-bold text-neutral-400">Property Addresses</label>
                        <button 
                          type="button"
                          onClick={() => setAddresses([...addresses, ''])}
                          className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1 hover:underline"
                        >
                          <Plus className="w-3 h-3" />
                          Add Address
                        </button>
                      </div>
                      {addresses.map((addr, index) => (
                        <div key={index} className="flex gap-2">
                          <div className="relative flex-1">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-300" />
                            <input 
                              type="text"
                              required
                              value={addr}
                              onChange={(e) => {
                                const newAddresses = [...addresses];
                                newAddresses[index] = e.target.value;
                                setAddresses(newAddresses);
                              }}
                              placeholder="e.g. 123 Clean Street, Spotless City"
                              className="w-full bg-secondary pl-12 pr-6 py-4 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium"
                            />
                          </div>
                          {addresses.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setAddresses(addresses.filter((_, i) => i !== index))}
                              className="p-4 bg-red-50 text-red-400 rounded-2xl hover:bg-red-100 transition-colors"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <div>
                      <label className="text-xs uppercase tracking-widest font-bold text-neutral-400 mb-2 block px-2">Contact Number</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-300" />
                        <input 
                          type="tel"
                          required
                          value={contactno}
                          onChange={(e) => setContactno(e.target.value)}
                          disabled={!!user?.phoneNumber}
                          placeholder="e.g. +1 234 567 890"
                          className={`w-full ${!!user?.phoneNumber ? 'bg-neutral-50 text-neutral-400 cursor-not-allowed italic' : 'bg-secondary'} pl-12 pr-6 py-4 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium`}
                        />
                      </div>
                      {!!user?.phoneNumber && (
                        <p className="text-[10px] text-neutral-400 italic mt-2 px-2">Verified via Phone Authentication</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h2 className="text-2xl font-serif italic border-b border-neutral-100 pb-4">Identification Document</h2>
                    <p className="text-sm text-neutral-500 italic">Please provide a valid government-issued ID for verification. This is mandatory.</p>
                    
                    <div className="space-y-4">
                      {/* ID Preview / Capture Area */}
                      <div className="aspect-[4/3] bg-secondary rounded-[32px] overflow-hidden border-2 border-dashed border-neutral-200 relative flex items-center justify-center">
                        <AnimatePresence mode="wait">
                          {isCapturing ? (
                            <motion.div 
                              key="camera"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="absolute inset-0 z-10"
                            >
                              <video 
                                ref={videoRef} 
                                autoPlay 
                                playsInline 
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4 z-20">
                                <button 
                                  type="button"
                                  onClick={capturePhoto}
                                  className="bg-white text-primary p-4 rounded-full shadow-xl hover:scale-110 transition-transform"
                                >
                                  <Camera className="w-6 h-6" />
                                </button>
                                <button 
                                  type="button"
                                  onClick={stopCamera}
                                  className="bg-neutral-800 text-white p-4 rounded-full shadow-xl hover:scale-110 transition-transform"
                                >
                                  <X className="w-6 h-6" />
                                </button>
                              </div>
                            </motion.div>
                          ) : idPreview ? (
                            <motion.div 
                              key="preview"
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="absolute inset-0 z-10"
                            >
                              <img src={idPreview} alt="ID Preview" className="w-full h-full object-cover" />
                              <button 
                                type="button"
                                onClick={() => { setIdPreview(null); setIdFile(null); }}
                                className="absolute top-4 right-4 bg-white/80 backdrop-blur-md text-red-500 p-2 rounded-xl border border-red-100"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </motion.div>
                          ) : (
                            <motion.div 
                              key="empty"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="text-center p-8"
                            >
                              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 border border-neutral-100">
                                <Image className="w-8 h-8 text-neutral-300" />
                              </div>
                              <p className="text-sm font-medium text-neutral-400">No document attached</p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <canvas ref={canvasRef} className="hidden" />
                      </div>

                      {/* Action Buttons */}
                      {!isCapturing && (
                        <div className="grid grid-cols-2 gap-4">
                          <button 
                            type="button"
                            onClick={startCamera}
                            className="bg-white border border-neutral-200 py-3 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold text-neutral-600 hover:bg-neutral-50 transition-all"
                          >
                            <Camera className="w-4 h-4" />
                            Capture ID
                          </button>
                          <label className="bg-white border border-neutral-200 py-3 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold text-neutral-600 hover:bg-neutral-50 cursor-pointer transition-all">
                            <Upload className="w-4 h-4" />
                            Upload File
                            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                          </label>
                        </div>
                      )}
                    </div>

                    <div className="bg-neutral-50 p-6 rounded-2xl border border-neutral-100 space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Account Status</h3>
                      <div className="flex items-center gap-4">
                        <div className="bg-white p-2 rounded-lg border border-neutral-100">
                          <Shield className={`w-4 h-4 ${idPreview ? 'text-green-500' : 'text-primary'}`} />
                        </div>
                        <p className="text-sm font-medium italic">
                          {idPreview ? 'Document ready for verification' : 'Identification required'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 pt-6 border-t border-neutral-100">
                  <button 
                    type="submit"
                    disabled={loading || success}
                    className="flex-1 bg-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-all shadow-xl shadow-primary/20 disabled:opacity-70 disabled:hover:scale-100"
                  >
                    {loading ? <Loader2 className="animate-spin w-5 h-5" /> : success ? <Check className="w-5 h-5" /> : (
                      <>
                        Save & Complete Profile
                        <ChevronRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                  
                  <button 
                    type="button"
                    onClick={handleLogout}
                    className="md:w-48 flex items-center justify-center gap-2 py-4 border-2 border-red-50 text-red-500 rounded-2xl font-bold hover:bg-red-50 transition-all group"
                  >
                    <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    Sign Out
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
