import React from 'react';
import CustomerMenu from '../../components/CustomerMenu';

interface CustomerLayoutProps {
  children: React.ReactNode;
}

const CustomerLayout: React.FC<CustomerLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar - Hidden on mobile */}
          <div className="hidden md:block md:col-span-1">
            <CustomerMenu />
          </div>
          
          {/* Main Content */}
          <div className="col-span-1 md:col-span-3">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerLayout;
