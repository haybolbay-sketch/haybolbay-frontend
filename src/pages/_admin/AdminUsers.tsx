import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, orderBy, doc, updateDoc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { handleFirestoreError, OperationType } from '../../lib/firestore-errors';
import { Loader2, Search, X, CheckCircle2, AlertTriangle, Trash2, Mail, Phone, Calendar, Shield, ShieldAlert, ShieldCheck, UserPlus, Lock, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [currentUserData, setCurrentUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'deactivate' | 'activate'; id: string } | null>(null);

  // New User Form State
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    type: 'admin' as 'admin' | 'superadmin',
    contactno: ''
  });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const init = async () => {
      if (auth.currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'admin', auth.currentUser.uid));
          if (userDoc.exists()) {
            setCurrentUserData(userDoc.data());
          }
        } catch (error) {
          console.error("Error fetching current admin data:", error);
        }
      }
      fetchUsers();
    };
    init();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'admin'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedUsers = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(fetchedUsers);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'admin');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!auth.currentUser || currentUserData?.type !== 'superadmin') return;
    
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'admin', userId), {
        status: false,
        deletedBy: auth.currentUser.uid,
        deletedAt: serverTimestamp()
      });
      
      // Update local state
      setUsers(prev => prev.map(u => 
        u.id === userId 
          ? { ...u, status: false } 
          : u
      ));
      
      setSelectedUser(null);
      setConfirmAction(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `admin/${userId}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleActivateUser = async (userId: string) => {
    if (!auth.currentUser || currentUserData?.type !== 'superadmin') return;
    
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'admin', userId), {
        status: true,
        activatedBy: auth.currentUser.uid,
        activatedAt: serverTimestamp()
      });
      
      // Update local state
      setUsers(prev => prev.map(u => 
        u.id === userId 
          ? { ...u, status: true } 
          : u
      ));
      
      setSelectedUser(null);
      setConfirmAction(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `admin/${userId}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || currentUserData?.type !== 'superadmin') {
      setFormError('Only superadmins can add new members.');
      return;
    }
    setFormError('');

    if (!newUser.name || !newUser.email || !newUser.password) {
      setFormError('Please fill in all required fields.');
      return;
    }

    setIsSaving(true);
    
    try {
      // Create User Profile in Firestore without Firebase Auth
      // We'll generate a random ID for the document
      const newAdminRef = doc(collection(db, 'admin'));
      const uid = newAdminRef.id;

      const adminData = {
        name: newUser.name,
        email: newUser.email,
        password: newUser.password, // Stored as plain text per requested flow
        contactno: newUser.contactno,
        type: newUser.type,
        status: true,
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser.uid
      };

      await setDoc(newAdminRef, adminData);

      // Update local state
      setUsers(prev => [{ id: uid, ...adminData }, ...prev]);
      
      // Reset form and close modal
      setIsAddingUser(false);
      setNewUser({
        name: '',
        email: '',
        password: '',
        type: 'admin',
        contactno: ''
      });
    } catch (error: any) {
      console.error(error);
      setFormError(error.message || 'Failed to register admin account.');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredUsers = users.filter(user => 
    `${user.name || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-gray-500 font-medium animate-pulse italic font-serif">Retrieving Admin Team...</p>
      </div>
    );
  }

  if (currentUserData && currentUserData.type !== 'superadmin') {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-6 bg-white p-12 rounded-[2.5rem] shadow-sm border border-gray-100 max-w-2xl mx-auto mt-12">
        <div className="p-6 bg-red-50 rounded-full">
          <ShieldAlert className="w-16 h-16 text-red-500" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-serif font-black italic text-gray-900">Access Restricted</h2>
          <p className="text-gray-500 font-medium text-lg italic">
            "Only the chosen few may enter this chamber."
          </p>
        </div>
        <p className="text-gray-400 text-center text-sm font-medium leading-relaxed">
          You do not have the required <strong>Super Admin</strong> status to access this page. Please contact your system administrator if you believe this is an error.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-900">Admin Team</h1>
          <p className="mt-1 text-gray-500">Manage all registered administrators</p>
        </div>
        {currentUserData?.type === 'superadmin' && (
          <button
            onClick={() => setIsAddingUser(true)}
            className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
          >
            <UserPlus className="w-5 h-5" />
            Add Admin Member
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
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
                <th className="font-medium px-6 py-4">Role</th>
                <th className="font-medium px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button 
                      onClick={() => setSelectedUser(user)}
                      className="flex items-center gap-3 hover:opacity-70 transition-opacity text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {user.name?.[0]?.toUpperCase() || 'A'}
                      </div>
                      <div className="font-medium text-gray-900 border-b border-transparent hover:border-primary">
                        {user.name || 'Unknown User'}
                      </div>
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      user.type === 'superadmin' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {user.type || 'admin'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.status === true || user.status === 'active' ? (
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin User Detail Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUser(null)}
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
                    {selectedUser.name?.[0]?.toUpperCase() || 'A'}
                  </div>
                  <div>
                    <h2 className="text-2xl font-serif font-black italic text-gray-900">{selectedUser.name || 'Admin Details'}</h2>
                    <p className="text-primary/60 font-medium italic text-sm">Administrator Profile</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="p-3 hover:bg-white rounded-full transition-colors shadow-sm"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto flex-1 space-y-8">
                {/* Status Pills */}
                <div className="flex flex-wrap gap-3">
                  <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 ${
                    selectedUser.type === 'superadmin' ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-50 text-gray-600'
                  }`}>
                    {selectedUser.type === 'superadmin' ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                    {selectedUser.type || 'Admin'}
                  </span>
                  
                  {selectedUser.status === true ? (
                    <span className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-green-50 text-green-600 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-600 animate-pulse" /> Active
                    </span>
                  ) : (
                    <span className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-gray-100 text-gray-600 flex items-center gap-2">
                      Deactivated Account
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
                      <p className="font-bold text-gray-900">{selectedUser.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-secondary rounded-2xl">
                      <Phone className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Contact Number</p>
                      <p className="font-bold text-gray-900">{selectedUser.contactno || 'Not provided'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-secondary rounded-2xl">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Registration Date</p>
                      <p className="font-bold text-gray-900">
                        {selectedUser.createdAt?.toDate 
                          ? selectedUser.createdAt.toDate().toLocaleString() 
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-6 border-t border-gray-100 flex flex-col gap-4">
                  {currentUserData?.type === 'superadmin' ? (
                    confirmAction ? (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-6 rounded-3xl border-2 ${confirmAction.type === 'deactivate' ? 'border-red-100 bg-red-50/50' : 'border-green-100 bg-green-50/50'} space-y-4`}
                      >
                        <p className={`text-sm font-bold text-center ${confirmAction.type === 'deactivate' ? 'text-red-700' : 'text-green-700'}`}>
                          Are you sure you want to {confirmAction.type} this admin account?
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
                            onClick={() => confirmAction.type === 'deactivate' ? handleDeleteUser(confirmAction.id) : handleActivateUser(confirmAction.id)}
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
                        {selectedUser.status !== false ? (
                          <button
                            onClick={() => setConfirmAction({ type: 'deactivate', id: selectedUser.id })}
                            disabled={isSaving || (auth.currentUser?.uid === selectedUser.id)}
                            className={`w-full py-4 rounded-3xl border-2 border-red-50 text-red-500 flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest hover:bg-red-50 transition-all ${
                              auth.currentUser?.uid === selectedUser.id ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            <Trash2 className="w-4 h-4" />
                            {auth.currentUser?.uid === selectedUser.id ? 'Cannot Deactivate Self' : 'Deactivate Account'}
                          </button>
                        ) : (
                          <button
                            onClick={() => setConfirmAction({ type: 'activate', id: selectedUser.id })}
                            disabled={isSaving}
                            className="w-full py-4 rounded-3xl border-2 border-green-50 text-green-500 flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest hover:bg-green-50 transition-all"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Activate Account
                          </button>
                        )}
                      </>
                    )
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        Administrative access required to modify members
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add User Modal */}
      <AnimatePresence>
        {isAddingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingUser(false)}
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
                  <div className="w-12 h-12 rounded-2xl bg-primary shadow-lg shadow-primary/20 flex items-center justify-center text-white">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-serif font-bold text-gray-900">Add New Admin</h2>
                    <p className="text-gray-500 text-sm font-medium">Create a new administrator account</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsAddingUser(false)}
                  className="p-2 hover:bg-white rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleAddUser} className="p-8 space-y-6 overflow-y-auto flex-1">
                {formError && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-600 text-sm animate-shake">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <p className="font-medium">{formError}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input 
                        type="text"
                        required
                        value={newUser.name}
                        onChange={e => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g. John Doe"
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input 
                        type="email"
                        required
                        value={newUser.email}
                        onChange={e => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="john@example.com"
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input 
                        type="password"
                        required
                        minLength={6}
                        value={newUser.password}
                        onChange={e => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="••••••••"
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Phone Number (Optional)</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input 
                        type="tel"
                        value={newUser.contactno}
                        onChange={e => setNewUser(prev => ({ ...prev, contactno: e.target.value }))}
                        placeholder="0912 345 6789"
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Role Type</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setNewUser(prev => ({ ...prev, type: 'admin' }))}
                        className={`py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${
                          newUser.type === 'admin' 
                            ? 'bg-primary/10 text-primary border-2 border-primary shadow-sm' 
                            : 'bg-gray-50 text-gray-400 border-2 border-transparent hover:bg-gray-100'
                        }`}
                      >
                        <Shield className="w-5 h-5" />
                        Staff Admin
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewUser(prev => ({ ...prev, type: 'superadmin' }))}
                        className={`py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${
                          newUser.type === 'superadmin' 
                            ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-200 shadow-sm' 
                            : 'bg-gray-50 text-gray-400 border-2 border-transparent hover:bg-gray-100'
                        }`}
                      >
                        <ShieldAlert className="w-5 h-5" />
                        Super Admin
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsAddingUser(false)}
                    className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all flex items-center justify-center"
                  >
                    {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Save Member'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
