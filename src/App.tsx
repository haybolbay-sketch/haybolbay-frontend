/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import Home from './pages/Home';
import JoinCrew from './pages/JoinCrew';
import Auth from './pages/Auth';
import PrivacyPolicy from './pages/PrivacyPolicy';
import SecurityCenter from './pages/SecurityCenter';
import TermsConditions from './pages/TermsConditions';

import CustomerVerifyEmail from './pages/_customers/VerifyEmail';
import CustomerVerify from './pages/_customers/Verify';
import CustomerProfile from './pages/_customers/Profile';
import CustomerDashboard from './pages/_customers/Dashboard';
import CustomerBookNow from './pages/_customers/BookNow';

import CleanerLogin from './pages/_cleaners/CleanerLogin';
import CleanerVerifyEmail from './pages/_cleaners/CleanerVerifyEmail';
import CleanerVerify from './pages/_cleaners/CleanerVerify';
import CleanerProfile from './pages/_cleaners/CleanerProfile';
import CleanerDashboard from './pages/_cleaners/CleanerDashboard';

import AdminLogin from './pages/_admin/AdminLogin';
import AdminLayout from './pages/_admin/AdminLayout';
import AdminDashboard from './pages/_admin/AdminDashboard';
import AdminCustomers from './pages/_admin/AdminCustomers';
import AdminCleaners from './pages/_admin/AdminCleaners';
import AdminBookings from './pages/_admin/AdminBookings';
import AdminUsers from './pages/_admin/AdminUsers';
import AdminServices from './pages/_admin/AdminServices';
import NotificationManager from './components/NotificationManager';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  
  if (loading) return null;
  
  if (!user) {
    if (window.location.pathname.startsWith('/admin')) {
      return <Navigate to="/admin/login" />;
    }
    return <Navigate to="/login" />;
  }
  
  // Admins bypass normal onboarding
  if (profile?.role === 'admin' || profile?.role === 'superadmin') {
    return <>{children}</>;
  }

  // 1. Must be email verified (only if profile exists and user has an email)
  if (profile && user.email && !user.emailVerified) {
    const isCleaner = profile?.role === 'cleaner';
    return <Navigate to={isCleaner ? "/cleaner-verify-email" : "/customer-verify-email"} state={{ email: user.email }} />;
  }

  // 2. Check onboarding status or missing profile
  const isCleaner = profile?.role === 'cleaner';
  const profilePath = isCleaner ? '/cleaner/profile' : '/customer/profile';
  const isOnProfilePage = window.location.pathname === '/customer/profile' || window.location.pathname === '/cleaner/profile';

  if (user && (!profile || !profile.onboarding) && !isOnProfilePage) {
    return <Navigate to={profilePath} />;
  }

  // 3. Must be admin verified (only if already onboarded)
  if (profile?.onboarding && profile?.verified === false) {
    const isCleaner = profile?.role === 'cleaner';
    return <Navigate to={isCleaner ? "/cleaner-verify" : "/customer-verify"} state={{ userId: user.uid }} />;
  }
  
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  
  if (loading) return null;
  
  if (user) {
    if (profile?.role === 'admin' || profile?.role === 'superadmin') {
      return <Navigate to="/admin" />;
    }

    const isCleaner = profile?.role === 'cleaner';
    const profilePath = isCleaner ? "/cleaner/profile" : "/customer/profile";

    // If profile is missing, proceed to onboarding/profile page
    if (!profile) {
      return <Navigate to={profilePath} />;
    }

    // 2. Check onboarding status first
    if (!profile.onboarding) {
      return <Navigate to={profilePath} />;
    }

    // 3. Then check verification
    if (!user.email || user.emailVerified) {
      if (profile.verified === false) {
        const isCleaner = profile.role === 'cleaner';
        return <Navigate to={isCleaner ? "/cleaner-verify" : "/customer-verify"} state={{ userId: user.uid }} />;
      }
      return <Navigate to="/dashboard" />;
    } else {
      // If profile exists but email not verified, stay on login or redirect to verify?
      // Usually PublicRoute on /login should go to wherever is next.
      // But if email matches check in PrivateRoute, it will redirect anyway.
    }
  }
  
  return <>{children}</>;
}

function DashboardSelector() {
  const { profile } = useAuth();
  if (profile?.role === 'admin' || profile?.role === 'superadmin') return <Navigate to="/admin" />;
  return profile?.role === 'cleaner' ? <CleanerDashboard /> : <CustomerDashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <NotificationManager />
        <Routes>
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="cleaners" element={<AdminCleaners />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="services" element={<AdminServices />} />
            <Route path="payments" element={<div className="p-8"><h1 className="text-3xl font-serif font-bold">Payments</h1></div>} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="settings" element={<div className="p-8"><h1 className="text-3xl font-serif font-bold">Settings</h1></div>} />
          </Route>

          <Route path="/" element={<Home />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/security" element={<SecurityCenter />} />
          <Route path="/terms" element={<TermsConditions />} />
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Auth />
              </PublicRoute>
            } 
          />
          <Route path="/customer-verify" element={<CustomerVerify />} />
          <Route path="/customer-verify-email" element={<CustomerVerifyEmail />} />
          <Route path="/join-crew" element={<JoinCrew />} />
          <Route path="/cleaner-login" element={<CleanerLogin />} />
          <Route path="/cleaner-verify" element={<CleanerVerify />} />
          <Route path="/cleaner-verify-email" element={<CleanerVerifyEmail />} />          
          <Route 
            path="/customer/profile" 
            element={
              <PrivateRoute>
                <CustomerProfile />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/cleaner/profile" 
            element={
              <PrivateRoute>
                <CleanerProfile />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute>
                <DashboardSelector />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/book" 
            element={
              <PrivateRoute>
                <CustomerBookNow />
              </PrivateRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
