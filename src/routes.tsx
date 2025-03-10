import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useSupportDialog } from './contexts/SupportContext';
import { getUser } from './lib/db';
import EmailVerificationBanner from './components/EmailVerificationBanner';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import SearchResults from './pages/SearchResults';
import CustomerProfile from './pages/customer/Profile';
import CustomerCoins from './pages/customer/Coins';
import CustomerAppointments from './pages/customer/Appointments';
import VendorDashboard from './pages/VendorDashboard';
import VendorProfile from './pages/VendorProfile';
import VendorSettings from './pages/VendorSettings';
import VendorOffers from './pages/VendorOffers';
import VendorCalendar from './pages/VendorCalendar';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import EmailVerified from './pages/EmailVerified';
import ActionHandler from './pages/auth/ActionHandler';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import MobileNav from './components/MobileNav';
import SupportDialog from './components/SupportDialog';

const AppRoutes = () => {
  const { currentUser } = useAuth();
  const { showSupportDialog, setShowSupportDialog } = useSupportDialog();
  const location = useLocation();
  const [userRole, setUserRole] = React.useState<string | null>(null);
  const [transitionDirection, setTransitionDirection] = React.useState<'forward' | 'backward'>('forward');
  const prevPathRef = React.useRef(location.pathname);

  // Track navigation direction
  React.useEffect(() => {
    const isForward = location.pathname.length > prevPathRef.current.length;
    setTransitionDirection(isForward ? 'forward' : 'backward');
    prevPathRef.current = location.pathname;
  }, [location.pathname]);

  React.useEffect(() => {
    const loadUserRole = async () => {
      if (currentUser) {
        const userData = await getUser(currentUser.uid);
        setUserRole(userData?.role || null);
      }
    };
    loadUserRole();
  }, [currentUser]);

  // Close support dialog when route changes
  React.useEffect(() => {
    setShowSupportDialog(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <div className="hidden md:block">
        <Navbar />
      </div>
      <EmailVerificationBanner />
      <div className={`page-transition ${transitionDirection}`}>
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/login" element={<Login />} />
          <Route path="/email-verified" element={<EmailVerified />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/action" element={<ActionHandler />} />
          <Route path="/vendor/:id" element={<VendorProfile />} />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/customer/profile" 
            element={
              <ProtectedRoute>
                <CustomerProfile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/customer/coins" 
            element={
              <ProtectedRoute>
                <CustomerCoins />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/customer/appointments" 
            element={
              <ProtectedRoute>
                <CustomerAppointments />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/vendor-dashboard" 
            element={
              <ProtectedRoute>
                <VendorDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/vendor-offers" 
            element={
              <ProtectedRoute>
                <VendorOffers />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/vendor-calendar" 
            element={
              <ProtectedRoute>
                <VendorCalendar />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/vendor-settings" 
            element={
              <ProtectedRoute>
                <VendorSettings />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <MobileNav />
      
      {showSupportDialog && userRole && (
        <SupportDialog
          isOpen={showSupportDialog}
          onClose={() => setShowSupportDialog(false)}
          userRole={userRole as 'customer' | 'vendor'}
        />
      )}
    </div>
  );
};

export default AppRoutes;
