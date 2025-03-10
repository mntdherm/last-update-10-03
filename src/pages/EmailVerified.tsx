import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Loader2 } from 'lucide-react';

const EmailVerified = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to home after 2 seconds
    const timer = setTimeout(() => {
      navigate('/');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-bilo-gray to-white">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20 text-center max-w-md mx-4">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 bg-green-100 rounded-full blur-xl animate-pulse"></div>
          <div className="relative bg-white rounded-full p-4 shadow-lg">
            <Check className="w-12 h-12 text-green-600 animate-[bounce_1s_ease-in-out_infinite]" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-bilo-navy mb-3">Sähköposti vahvistettu!</h1>
        <p className="text-gray-600 mb-6">Sinut ohjataan automaattisesti etusivulle...</p>
        <div className="flex items-center justify-center text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          <span className="text-sm">Ohjataan...</span>
        </div>
      </div>
    </div>
  );
};

export default EmailVerified;
