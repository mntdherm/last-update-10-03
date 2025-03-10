import React from 'react';
import { User, Coins, Calendar, LogOut, Store } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const MENU_ITEMS = [
  {
    id: 'profile',
    label: 'Profiili',
    icon: <User className="w-5 h-5" />,
    path: '/customer/profile'
  },
  {
    id: 'coins',
    label: 'Kolikot',
    icon: <Coins className="w-5 h-5" />,
    path: '/customer/coins'
  },
  {
    id: 'appointments',
    label: 'Varaukset',
    icon: <Calendar className="w-5 h-5" />,
    path: '/customer/appointments'
  }
];

const CustomerMenu = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <nav className="space-y-2">
        {MENU_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className={`w-full flex items-center px-4 py-2 rounded-lg text-left transition-colors ${
              location.pathname === item.path
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className={`${location.pathname === item.path ? 'text-blue-600' : 'text-gray-400'}`}>
              {item.icon}
            </span>
            <span className="ml-3 font-medium">{item.label}</span>
          </button>
        ))}

        <button
          onClick={handleLogout}
          className="w-full flex items-center px-4 py-2 rounded-lg text-left text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="ml-3 font-medium">Kirjaudu ulos</span>
        </button>
      </nav>
    </div>
  );
}

export default CustomerMenu;
