import { useEffect, useState } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { handleFirestoreError, OperationType } from '../../lib/firestore-errors';
import { Users, UserCheck, CalendarCheck, Clock, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    customers: 0,
    cleaners: 0,
    bookingRequests: 0,
    bookingAccepted: 0,
    completedBookings: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const usersSnap = await getDocs(collection(db, 'customers'));
        const cleanersSnap = await getDocs(collection(db, 'cleaners'));
        const bookingsSnap = await getDocs(collection(db, 'bookings'));
        
        let pending = 0;
        let accepted = 0;
        let completed = 0;
        
        const now = new Date();
        
        bookingsSnap.docs.forEach(doc => {
          const booking = doc.data();
          
          if (booking.status === 'request') {
            try {
              // Try to parse date and time
              // Assuming date is YYYY-MM-DD and time is HH:mm
              const bookingDateTime = new Date(`${booking.date} ${booking.time}`);
              if (bookingDateTime > now) {
                pending++;
              }
            } catch (e) {
              // If parsing fails, just count as request if it has no date/time yet (unlikely)
              pending++;
            }
          } else if (booking.status === 'confirmed') {
            accepted++;
          } else if (booking.status === 'completed') {
            completed++;
          }
        });
        
        setStats({
          customers: usersSnap.size,
          cleaners: cleanersSnap.size,
          bookingRequests: pending,
          bookingAccepted: accepted,
          completedBookings: completed,
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'admin/dashboard/stats');
      } finally {
        setLoading(false);
      }
    }
    
    fetchStats();
  }, []);

  const statCards = [
    { title: 'Total Customers', value: stats.customers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100', link: '/admin/customers' },
    { title: 'Total Cleaners', value: stats.cleaners, icon: UserCheck, color: 'text-green-600', bg: 'bg-green-100', link: '/admin/cleaners' },
    { title: 'Booking Request', value: stats.bookingRequests, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100', link: '/admin/bookings' },
    { title: 'Booking Accepted', value: stats.bookingAccepted, icon: CalendarCheck, color: 'text-indigo-600', bg: 'bg-indigo-100', link: '/admin/bookings' },
    { title: 'Completed', value: stats.completedBookings, icon: CheckCircle2, color: 'text-primary', bg: 'bg-primary/20', link: '/admin/bookings' },
  ];

  if (loading) {
    return <div className="animate-pulse space-y-6">
      <div className="h-8 bg-gray-200 rounded w-1/4"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1,2,3,4,5].map(i => <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>)}
      </div>
    </div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-serif font-bold text-gray-900">Dashboard Overview</h1>
        <p className="mt-2 text-gray-500">Welcome to the Haybolbay administration portal.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Link key={i} to={stat.link} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between">
                <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="p-2 -mr-2 -mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowUpRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</h3>
              </div>
            </Link>
          );
        })}
      </div>
      
      {/* Additional dashboard widgets like recent activity can go here */}
      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
        <h3 className="text-xl font-bold font-serif mb-4">Under Construction</h3>
        <p className="text-gray-500">More widgets coming soon.</p>
      </div>
    </div>
  );
}
