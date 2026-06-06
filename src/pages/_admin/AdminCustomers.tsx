import { useEffect, useState } from 'react';
import { collection, query, getDocs, orderBy, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { handleFirestoreError, OperationType } from '../../lib/firestore-errors';
import { Loader2, Search, X, CheckCircle2, AlertTriangle, Trash2, Mail, Phone, MapPin, Calendar, User, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'deactivate' | 'activate'; id: string } | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'customers'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedCustomers = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCustomers(fetchedCustomers);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'customers');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateVerified = async (customerId: string, currentStatus: boolean) => {
    if (!auth.currentUser) return;
    setIsSaving(true);
    try {
      const newVerified = !currentStatus;
      await updateDoc(doc(db, 'customers', customerId), {
        verified: newVerified,
        verifiedBy: auth.currentUser.uid,
        verifiedAt: serverTimestamp()
      });
      
      // Update local state
      setCustomers(prev => prev.map(c => 
        c.id === customerId 
          ? { ...c, verified: newVerified, verifiedBy: auth.currentUser?.uid, verifiedAt: new Date() } 
          : c
      ));
      
      // Close modal to return to customer list
      setSelectedCustomer(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `customers/${customerId}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (!auth.currentUser) return;
    
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'customers', customerId), {
        status: false,
        deletedBy: auth.currentUser.uid,
        deletedAt: serverTimestamp()
      });
      
      // Update local state
      setCustomers(prev => prev.map(c => 
        c.id === customerId 
          ? { ...c, status: false } 
          : c
      ));
      
      setSelectedCustomer(null);
      setConfirmAction(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `customers/${customerId}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleActivateCustomer = async (customerId: string) => {
    if (!auth.currentUser) return;
    
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'customers', customerId), {
        status: true,
        activatedBy: auth.currentUser.uid,
        activatedAt: serverTimestamp()
      });
      
      // Update local state
      setCustomers(prev => prev.map(c => 
        c.id === customerId 
          ? { ...c, status: true } 
          : c
      ));
      
      setSelectedCustomer(null);
      setConfirmAction(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `customers/${customerId}`);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredCustomers = customers.filter(customer => 
    `${customer.name || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.contactno?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-900">Customers</h1>
          <p className="mt-1 text-gray-500">Manage all registered customers</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search customers by name, email, or contact number..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-gray-500 text-sm border-b border-gray-100">
                <th className="font-medium px-6 py-4">Name</th>
                <th className="font-medium px-6 py-4">Email</th>
                <th className="font-medium px-6 py-4">Contact No.</th>
                <th className="font-medium px-6 py-4">Address</th>
                <th className="font-medium px-6 py-4">Joined</th>
                <th className="font-medium px-6 py-4">Onboarding</th>
                <th className="font-medium px-6 py-4">Verified</th>
                <th className="font-medium px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-2" />
                    <p>Loading customers...</p>
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No customers found.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(customer => (
                  <tr key={customer.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button 
                        onClick={() => setSelectedCustomer(customer)}
                        className="flex items-center gap-3 hover:opacity-70 transition-opacity text-left"
                      >
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                          {customer.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="font-medium text-gray-900 border-b border-transparent hover:border-primary">
                          {customer.name || 'Unknown User'}
                        </div>
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {customer.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {customer.contactno || '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-600 max-w-xs truncate">
                      {Array.isArray(customer.address) 
                        ? customer.address.join(', ') 
                        : (customer.address || '-')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
                      {customer.createdAt?.toDate ? customer.createdAt.toDate().toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {customer.onboarding ? (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          Completed
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {customer.verified ? (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          Verified
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                          Unverified
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {customer.status === true || customer.status === 'active' ? (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          Active
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          Deactivated
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Modal */}
      <AnimatePresence>
        {selectedCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCustomer(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-60 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-xl italic font-serif">
                    {selectedCustomer.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h2 className="text-2xl font-serif font-black italic text-gray-900">{selectedCustomer.name || 'User Details'}</h2>
                    <p className="text-primary/60 font-medium italic text-sm">Customer Profile</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedCustomer(null)}
                  className="p-3 hover:bg-white rounded-full transition-colors shadow-sm"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto flex-1 space-y-8">
                {/* Status Pills */}
                <div className="flex flex-wrap gap-3">
                  {selectedCustomer.verified ? (
                    <span className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-blue-50 text-blue-600 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" /> Verified
                    </span>
                  ) : (
                    <span className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-yellow-50 text-yellow-600 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> Pending Verification
                    </span>
                  )}
                  {selectedCustomer.status === true || selectedCustomer.status === 'active' ? (
                    <span className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-green-50 text-green-600 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-600 animate-pulse" /> Active
                    </span>
                  ) : (
                    <span className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-gray-100 text-gray-600 flex items-center gap-2">
                      Deactivated
                    </span>
                  )}
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 gap-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-secondary rounded-2xl">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Email Address</p>
                      <p className="font-bold text-gray-900">{selectedCustomer.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-secondary rounded-2xl">
                      <Phone className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Contact Number</p>
                      <p className="font-bold text-gray-900">{selectedCustomer.contactno || 'Not provided'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-secondary rounded-2xl">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Service Address</p>
                      <div className="font-bold text-gray-900 leading-relaxed">
                        {Array.isArray(selectedCustomer.address) ? (
                          selectedCustomer.address.map((addr: string, i: number) => (
                            <div key={i}>{addr}</div>
                          ))
                        ) : (
                          selectedCustomer.address || 'Not provided'
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-secondary rounded-2xl">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Registration Date</p>
                      <p className="font-bold text-gray-900">
                        {selectedCustomer.createdAt?.toDate 
                          ? selectedCustomer.createdAt.toDate().toLocaleString() 
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ID Preview if any */}
                {selectedCustomer.identification && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Government Identification</p>
                    <div className="aspect-video bg-secondary rounded-3xl overflow-hidden border border-gray-100">
                      <img 
                        src={selectedCustomer.identification} 
                        alt="Customer ID" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-6 border-t border-gray-100 flex flex-col gap-4">
                  {confirmAction ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-6 rounded-3xl border-2 ${confirmAction.type === 'deactivate' ? 'border-red-100 bg-red-50/50' : 'border-green-100 bg-green-50/50'} space-y-4`}
                    >
                      <p className={`text-sm font-bold text-center ${confirmAction.type === 'deactivate' ? 'text-red-700' : 'text-green-700'}`}>
                        Are you sure you want to {confirmAction.type} this account?
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setConfirmAction(null)}
                          disabled={isSaving}
                          className="py-3 rounded-2xl bg-white text-gray-600 text-xs font-black uppercase tracking-widest border border-gray-200 hover:bg-gray-50 transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => confirmAction.type === 'deactivate' ? handleDeleteCustomer(confirmAction.id) : handleActivateCustomer(confirmAction.id)}
                          disabled={isSaving}
                          className={`py-3 rounded-2xl text-white text-xs font-black uppercase tracking-widest shadow-sm transition-all flex items-center justify-center ${
                            confirmAction.type === 'deactivate' ? 'bg-red-500 hover:bg-red-600 shadow-red-200' : 'bg-green-500 hover:bg-green-600 shadow-green-200'
                          }`}
                        >
                          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : `Yes, ${confirmAction.type}`}
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between bg-gray-50 p-4 rounded-3xl">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className={`w-5 h-5 ${selectedCustomer.verified ? 'text-blue-500' : 'text-gray-300'}`} />
                          <span className="text-sm font-bold text-gray-700">Verification Status</span>
                        </div>
                        <button
                          onClick={() => handleUpdateVerified(selectedCustomer.id, selectedCustomer.verified)}
                          disabled={isSaving}
                          className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                            selectedCustomer.verified 
                              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                              : 'bg-primary text-white hover:bg-primary-dark shadow-sm'
                          }`}
                        >
                          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : (selectedCustomer.verified ? 'Unverify' : 'Verify Now')}
                        </button>
                      </div>

                      {selectedCustomer.status !== false ? (
                        <button
                          onClick={() => setConfirmAction({ type: 'deactivate', id: selectedCustomer.id })}
                          disabled={isSaving}
                          className="w-full py-4 rounded-3xl border-2 border-red-50 text-red-500 flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest hover:bg-red-50 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                          Deactivate Account
                        </button>
                      ) : (
                        <button
                          onClick={() => setConfirmAction({ type: 'activate', id: selectedCustomer.id })}
                          disabled={isSaving}
                          className="w-full py-4 rounded-3xl border-2 border-green-50 text-green-500 flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest hover:bg-green-50 transition-all"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Activate Account
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

