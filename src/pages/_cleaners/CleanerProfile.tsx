import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Loader2, 
  CheckCircle2,
  Camera,
  ArrowRight,
  Shield,
  Sparkles,
  Image as ImageIcon,
  Upload,
  X
} from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { handleFirestoreError, OperationType } from '../../lib/firestore-errors';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../lib/firebase';
import { AnimatePresence } from 'motion/react';

export default function CleanerProfile() {
  const { user } = useAuth();
  const [cleanerData, setCleanerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    address: '',
    contactno: '',
    gender: 'male'
  });

  // ID states
  const [idPreview, setIdPreview] = useState<string | null>(null);
  const [idFile, setIdFile] = useState<File | Blob | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(doc(db, 'cleaners', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCleanerData(data);
        setFormData({
          firstname: data.firstname || '',
          lastname: data.lastname || '',
          address: data.address || '',
          contactno: data.contactno || '',
          gender: data.gender || 'male'
        });
        if (data.identification) {
          setIdPreview(data.identification);
        }
      }
      setLoading(false);
    }, (error) => {
      setLoading(false);
      handleFirestoreError(error, OperationType.GET, `cleaners/${user.uid}`);
    });

    return () => unsubscribe();
  }, [user]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCapturing(true);
      }
    } catch (err) {
      console.error("Camera error:", err);
      setMessage({ type: 'error', text: 'Unable to access camera. Please check permissions.' });
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
      // Reset input value so it triggers again if same file selected
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      let identificationUrl = cleanData(cleanerData?.identification);
      
      // Upload new ID if changed
      if (idFile) {
        const fileExt = idFile instanceof File ? idFile.name.split('.').pop() : 'jpg';
        const storageRef = ref(storage, `cleaners/${user.uid}/identification_${Date.now()}.${fileExt}`);
        const snapshot = await uploadBytes(storageRef, idFile);
        identificationUrl = await getDownloadURL(snapshot.ref);
      }

      await updateDoc(doc(db, 'cleaners', user.uid), {
        ...formData,
        identification: identificationUrl,
        updatedAt: new Date()
      });
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIdFile(null); // Reset file after successful upload
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `cleaners/${user.uid}`);
    } finally {
      setSaving(false);
    }
  };

  const cleanData = (data: any) => data || null;

  if (loading) return null;

  return (
    <div className="min-h-screen bg-secondary">
      <Header />
      
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-serif font-black italic text-primary mb-4">
              Manage <span className="text-accent underline decoration-4 underline-offset-4">Profile</span>
            </h1>
            <p className="text-primary/60 font-medium italic">Keep your professional cleaner profile up to date.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Profile Sidebar */}
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-[40px] border border-primary/5 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-24 bg-primary/5"></div>
                <div className="relative z-10">
                  <div className="w-32 h-32 bg-secondary rounded-[40px] mx-auto mb-6 flex items-center justify-center relative group">
                    <User className="w-16 h-16 text-primary/20" />
                    <button className="absolute inset-0 bg-primary/40 text-white rounded-[40px] opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                      <Camera className="w-6 h-6" />
                    </button>
                  </div>
                  <h3 className="text-xl font-serif font-black italic text-primary">
                    {cleanerData?.firstname} {cleanerData?.lastname}
                  </h3>
                  <p className="text-primary/40 text-[10px] font-black uppercase tracking-widest mt-1">Professional Crew</p>
                  
                  <div className="mt-6 flex items-center justify-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-full text-xs font-bold">
                    <Shield className="w-4 h-4" />
                    {cleanerData?.verified ? 'Verified Expert' : 'Verification Pending'}
                  </div>
                </div>
              </div>

              <div className="bg-primary text-white p-8 rounded-[40px] shadow-2xl shadow-primary/20">
                <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-6 opacity-40">Pro Tips</h4>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <Sparkles className="w-4 h-4 text-accent shrink-0" />
                    <p className="text-xs italic leading-relaxed text-white/60">A complete profile increases your chances of getting approved faster.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Edit Form */}
            <div className="md:col-span-2">
              <form onSubmit={handleSubmit} className="bg-white p-8 md:p-12 rounded-[40px] border border-primary/5 shadow-xl shadow-primary/5 space-y-8">
                {message.text && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-2xl text-sm font-bold italic flex items-center gap-3 ${
                      message.type === 'success' ? 'bg-accent/10 text-accent' : 'bg-red-50 text-red-500'
                    }`}
                  >
                    {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                    {message.text}
                  </motion.div>
                )}

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 ml-4">First Name</label>
                    <div className="relative">
                      <User className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/20" />
                      <input
                        type="text"
                        required
                        value={formData.firstname}
                        onChange={(e) => setFormData({...formData, firstname: e.target.value})}
                        className="w-full bg-secondary pl-14 pr-6 py-4 rounded-2xl border-none focus:ring-2 focus:ring-primary/10 transition-all font-medium text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 ml-4">Last Name</label>
                    <div className="relative">
                      <User className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/20" />
                      <input
                        type="text"
                        required
                        value={formData.lastname}
                        onChange={(e) => setFormData({...formData, lastname: e.target.value})}
                        className="w-full bg-secondary pl-14 pr-6 py-4 rounded-2xl border-none focus:ring-2 focus:ring-primary/10 transition-all font-medium text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 ml-4">Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/20" />
                    <input
                      type="text"
                      required
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      className="w-full bg-secondary pl-14 pr-6 py-4 rounded-2xl border-none focus:ring-2 focus:ring-primary/10 transition-all font-medium text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 ml-4">Contact Number</label>
                    <div className="relative">
                      <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/20" />
                      <input
                        type="tel"
                        required
                        value={formData.contactno}
                        onChange={(e) => setFormData({...formData, contactno: e.target.value})}
                        className="w-full bg-secondary pl-14 pr-6 py-4 rounded-2xl border-none focus:ring-2 focus:ring-primary/10 transition-all font-medium text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 ml-4">Gender</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({...formData, gender: e.target.value})}
                      className="w-full bg-secondary px-6 py-4 rounded-2xl border-none focus:ring-2 focus:ring-primary/10 transition-all font-medium text-sm appearance-none cursor-pointer"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Identification Section */}
                <div className="space-y-6 pt-6 border-t border-primary/5">
                  <div className="flex items-center justify-between ml-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-primary/40">Registered Identification Document</label>
                    {idPreview && idPreview !== cleanerData?.identification && (
                      <span className="text-[10px] font-black uppercase tracking-widest text-accent flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        New Image Ready
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
                          <img src={idPreview} alt="ID Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <button 
                            type="button"
                            onClick={() => { setIdPreview(cleanerData?.identification || null); setIdFile(null); }}
                            className="absolute top-4 right-4 bg-white shadow-lg text-red-500 p-2 rounded-xl hover:bg-red-50 transition-colors"
                            title="Revert Change"
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
                        className="bg-secondary border border-primary/5 py-4 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 transition-all"
                      >
                        <Camera className="w-4 h-4" />
                        Re-capture
                      </button>
                      <label className="bg-secondary border border-primary/5 py-4 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 cursor-pointer transition-all">
                        <Upload className="w-4 h-4" />
                        Upload New
                        <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                      </label>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-5 bg-primary text-white rounded-2xl font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Save Profile
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
