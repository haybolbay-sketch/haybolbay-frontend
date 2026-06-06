import { useEffect, useState } from 'react';
import { collection, query, getDocs, orderBy, getDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { handleFirestoreError, OperationType } from '../../lib/firestore-errors';
import { Loader2, Search } from 'lucide-react';

export default function AdminBookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchBookings() {
      try {
        const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const fetchedBookings = await Promise.all(querySnapshot.docs.map(async (bookingDoc) => {
          const data = bookingDoc.data();
          const userId = data.customerId;
          
          let customerName = 'Unknown';
          let customerEmail = '';
          
          if (userId) {
            const userSnap = await getDoc(doc(db, 'customers', userId));
            if (userSnap.exists()) {
              const userData = userSnap.data();
              customerName = userData.name || `${userData.firstname || ''} ${userData.lastname || ''}`.trim() || 'Unknown';
              customerEmail = userData.email || '';
            }
          }

          let cleanerName = 'Not assigned';
          if (data.cleanerId) {
            const cleanerSnap = await getDoc(doc(db, 'cleaners', data.cleanerId));
            if (cleanerSnap.exists()) {
              const cleanerData = cleanerSnap.data();
              cleanerName = cleanerData.name || `${cleanerData.firstname || ''} ${cleanerData.lastname || ''}`.trim() || 'Unknown';
            }
          }

          return {
            id: bookingDoc.id,
            path: bookingDoc.ref.path,
            ...data,
            customerName,
            customerEmail,
            cleanerName
          };
        }));
        
        setBookings(fetchedBookings);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'bookings');
      } finally {
        setLoading(false);
      }
    }
    
    fetchBookings();
  }, []);

  const filteredBookings = bookings.filter(booking => 
    booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (booking.notes && booking.notes.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'confirmed': return 'bg-blue-100 text-blue-700';
      case 'request': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-900">Bookings</h1>
          <p className="mt-1 text-gray-500">Manage all customer bookings</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search by customer name, email, or notes..." 
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
                <th className="font-medium px-6 py-4">Customer</th>
                <th className="font-medium px-6 py-4">Date & Time</th>
                <th className="font-medium px-6 py-4">Status</th>
                <th className="font-medium px-6 py-4">Cleaner</th>
                <th className="font-medium px-6 py-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-2" />
                    <p>Loading bookings...</p>
                  </td>
                </tr>
              ) : filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No bookings found.
                  </td>
                </tr>
              ) : (
                filteredBookings.map(booking => (
                  <tr key={booking.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{booking.customerName}</span>
                        <span className="text-sm text-gray-500">{booking.customerEmail}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{booking.date}</span>
                        <span className="text-sm text-gray-500">{booking.time}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(booking.status)}`}>
                        {booking.status || 'unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {booking.cleanerName}
                    </td>
                    <td className="px-6 py-4 text-gray-600 max-w-[200px] truncate">
                      {booking.notes || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
