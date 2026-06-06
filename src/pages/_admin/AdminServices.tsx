import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  X, 
  Check, 
  Loader2, 
  AlertCircle,
  Clock,
  DollarSign,
  FileText,
  ListPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Service {
  id: string;
  type: string;
  duration: string;
  rate: number;
  description: string;
  inclusion: string[];
  createdAt: any;
}

export default function AdminServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    type: '',
    duration: '',
    rate: '',
    description: '',
    inclusion: ['']
  });

  useEffect(() => {
    const q = query(collection(db, 'services'), orderBy('rate', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const servicesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Service[];
      setServices(servicesList);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching services (AdminServices):", err);
      setError("Failed to load services.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddInclusion = () => {
    setFormData(prev => ({
      ...prev,
      inclusion: [...prev.inclusion, '']
    }));
  };

  const handleRemoveInclusion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      inclusion: prev.inclusion.filter((_, i) => i !== index)
    }));
  };

  const handleInclusionChange = (index: number, value: string) => {
    const newInclusions = [...formData.inclusion];
    newInclusions[index] = value;
    setFormData(prev => ({
      ...prev,
      inclusion: newInclusions
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const dataToSave = {
        type: formData.type,
        duration: formData.duration,
        rate: parseFloat(formData.rate),
        description: formData.description,
        inclusion: formData.inclusion.filter(i => i.trim() !== ''),
        updatedAt: new Date()
      };

      if (editingId) {
        await updateDoc(doc(db, 'services', editingId), dataToSave);
      } else {
        await addDoc(collection(db, 'services'), {
          ...dataToSave,
          createdAt: new Date()
        });
      }

      setIsAdding(false);
      setEditingId(null);
      setFormData({
        type: '',
        duration: '',
        rate: '',
        description: '',
        inclusion: ['']
      });
    } catch (err) {
      console.error("Error saving service:", err);
      setError("Failed to save service. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (service: Service) => {
    setFormData({
      type: service.type,
      duration: service.duration,
      rate: service.rate.toString(),
      description: service.description,
      inclusion: service.inclusion.length > 0 ? service.inclusion : ['']
    });
    setEditingId(service.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this service?")) return;

    try {
      await deleteDoc(doc(db, 'services', id));
    } catch (err) {
      console.error("Error deleting service:", err);
      setError("Failed to delete service.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-900 italic">Cleaning Packages</h1>
          <p className="text-gray-500 mt-1 italic">Manage your service offerings and pricing</p>
        </div>
        <button
          onClick={() => {
            setIsAdding(true);
            setEditingId(null);
            setFormData({
              type: '',
              duration: '',
              rate: '',
              description: '',
              inclusion: ['']
            });
          }}
          className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-bold hover:scale-105 transition-all shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
          Add Package
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Services List */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {services.map((service) => (
          <motion.div
            layout
            key={service.id}
            className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 relative group overflow-hidden"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-serif italic font-bold text-gray-900 mb-1">{service.type}</h3>
                <div className="flex items-center gap-2 text-primary font-bold">                  
                  <span className="text-2xl">₱{service.rate}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(service)}
                  className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(service.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-2 text-sm text-gray-500 italic">
                <Clock className="w-4 h-4" />
                <span>{service.duration}</span>
              </div>
              <p className="text-sm text-gray-600 line-clamp-3 italic leading-relaxed">
                {service.description}
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Inclusions</p>
              <div className="flex flex-wrap gap-2">
                {service.inclusion.map((item, idx) => (
                  <span key={idx} className="px-3 py-1 bg-gray-50 text-gray-600 text-[10px] font-bold rounded-lg border border-gray-100 italic">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {services.length === 0 && !isAdding && (
        <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-gray-200">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-serif italic text-gray-900 mb-2">No services yet</h3>
          <p className="text-gray-500 text-sm italic">Get started by creating your first cleaning package</p>
        </div>
      )}

      {/* Modal Form */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-12">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !saving && setIsAdding(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[60px] shadow-2xl overflow-hidden"
            >
              <div className="p-8 sm:p-12 max-h-[85vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-3xl font-serif font-bold italic text-gray-900">
                      {editingId ? 'Edit Package' : 'New Package'}
                    </h2>
                    <p className="text-gray-500 text-sm italic">Fill in the details for this service proposal</p>
                  </div>
                  <button
                    onClick={() => setIsAdding(false)}
                    disabled={saving}
                    className="p-3 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-[2rem] transition-all"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid sm:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 ml-4">Service Type</label>
                      <input
                        required
                        type="text"
                        value={formData.type}
                        onChange={e => setFormData(p => ({ ...p, type: e.target.value }))}
                        placeholder="e.g. Deep Cleaning"
                        className="w-full px-6 py-4 bg-gray-50 border-none rounded-3xl text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-300 italic"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 ml-4">Duration</label>
                      <input
                        required
                        type="text"
                        value={formData.duration}
                        onChange={e => setFormData(p => ({ ...p, duration: e.target.value }))}
                        placeholder="e.g. 3-4 Hours"
                        className="w-full px-6 py-4 bg-gray-50 border-none rounded-3xl text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-300 italic"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 ml-4">Rate (₱)</label>
                      <input
                        required
                        type="number"
                        step="0.01"
                        value={formData.rate}
                        onChange={e => setFormData(p => ({ ...p, rate: e.target.value }))}
                        placeholder="0.00"
                        className="w-full px-6 py-4 bg-gray-50 border-none rounded-3xl text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-300 italic"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 ml-4">Description</label>
                    <textarea
                      required
                      value={formData.description}
                      onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                      placeholder="Detailed explanation of the service..."
                      rows={4}
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-3xl text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-300 italic resize-none"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between ml-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-primary/40">Inclusions</label>
                      <button
                        type="button"
                        onClick={handleAddInclusion}
                        className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1 hover:underline"
                      >
                        <ListPlus className="w-3 h-3" />
                        Add Line
                      </button>
                    </div>
                    <div className="space-y-3">
                      {formData.inclusion.map((item, index) => (
                        <div key={index} className="flex gap-3">
                          <input
                            type="text"
                            value={item}
                            onChange={e => handleInclusionChange(index, e.target.value)}
                            placeholder={`Inclusion ${index + 1}`}
                            className="flex-1 px-6 py-3 bg-gray-50 border-none rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-300 italic"
                          />
                          {formData.inclusion.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveInclusion(index)}
                              className="p-3 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsAdding(false)}
                      disabled={saving}
                      className="flex-1 py-4 px-6 rounded-3xl border-2 border-gray-50 text-gray-400 font-bold text-sm hover:bg-gray-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-[2] py-4 px-6 bg-primary text-white rounded-3xl font-bold text-sm hover:scale-[1.02] transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      {editingId ? 'Update Package' : 'Publish Package'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
