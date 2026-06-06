import { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

interface Service {
  id: string;
  type: string;
  rate: number;
  description: string;
  inclusion: string[];
}

export default function Services() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

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
      console.error("Error fetching services (Services):", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <section id="pricing" className="py-24 px-6 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </section>
    );
  }

  // Fallback to static if none found (optional, but good for initial state)
  const displayServices = services.length > 0 ? services : [
    {
      id: "std",
      type: "Standard Clean",
      rate: 80,
      description: "Perfect for regular maintenance of your sanctuary.",
      inclusion: ["All surfaces dusted", "Vacuum & mop", "Kitchen & bathrooms", "Trash removal"]
    },
    {
      id: "deep",
      type: "Deep Clean",
      rate: 150,
      description: "A thorough seasonal reset for your home.",
      inclusion: ["Baseboard cleaning", "Inside microwave", "Light fixture cleaning", "Cabinet fronts wiped"]
    },
    {
      id: "move",
      type: "Move-in/out",
      rate: 220,
      description: "Ideal for landlords & departing tenants.",
      inclusion: ["Inside oven & fridge", "Window tracks", "Full cabinet sanitize", "Wall spot checks"]
    }
  ];

  return (
    <section id="pricing" className="py-24 px-6">
      <div className="max-w-7xl mx-auto text-center mb-16">
        <h2 className="text-4xl md:text-5xl lg:text-6xl italic mb-4">Choose your <span className="not-italic text-primary font-bold">package</span></h2>
        <p className="text-neutral-600 max-w-xl mx-auto">Transparent pricing with no hidden fees. Select the service that fits your needs.</p>
      </div>

      <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
        {displayServices.map((service, index) => {
          const isPopular = index === 1; // Mark the second one as popular by default if dynamic
          return (
            <motion.div 
              key={service.id || index}
              whileHover={{ y: -10 }}
              className={`p-10 rounded-[40px] border ${isPopular ? 'border-primary ring-1 ring-primary bg-primary/5' : 'border-neutral-100'} relative`}
            >
              {isPopular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full">
                  Most Popular
                </span>
              )}
              <h3 className="text-3xl font-serif italic mb-2">{service.type}</h3>
              <div className="flex items-baseline gap-1 mb-6">
                 <span className="text-4xl font-bold text-primary">₱{service.rate}</span>
                 <span className="text-neutral-400 text-sm italic">from</span>
              </div>
              <p className="text-sm text-neutral-600 mb-8 italic">{service.description}</p>
              
              <ul className="space-y-4 mb-10">
                {service.inclusion.map(feature => (
                  <li key={feature} className="flex items-center gap-3 text-sm font-medium text-neutral-700 italic">
                    <div className="bg-primary/10 p-1 rounded-full">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link 
                to={user ? "/book" : "/login"}
                state={{ serviceId: service.id, serviceName: service.type }}
                className={`block w-full py-4 rounded-2xl font-bold transition-all text-center ${isPopular ? 'bg-primary text-white shadow-xl shadow-primary/20 hover:scale-105' : 'bg-secondary text-primary hover:bg-primary hover:text-white'}`}
              >
                Select {service.type}
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
