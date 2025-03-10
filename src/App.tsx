import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './contexts/AuthContext';
import { SupportProvider } from './contexts/SupportContext';
import AppRoutes from './routes.tsx';

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <SupportProvider>
          <Router>
            <AppRoutes />
          </Router>
        </SupportProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App
