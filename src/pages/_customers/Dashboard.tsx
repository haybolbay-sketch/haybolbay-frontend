import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { motion } from 'motion/react';
import { LayoutDashboard, Calendar, History, Star, ArrowRight, Clock, MapPin } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Link } from 'react-router-dom';
import { handleFirestoreError, OperationType } from '../../lib/firestore-errors';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'bookings'),
      where('customerId', '==', user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bks = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => {
          const dateA = a.createdAt?.toDate?.() || new Date(0);
          const dateB = b.createdAt?.toDate?.() || new Date(0);
          return dateB.getTime() - dateA.getTime();
        });
      setBookings(bks);
      setLoading(false);
    }, (error) => {
      setLoading(false);
      if (user) {
        handleFirestoreError(error, OperationType.LIST, 'bookings');
      }
    });

    return () => unsubscribe();
  }, [user]);

  const upcomingBookings = bookings.filter(b => b.status === 'request' || b.status === 'confirmed');
  const completedBookings = bookings.filter(b => b.status === 'completed');

  return (
    <div className="min-h-screen bg-secondary">
      <Header />
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12"
          >
            <div>
              <h1 className="text-4xl md:text-5xl font-serif italic mb-2">Welcome back, {profile?.name}</h1>
              <p className="text-neutral-500 italic">Manage your cleanings and property maintenance from your command center.</p>
            </div>
            <Link 
              to="/book"
              className="bg-primary text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-primary/20"
            >
              Book New Cleaning <Calendar className="w-5 h-5" />
            </Link>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white p-8 rounded-[32px] shadow-sm flex items-center gap-6">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                <Calendar className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">{upcomingBookings.length}</p>
                <p className="text-xs uppercase tracking-widest font-bold text-neutral-400">Upcoming Bookings</p>
              </div>
            </div>
            <div className="bg-white p-8 rounded-[32px] shadow-sm flex items-center gap-6">
              <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center">
                <History className="w-8 h-8 text-accent" />
              </div>
              <div>
                <p className="text-3xl font-bold text-accent">{completedBookings.length}</p>
                <p className="text-xs uppercase tracking-widest font-bold text-neutral-400">Cleanings Completed</p>
              </div>
            </div>
            <div className="bg-white p-8 rounded-[32px] shadow-sm flex items-center gap-6">
              <div className="w-16 h-16 bg-yellow-50 rounded-2xl flex items-center justify-center">
                <Star className="w-8 h-8 text-yellow-500" />
              </div>
              <div>
                <p className="text-3xl font-bold text-yellow-600">5.0</p>
                <p className="text-xs uppercase tracking-widest font-bold text-neutral-400">Avg. Trust Rating</p>
              </div>
            </div>
          </div>

          {bookings.length > 0 ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-serif italic px-2">Recent Activity</h2>
              <div className="grid gap-4">
                {bookings.map((booking) => (
                  <motion.div 
                    key={booking.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white p-6 rounded-[32px] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-neutral-100 hover:border-primary/20 transition-colors"
                  >
                    <div className="flex items-center gap-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${booking.status === 'completed' ? 'bg-green-50 text-green-600' : 'bg-primary/5 text-primary'}`}>
                        <Clock className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-serif italic text-xl leading-none mb-2">{new Date(booking.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} at {booking.time}</p>
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-400">
                          <MapPin className="w-3 h-3" />
                          <span>{booking.customerAddress}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                      <span className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                        booking.status === 'completed' ? 'bg-green-100 text-green-700' : 
                        booking.status === 'confirmed' ? 'bg-blue-100 text-blue-700' : 
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {booking.status}
                      </span>
                      <button className="flex-1 md:flex-none bg-secondary p-3 rounded-xl hover:bg-neutral-100 transition-colors">
                        <ArrowRight className="w-5 h-5 text-neutral-400" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[40px] p-12 shadow-sm text-center">
              <LayoutDashboard className="w-20 h-20 text-neutral-100 mx-auto mb-6" />
              <h2 className="text-2xl font-serif italic mb-4">No activity yet</h2>
              <p className="text-neutral-500 mb-8 max-w-md mx-auto italic">Start by booking your first professional cleaning service. We'll handle the rest.</p>
              <Link 
                to="/book"
                className="inline-block bg-primary text-white px-8 py-4 rounded-2xl font-bold hover:scale-105 transition-all shadow-lg shadow-primary/20"
              >
                Book Your First Clean
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
