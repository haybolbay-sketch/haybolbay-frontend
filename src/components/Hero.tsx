import { motion } from 'motion/react';
import { ArrowRight, Shield, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Hero({ heroImage }: { heroImage: string }) {
  const { user, profile } = useAuth();

  return (
    <section id="hero" className="relative pt-32 pb-20 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-[1.2fr_1fr] gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-full mb-6">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary/80">Trusted by 10k+ Homeowners</span>
          </div>
          
          <h1 className="text-6xl md:text-7xl lg:text-8xl leading-[0.9] font-serif mb-8 text-neutral-900 italic">
            A Cleaner Home,<br />
            <span className="text-primary not-italic font-bold">Simplified.</span>
          </h1>
          
          <p className="text-lg text-neutral-600 mb-10 max-w-lg leading-relaxed">
            From turnover cleans for landlords to routine tidying for tenants, Haybolbay connects you with verified cleaning professionals in seconds.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              to={user ? (profile?.role === 'cleaner' ? "/dashboard" : "/book") : "/login"}
              className="bg-primary text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-xl shadow-primary/20"
            >
              {profile?.role === 'cleaner' ? "Go to Dashboard" : "Get Started"} <ArrowRight className="w-5 h-5" />
            </Link>
            {profile?.role !== 'cleaner' && (
              <a href="#pricing" className="bg-white border border-neutral-200 px-8 py-4 rounded-2xl font-bold hover:bg-neutral-50 transition-all text-center">
                View Pricing
              </a>
            )}
          </div>

          <div className="mt-12 grid grid-cols-3 gap-8">
            <div>
              <p className="text-2xl font-serif italic text-primary">60s</p>
              <p className="text-xs uppercase tracking-widest font-bold text-neutral-400">Booking Time</p>
            </div>
            <div>
              <p className="text-2xl font-serif italic text-primary">100%</p>
              <p className="text-xs uppercase tracking-widest font-bold text-neutral-400">Insured Pros</p>
            </div>
            <div>
              <p className="text-2xl font-serif italic text-primary">24/7</p>
              <p className="text-xs uppercase tracking-widest font-bold text-neutral-400">Support</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative"
        >
          <div className="aspect-[4/5] rounded-[40px] overflow-hidden shadow-2xl relative z-10">
            <img 
              src={heroImage} 
              alt="Impeccably clean living room" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          {/* Decorative Elements */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent/20 rounded-full blur-3xl -z-0"></div>
          <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-primary/10 rounded-full blur-3xl -z-0"></div>
          
          <div className="absolute bottom-10 -left-10 glass p-5 rounded-3xl shadow-xl z-20 flex items-center gap-4 max-w-[200px]">
             <div className="p-2 bg-primary rounded-xl">
               <Clock className="w-6 h-6 text-white"/>
             </div>
             <p className="text-sm font-medium leading-tight text-neutral-800 italic">"Cleaner arrived on time and did an amazing job!"</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
