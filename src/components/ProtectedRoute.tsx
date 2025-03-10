import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUser } from '../lib/db';
import type { User } from '../types/database'; 

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const [userData, setUserData] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const loadUserData = async () => {
      if (currentUser) {
        const user = await getUser(currentUser.uid);
        setUserData(user);
        setUserLoading(false);
      }
    };
    loadUserData();
  }, [currentUser]);

  if (loading || userLoading) {
    return null;
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // Redirect vendors to vendor dashboard if they try to access customer dashboard
  if (userData?.role === 'vendor' && location.pathname === '/customer-dashboard') {
    return <Navigate to="/vendor-dashboard" />;
  }

  // Redirect customers to customer dashboard if they try to access vendor dashboard
  if (userData?.role === 'customer' && location.pathname === '/vendor-dashboard') {
    return <Navigate to="/customer-dashboard" />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
