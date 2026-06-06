import { Outlet, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LayoutDashboard, Users, UserCheck, CalendarDays, CreditCard, Shield, Settings, LogOut, Sparkles } from 'lucide-react';

export default function AdminLayout() {
  const { profile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!profile || (profile.role !== 'admin' && profile.role !== 'superadmin')) {
    return <Navigate to="/admin/login" />;
  }

  const handleLogout = async () => {
    navigate('/admin/login');
    setTimeout(async () => {
      await logout();
    }, 50);
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Customers', path: '/admin/customers', icon: Users },
    { name: 'Cleaners', path: '/admin/cleaners', icon: UserCheck },
    { name: 'Bookings', path: '/admin/bookings', icon: CalendarDays },
    { name: 'Services', path: '/admin/services', icon: Sparkles },
    { name: 'Payments', path: '/admin/payments', icon: CreditCard },
    ...(profile?.role === 'superadmin' ? [{ name: 'Admin Users', path: '/admin/users', icon: Shield }] : []),
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full z-10">
        <div className="p-6 border-b border-gray-100">
          <Link to="/" className="flex items-center gap-2 group">
            <img src="/logo.png" alt="Haybolbay" className="h-8 w-auto group-hover:scale-105 transition-transform" />
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1.5 px-3">
            {navItems.map((item) => {
              const active = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors font-medium text-sm ${
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gray-50 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              {profile.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{profile.name}</p>
              <p className="text-xs text-gray-500 truncate capitalize">{profile.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <Outlet />
      </main>
    </div>
  );
}
