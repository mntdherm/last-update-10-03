import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { auth } from '../../lib/firebase';
import { applyActionCode, verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { Check, AlertCircle, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

const ActionHandler = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<'resetPassword' | 'verifyEmail' | 'recoverEmail' | null>(null);

  useEffect(() => {
    const handleAction = async () => {
      const mode = searchParams.get('mode');
      const actionCode = searchParams.get('oobCode');
      const continueUrl = searchParams.get('continueUrl');

      if (!actionCode) {
        setError('Virheellinen toimintokoodi');
        setLoading(false);
        return;
      }

      try {
        switch (mode) {
          case 'resetPassword':
            setMode('resetPassword');
            const email = await verifyPasswordResetCode(auth, actionCode);
            setEmail(email);
            setLoading(false);
            break;

          case 'verifyEmail':
            setMode('verifyEmail');
            await applyActionCode(auth, actionCode);
            setSuccess(true);
            setTimeout(() => {
              navigate(continueUrl || '/');
            }, 3000);
            break;

          case 'recoverEmail':
            setMode('recoverEmail');
            await applyActionCode(auth, actionCode);
            setSuccess(true);
            setTimeout(() => {
              navigate('/login');
            }, 3000);
            break;

          default:
            setError('Tuntematon toiminto');
            setLoading(false);
        }
      } catch (err: any) {
        console.error('Action handling error:', err);
        setError(err.message || 'Toiminnon käsittelyssä tapahtui virhe');
        setLoading(false);
      }
    };

    handleAction();
  }, [searchParams, navigate]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const actionCode = searchParams.get('oobCode');
    if (!actionCode) return;

    try {
      setLoading(true);
      await confirmPasswordReset(auth, actionCode, newPassword);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || 'Salasanan vaihtaminen epäonnistui');
      setLoading(false);
    }
  };

  if (loading && !mode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          <span>Käsitellään toimintoa...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Virhe</h2>
          <p className="text-center text-gray-600">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="mt-6 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Takaisin kirjautumiseen
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
            {mode === 'resetPassword' && 'Salasana vaihdettu!'}
            {mode === 'verifyEmail' && 'Sähköposti vahvistettu!'}
            {mode === 'recoverEmail' && 'Sähköposti palautettu!'}
          </h2>
          <p className="text-center text-gray-600">Sinut ohjataan automaattisesti eteenpäin...</p>
        </div>
      </div>
    );
  }

  if (mode === 'resetPassword') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Vaihda salasana</h2>
            <p className="mt-2 text-gray-600">Käyttäjälle {email}</p>
          </div>

          <form onSubmit={handlePasswordReset} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Uusi salasana
              </label>
              <div className="mt-1 relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-400" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Vaihdetaan salasanaa...
                </div>
              ) : (
                'Vaihda salasana'
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return null;
};

export default ActionHandler;
