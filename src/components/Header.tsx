import { motion } from 'motion/react';
import { Sparkles, Menu, X, LayoutDashboard, User, LogOut } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../lib/firebase';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const role = profile?.role;
    try {
      if (role === 'admin' || role === 'superadmin') {
        navigate('/admin/login');
      } else if (role === 'cleaner') {
        navigate('/cleaner-login');
      } else {
        navigate('/');
      }
      
      // Use a small delay to ensure navigation starts before state change
      setTimeout(async () => {
        await auth.signOut();
        setIsOpen(false);
      }, 50);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navLinks = [];

  if (profile?.role !== 'cleaner' && profile?.role !== 'admin' && profile?.role !== 'superadmin') {
    navLinks.push({ name: 'How it works', href: '/#how-it-works' });
  }

  if (user && profile?.onboarding) {
    if (profile?.role === 'admin' || profile?.role === 'superadmin') {
      navLinks.push({ name: 'Portal', href: '/admin' });
    } else {
      navLinks.push({ name: 'Dashboard', href: '/dashboard' });
    }
  }

  return (
    <header id="site-header" className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
      <nav className="max-w-7xl mx-auto flex items-center justify-between glass rounded-2xl px-6 py-3">
        <Link to="/" className="flex items-center gap-2 group">
          <img 
            src="/logo.png" 
            alt="Haybolbay" 
            className="h-10 w-auto group-hover:scale-105 transition-transform" 
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget.nextElementSibling;
              if (fallback) (fallback as HTMLElement).style.display = 'block';
            }}
          />
          <span className="hidden text-xl font-serif font-bold tracking-tight text-primary">Haybolbay</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            link.href.startsWith('/#') ? (
               <a
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-neutral-600 hover:text-primary transition-colors italic"
              >
                {link.name}
              </a>
            ) : (
              <Link
                key={link.name}
                to={link.href}
                className="text-sm font-medium text-neutral-600 hover:text-primary transition-colors italic"
              >
                {link.name}
              </Link>
            )
          ))}
          
          <div className="flex items-center gap-4">
            {profile?.role !== 'cleaner' && profile?.role !== 'admin' && profile?.role !== 'superadmin' && (
              <Link 
                to={user ? "/book" : "/login"}
                className="bg-primary text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
              >
                {user ? "Book Now" : "Book Now / Login"}
              </Link>
            )}

            {user && (
              <div className="flex items-center gap-3">
                <Link 
                  to={profile?.role === 'admin' || profile?.role === 'superadmin' ? '/admin/settings' : (profile?.role === 'cleaner' ? "/cleaner/profile" : "/customer/profile")} 
                  className="flex items-center gap-2 bg-secondary text-primary px-5 py-2 rounded-xl text-sm font-semibold hover:bg-primary hover:text-white transition-all"
                >
                  <User className="w-4 h-4" />
                  {profile?.name || 'Profile'}
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-primary/40 hover:text-primary transition-colors hover:bg-primary/5 rounded-lg"
                  title="Log Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden p-2 text-neutral-600"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X /> : <Menu />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden absolute top-20 left-6 right-6 glass p-6 rounded-2xl flex flex-col gap-4"
        >
          {navLinks.map((link) => (
            link.href.startsWith('/#') ? (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="text-lg font-serif italic text-neutral-800"
              >
                {link.name}
              </a>
            ) : (
              <Link
                key={link.name}
                to={link.href}
                onClick={() => setIsOpen(false)}
                className="text-lg font-serif italic text-neutral-800"
              >
                {link.name}
              </Link>
            )
          ))}
          
          <div className="flex flex-col gap-2 mt-2">
            {profile?.role !== 'cleaner' && profile?.role !== 'admin' && profile?.role !== 'superadmin' && (
              <Link 
                to={user ? "/book" : "/login"}
                onClick={() => setIsOpen(false)}
                className="bg-primary text-white w-full py-3 rounded-xl font-semibold text-center"
              >
                {user ? "Book Now" : "Book Now / Login"}
              </Link>
            )}

            {user && (
              <>
                <Link 
                  to={profile?.role === 'admin' || profile?.role === 'superadmin' ? '/admin/settings' : (profile?.role === 'cleaner' ? "/cleaner/profile" : "/customer/profile")} 
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-2 bg-secondary text-primary w-full py-3 rounded-xl font-semibold text-center"
                >
                  <User className="w-4 h-4" />
                  {profile?.name || 'Profile'}
                </Link>
                <button 
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 bg-red-50 text-red-500 w-full py-3 rounded-xl font-semibold text-center"
                >
                  <LogOut className="w-4 h-4" />
                  Log Out
                </button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </header>
  );
}
