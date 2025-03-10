import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; 
import { getUser } from '../lib/db';
import { LogOut, Menu, X, User, Store, Package, Tag, Coins, Calendar, Search, ChevronDown } from 'lucide-react';

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const [currentWord, setCurrentWord] = useState('Autopesu');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const words = ['Autopesu', 'detailing', 'pikahuolto'];
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prevIndex) => (prevIndex + 1) % words.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setCurrentWord(words[wordIndex]);
  }, [wordIndex]);

  useEffect(() => {
    const loadUserData = async () => {
      if (currentUser) {
        const user = await getUser(currentUser.uid);
        setUserData(user);
      }
    };
    loadUserData();
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav className="bg-bilo-gray/80 shadow-sm relative ios-blur fixed top-0 left-0 right-0 z-[100]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <span className="text-3xl font-bold bilo-text mr-2">Bilo</span>
              <div className="text-sm flex items-center">
                <span className="text-bilo-navy mr-1">Nykyajan</span>
                <span className="changing-word font-medium">{currentWord}</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {currentUser ? (
              <>
                {/* Search */}
                {/* User Menu */}
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center px-4 py-2.5 text-bilo-navy rounded-xl
                      transition-all duration-300 group relative
                      hover:bg-gradient-to-br hover:from-gray-100 hover:to-gray-200
                      active:scale-95 focus:outline-none focus:ring-2 focus:ring-bilo-silver"
                  >
                    <div className="w-8 h-8 rounded-full bg-bilo-gray flex items-center justify-center
                      group-hover:bg-white transition-all duration-300 mr-2 overflow-hidden">
                      <img
                        src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4"
                        alt="Avatar"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <span className="mr-2 font-medium group-hover:text-bilo-silver transition-colors duration-300">
                      {userData?.firstName || 'Käyttäjä'}
                    </span>
                    <ChevronDown className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg py-2 z-[101]">
                      {userData?.role === 'customer' && (
                        <>
                          <Link
                            to="/customer/profile"
                            className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                          >
                            <User className="w-4 h-4 inline mr-2" />
                            Profiili
                          </Link>
                          <Link
                            to="/customer/coins"
                            className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                          >
                            <Coins className="w-4 h-4 inline mr-2" />
                            Kolikot
                          </Link>
                          <Link
                            to="/customer/appointments"
                            className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                          >
                            <Calendar className="w-4 h-4 inline mr-2" />
                            Varaukset
                          </Link>
                        </>
                      )}

                      {userData?.role === 'vendor' && (
                        <>
                          <Link
                            to="/vendor-dashboard"
                            className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                          >
                            <Store className="w-4 h-4 inline mr-2" />
                            Kojelauta
                          </Link>
                          <Link
                            to="/vendor-offers"
                            className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                          >
                            <Package className="w-4 h-4 inline mr-2" />
                            Tarjoukset
                          </Link>
                        </>
                      )}

                      {userData?.role === 'admin' && (
                        <Link
                          to="/admin"
                          className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                        >
                          <Tag className="w-4 h-4 inline mr-2" />
                          Hallintapaneeli
                        </Link>
                      )}

                      <hr className="my-2" />
                      
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4 inline mr-2" />
                        Kirjaudu ulos
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-bilo-navy hover:bg-bilo-gray rounded-lg transition-colors"
                >
                  Kirjaudu sisään
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-bilo-silver text-bilo-navy rounded-lg hover:bg-bilo-silver/80 transition-colors"
                >
                  Rekisteröidy
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
