import React, { useState } from 'react';
import { Mail, X, Loader2, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const EmailVerificationBanner = () => {
  const { currentUser, emailVerified, resendVerificationEmail } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showBanner, setShowBanner] = useState(true);

  if (!currentUser || emailVerified || !showBanner) return null;

  const handleResend = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      
      await resendVerificationEmail();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      console.error('Error resending verification:', err);
      setError('Virhe lähetettäessä vahvistussähköpostia');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-yellow-50 border-b border-yellow-200 relative">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center">
            <Mail className="h-5 w-5 text-yellow-600 mr-2" />
            <p className="text-sm text-yellow-700">
              Vahvista sähköpostiosoitteesi jatkaaksesi. Tarkista sähköpostisi ja klikkaa vahvistuslinkkiä.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleResend}
              disabled={loading || success}
              className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium
                transition-colors duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-1.5" />
                  Lähetetään...
                </>
              ) : success ? (
                <>
                  <Check className="h-4 w-4 mr-1.5" />
                  Lähetetty!
                </>
              ) : (
                'Lähetä uudelleen'
              )}
            </button>
            <button
              onClick={() => setShowBanner(false)}
              className="p-1 hover:bg-yellow-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-yellow-600" />
            </button>
          </div>
        </div>
        {error && (
          <div className="mt-2 bg-red-50 border-l-4 border-red-400 p-2 rounded">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailVerificationBanner;
