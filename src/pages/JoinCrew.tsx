import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Star, DollarSign, Clock, CheckCircle2, ArrowRight, User, Mail, Phone, MapPin, Loader2, Sparkles, X, Menu, LogOut, Camera, Upload, Image as ImageIcon, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signOut, sendEmailVerification } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import Footer from '../components/Footer';

export default function JoinCrew() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    address: '',
    contactno: '',
    email: '',
    gender: 'male'
  });

  // ID states
  const [idPreview, setIdPreview] = useState<string | null>(null);
  const [idFile, setIdFile] = useState<File | Blob | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idFile) {
      setError("Identification document is mandatory for application.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Create auth user with default password
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, "123456");
      const newUser = userCredential.user;

      // Send email verification
      await sendEmailVerification(newUser);

      // Upload ID to storage
      const fileExt = idFile instanceof File ? idFile.name.split('.').pop() : 'jpg';
      const storageRef = ref(storage, `cleaners/${newUser.uid}/identification.${fileExt}`);
      const snapshot = await uploadBytes(storageRef, idFile);
      const identificationUrl = await getDownloadURL(snapshot.ref);

      // Save cleaner profile
      await setDoc(doc(db, 'cleaners', newUser.uid), {
        ...formData,
        identification: identificationUrl,
        verified: false,
        status: false,
        createdAt: serverTimestamp()
      });

      // Sign out immediately as requested "without authenticating the user"
      await signOut(auth);

      setSuccess(true);
      setTimeout(() => {
        navigate('/cleaner-verify', { state: { userId: newUser.uid } });
      }, 3000);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        setError("This email is already registered. Please login.");
        setTimeout(() => navigate('/cleaner-login'), 2000);
      } else {
        console.error("Application error:", error);
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const navLinks = [
    { name: 'About Us', href: '#about-us' },
  ];

  return (
    <div className="min-h-screen bg-secondary overflow-x-hidden">
      {/* Custom Cleaner Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <nav className="max-w-7xl mx-auto flex items-center justify-between glass rounded-2xl px-6 py-3">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-primary p-1.5 rounded-lg group-hover:rotate-12 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-serif font-bold tracking-tight text-primary">Haybolbay</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-neutral-600 hover:text-primary transition-colors italic"
              >
                {link.name}
              </a>
            ))}
            
            {user ? (
              <div className="flex items-center gap-3">
                <Link 
                  to="/cleaner/profile" 
                  className="flex items-center gap-2 bg-secondary text-primary px-5 py-2 rounded-xl text-sm font-semibold hover:bg-primary hover:text-white transition-all shadow-sm"
                >
                  <User className="w-4 h-4" />
                  Profile
                </Link>
                <button
                  onClick={async () => {
                    navigate('/join-crew');
                    setTimeout(async () => {
                      await auth.signOut();
                    }, 50);
                  }}
                  className="p-2 text-primary/40 hover:text-primary transition-colors hover:bg-primary/5 rounded-lg"
                  title="Log Out"
                >
                  <LogOut className="w-5 h-5 text-neutral-400" />
                </button>
              </div>
            ) : (
              <Link 
                to="/cleaner-login"
                className="bg-primary text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
              >
                Cleaner Login
              </Link>
            )}
          </div>

          <button className="md:hidden p-2 text-neutral-600" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </nav>

        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden absolute top-20 left-6 right-6 glass p-6 rounded-2xl flex flex-col gap-4 mt-4"
          >
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="text-lg font-serif italic text-neutral-800"
              >
                {link.name}
              </a>
            ))}
            
            {user ? (
              <div className="flex flex-col gap-2">
                <Link 
                  to="/cleaner/profile" 
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-center gap-2 bg-secondary text-primary w-full py-3 rounded-xl font-bold text-center"
                >
                  <User className="w-4 h-4" />
                  Profile
                </Link>
                <button 
                  onClick={async () => {
                    navigate('/join-crew');
                    setTimeout(async () => {
                      await auth.signOut();
                    }, 50);
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center justify-center gap-2 bg-red-50 text-red-500 w-full py-3 rounded-xl font-bold text-center"
                >
                  <LogOut className="w-4 h-4" />
                  Log Out
                </button>
              </div>
            ) : (
              <Link 
                to="/cleaner-login"
                onClick={() => setIsMenuOpen(false)}
                className="bg-primary text-white w-full py-3 rounded-xl font-bold text-center"
              >
                Cleaner Login
              </Link>
            )}
          </motion.div>
        )}
      </header>
      
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="relative mb-32">
            <div className="absolute top-0 right-0 -z-10 w-1/2 h-full opacity-10">
              <div className="w-full h-full bg-primary transform skew-x-12 translate-x-20"></div>
            </div>
            
            <div className="max-w-2xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-8">
                  <Star className="w-3 h-3" />
                  <span>Join the elite</span>
                </div>
                <h1 className="text-6xl md:text-8xl font-serif font-black italic text-primary leading-tight mb-8">
                  Join Our <br />
                  <span className="text-accent underline decoration-8 underline-offset-8">Cleaning Crew</span>
                </h1>
                <p className="text-xl text-primary/60 max-w-lg mb-12 font-medium leading-relaxed italic">
                  Become part of an elite team of cleaning professionals. We offer premium rates, flexible schedules, and the best clients in the city.
                </p>
                <div className="flex flex-wrap gap-4">
                  <button 
                    onClick={() => setShowApplyForm(true)}
                    className="px-10 py-5 bg-primary text-secondary text-sm font-black uppercase tracking-widest hover:bg-primary/90 transition-all flex items-center gap-3 shadow-xl shadow-primary/20"
                  >
                    Apply Now
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button className="px-10 py-5 bg-white text-primary text-sm font-black uppercase tracking-widest border border-primary/10 hover:bg-secondary transition-all">
                    View Requirements
                  </button>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Perks Section */}
          <div id="about-us" className="grid md:grid-cols-3 gap-8 mb-32">
            {[
              {
                icon: <DollarSign className="w-6 h-6" />,
                title: "Premium Pay",
                description: "We pay above market rates because we expect the best from our crew."
              },
              {
                icon: <Clock className="w-6 h-6" />,
                title: "Flexible Hours",
                description: "Choose your own schedule. Work as much or as little as you want."
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: "Safe & Insured",
                description: "Full insurance coverage and background-checked clients for your peace of mind."
              }
            ].map((perk, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-12 hover:shadow-2xl transition-all border border-primary/5 group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full transform translate-x-12 -translate-y-12 transition-transform group-hover:scale-150 group-hover:bg-primary/10"></div>
                <div className="w-12 h-12 bg-primary/5 rounded-full flex items-center justify-center mb-8 group-hover:bg-primary group-hover:text-white transition-colors relative z-10">
                  {perk.icon}
                </div>
                <h3 className="text-2xl font-serif font-black italic text-primary mb-4 relative z-10">{perk.title}</h3>
                <p className="text-primary/60 font-medium leading-relaxed italic relative z-10">{perk.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Process Section */}
          <div className="bg-primary text-white p-12 md:p-24 overflow-hidden relative rounded-3xl">
             <div className="absolute top-0 right-0 opacity-10">
                <CheckCircle2 className="w-[400px] h-[400px]" />
             </div>
             
             <div className="relative z-10">
               <h2 className="text-4xl md:text-6xl font-serif font-black italic mb-16">The Application Process</h2>
               <div className="grid md:grid-cols-4 gap-12">
                 {[
                   { step: "01", title: "Apply", text: "Submit your basic info and experience." },
                   { step: "02", title: "Interview", text: "Chat with our team about your skills." },
                   { step: "03", title: "Vetting", text: "Standard background and reference check." },
                   { step: "04", title: "Start", text: "Get your first assignment and earn." }
                 ].map((s, i) => (
                   <div key={i} className="relative">
                     <div className="text-accent text-xs font-black tracking-widest mb-4 flex items-center gap-2">
                       <span className="w-6 h-[1px] bg-accent"></span>
                       {s.step}
                     </div>
                     <h4 className="text-xl font-serif font-bold italic mb-4">{s.title}</h4>
                     <p className="text-white/60 text-sm leading-relaxed italic">{s.text}</p>
                   </div>
                 ))}
               </div>
             </div>
          </div>
        </div>
      </main>

      {/* Application Form Overlay */}
      <AnimatePresence>
        {showApplyForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6"
          >
            <div className="absolute inset-0 bg-primary/20 backdrop-blur-md" onClick={() => !loading && setShowApplyForm(false)}></div>
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 md:p-12 pb-6 flex justify-between items-start border-b border-secondary shrink-0">
                <div>
                  <h2 className="text-4xl font-serif font-black italic text-primary mb-2">Join the Crew</h2>
                  <p className="text-primary/60 font-medium italic">Tell us about yourself</p>
                </div>
                <button 
                  onClick={() => setShowApplyForm(false)}
                  className="p-3 hover:bg-secondary rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-primary" />
                </button>
              </div>

              <div className="p-8 md:p-12 pt-6 overflow-y-auto custom-scrollbar flex-1">

                {success ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-20"
                  >
                    <div className="w-24 h-24 bg-accent text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-accent/20">
                      <CheckCircle2 className="w-12 h-12" />
                    </div>
                    <h3 className="text-3xl font-serif font-black italic text-primary mb-4">Application successfully sent!</h3>
                    <p className="text-primary/60 font-medium italic">We will update you on your application status through email.</p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-8">
                    {error && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-center text-xs font-bold uppercase tracking-widest"
                      >
                        {error}
                      </motion.div>
                    )}

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-primary/40 ml-4">First Name</label>
                        <div className="relative">
                          <User className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/30" />
                          <input
                            type="text"
                            required
                            name="firstname"
                            value={formData.firstname}
                            onChange={handleInputChange}
                            placeholder="John"
                            className="w-full bg-secondary pl-14 pr-6 py-4 rounded-2xl border-none focus:ring-2 focus:ring-primary/10 transition-all font-medium text-sm"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-primary/40 ml-4">Last Name</label>
                        <div className="relative">
                          <User className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/30" />
                          <input
                            type="text"
                            required
                            name="lastname"
                            value={formData.lastname}
                            onChange={handleInputChange}
                            placeholder="Doe"
                            className="w-full bg-secondary pl-14 pr-6 py-4 rounded-2xl border-none focus:ring-2 focus:ring-primary/10 transition-all font-medium text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-primary/40 ml-4">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/30" />
                        <input
                          type="email"
                          required
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="your@email.com"
                          className="w-full bg-secondary pl-14 pr-6 py-4 rounded-2xl border-none focus:ring-2 focus:ring-primary/10 transition-all font-medium text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-primary/40 ml-4">Address</label>
                      <div className="relative">
                        <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/30" />
                        <input
                          type="text"
                          required
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          placeholder="Complete Address"
                          className="w-full bg-secondary pl-14 pr-6 py-4 rounded-2xl border-none focus:ring-2 focus:ring-primary/10 transition-all font-medium text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-primary/40 ml-4">Contact Number</label>
                        <div className="relative">
                          <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/30" />
                          <input
                            type="tel"
                            required
                            name="contactno"
                            value={formData.contactno}
                            onChange={handleInputChange}
                            placeholder="0917 XXX XXXX"
                            className="w-full bg-secondary pl-14 pr-6 py-4 rounded-2xl border-none focus:ring-2 focus:ring-primary/10 transition-all font-medium text-sm"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-primary/40 ml-4">Gender</label>
                        <select
                          name="gender"
                          value={formData.gender}
                          onChange={handleInputChange}
                          className="w-full bg-secondary px-6 py-4 rounded-2xl border-none focus:ring-2 focus:ring-primary/10 transition-all font-medium text-sm appearance-none"
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>

                    {/* Identification Section */}
                    <div className="space-y-4 pt-4">
                      <div className="flex items-center justify-between ml-4">
                        <label className="text-xs font-black uppercase tracking-widest text-primary/40">Identification Document (Mandatory)</label>
                        {idPreview && (
                          <span className="text-[10px] font-black uppercase tracking-widest text-accent flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Document Attached
                          </span>
                        )}
                      </div>
                      
                      <div className="aspect-video bg-secondary rounded-3xl overflow-hidden border-2 border-dashed border-primary/10 relative flex items-center justify-center">
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
                                  className="bg-primary text-white p-4 rounded-full shadow-xl hover:scale-110 transition-transform"
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
                                className="absolute top-4 right-4 bg-white shadow-lg text-red-500 p-2 rounded-xl"
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
                              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/5 shadow-sm">
                                <ImageIcon className="w-8 h-8 text-primary/20" />
                              </div>
                              <p className="text-xs font-bold uppercase tracking-widest text-primary/30">Attach Government-issued ID</p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <canvas ref={canvasRef} className="hidden" />
                      </div>

                      {!isCapturing && (
                        <div className="grid grid-cols-2 gap-4">
                          <button 
                            type="button"
                            onClick={startCamera}
                            className="bg-white border border-primary/10 py-4 rounded-2xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest text-primary hover:bg-secondary transition-all"
                          >
                            <Camera className="w-4 h-4" />
                            Capture
                          </button>
                          <label className="bg-white border border-primary/10 py-4 rounded-2xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest text-primary hover:bg-secondary cursor-pointer transition-all">
                            <Upload className="w-4 h-4" />
                            Upload
                            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                          </label>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-5 bg-primary text-white rounded-2xl font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          Submit Application
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}

