import Header from '../components/Header';
import Hero from '../components/Hero';
import HowItWorks from '../components/HowItWorks';
import Services from '../components/Services';
import Footer from '../components/Footer';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

export default function Home() {
  const heroImage = "https://plus.unsplash.com/premium_photo-1677683508374-a6f50382eb66";
  const { profile } = useAuth();
  const isCleaner = profile?.role === 'cleaner';

  return (
    <>
      <Header />
      <main>
        <Hero heroImage={heroImage} />
        {!isCleaner && <HowItWorks />}
        {!isCleaner && <Services />}
        <section className="py-24 px-6 bg-primary text-white overflow-hidden relative">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-5xl md:text-6xl italic leading-tight mb-8">
                “Haybolbay saved me <br />days of work during my <br />property <span className="not-italic text-accent font-bold">turnover</span>.”
              </h2>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-accent"></div>
                <div>
                  <p className="font-bold underline underline-offset-4 italic">Julian Fernandez</p>
                  <p className="text-xs uppercase tracking-widest text-white/60 font-bold">Real Estate Professional</p>
                </div>
              </div>
            </div>
            <div className="relative group">
               <div className="aspect-square bg-secondary/10 rounded-[60px] transform rotate-3 group-hover:rotate-0 transition-transform duration-700"></div>
               <img 
                 src="https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&q=80&w=800" 
                 alt="Professional cleaning" 
                 className="absolute inset-0 w-full h-full object-cover rounded-[60px] transform -rotate-3 group-hover:rotate-0 transition-transform duration-700 shadow-2xl"
                 referrerPolicy="no-referrer"
               />
            </div>
          </div>
        </section>
        {!isCleaner && (
          <section className="py-32 px-6 text-center">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-5xl md:text-7xl italic mb-8">Ready for a <span className="not-italic text-primary font-bold">fresh start?</span></h2>
              <p className="text-neutral-500 mb-12 text-lg italic tracking-tight">Join thousands of happy homeowners and experience the Haybolbay difference today.</p>
              <Link to="/login" className="inline-block bg-primary text-white px-12 py-5 rounded-2xl font-bold text-xl hover:scale-110 transition-all shadow-2xl shadow-primary/30">
                  Book Your Cleaning Now
              </Link>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
