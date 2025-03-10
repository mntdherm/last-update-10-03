import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Home } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  // Auto-redirect after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-bilo-gray to-white flex items-center justify-center px-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 mb-8 bg-gradient-to-br from-bilo-silver to-gray-300 
          rounded-2xl shadow-lg group hover:shadow-xl transition-all duration-300">
          <Car className="w-12 h-12 text-white transform group-hover:rotate-12 transition-all duration-300" />
        </div>
        <h1 className="text-6xl font-bold text-bilo-navy mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-6">Sivua ei löytynyt</h2>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Valitettavasti etsimääsi sivua ei löytynyt. Sinut ohjataan automaattisesti etusivulle 5 sekunnin kuluttua.
        </p>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center px-6 py-3 next-step-button
            text-bilo-navy font-medium rounded-xl
            transition-all duration-300 relative group
            hover:scale-[1.02] hover:shadow-xl
            active:scale-98 focus:outline-none focus:ring-2 focus:ring-bilo-silver"
        >
          <Home className="w-5 h-5 mr-2" />
          Palaa etusivulle
        </button>
      </div>
    </div>
  );
};

export default NotFound;
