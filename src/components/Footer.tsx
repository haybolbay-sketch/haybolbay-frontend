import { Link } from 'react-router-dom';
import { Shield, Check, Heart, HelpCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-primary text-white/90 py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-6 group">
              <img 
                src="/logo.png" 
                alt="Haybolbay" 
                className="h-12 w-auto brightness-0 invert group-hover:scale-105 transition-transform" 
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.nextElementSibling;
                  if (fallback) (fallback as HTMLElement).style.display = 'block';
                }}
              />
              <span className="hidden text-2xl font-serif font-bold text-white italic">Haybolbay</span>
            </Link>
            <p className="text-sm leading-relaxed text-white/60 italic">
              Connecting people through trusted home services.
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-6">Navigation</h4>
            <ul className="space-y-4 text-sm font-medium italic">
              <li><a href="#" className="hover:text-accent transition-colors">How it works</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Pricing</a></li>              
              <li><a href="#" className="hover:text-accent transition-colors">Reviews</a></li>
              <li><Link to="/join-crew" className="hover:text-accent transition-colors">Join Our Cleaning Crew</Link></li>
              <li><Link to="/admin/login" className="hover:text-accent transition-colors">Admin Portal</Link></li>
              <li><Link to="/aboutus" className="hover:text-accent transition-colors">About Us</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-6">Support</h4>
            <ul className="space-y-4 text-sm font-medium italic">
              <li><a href="#" className="hover:text-accent transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Support Ticket</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Contact Us</a></li>
              <li><Link to="/privacy" className="hover:text-accent transition-colors">Privacy Policy</Link></li>
              <li><Link to="/security" className="hover:text-accent transition-colors">Security Center</Link></li>
              <li><Link to="/terms" className="hover:text-accent transition-colors">Terms & Conditions</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-6">Connect</h4>
            <ul className="space-y-4 text-sm font-medium italic">
              <li><a href="#" className="hover:text-accent transition-colors">Instagram</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Twitter</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">LinkedIn</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-bold uppercase tracking-[0.2em] text-white/40">
          <p>© 2026 Haybolbay. All rights reserved.</p>
          <div className="flex gap-6 italic lowercase tracking-tight text-white/60">
             <Link to="/privacy">Privacy</Link>
             <Link to="/terms">Terms</Link>
             <a href="#">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
