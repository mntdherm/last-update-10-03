import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUser } from '../lib/db';
import { LogIn, Mail, Lock, AlertCircle, Loader2, Car, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { auth, sendPasswordResetEmail } from '../lib/firebase';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Syötä sähköpostiosoite');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Configure action code settings
      const actionCodeSettings = {
        url: 'https://bilo.fi/login',
        handleCodeInApp: true
      };
      
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      setResetEmailSent(true);
    } catch (err: any) {
      console.error('Password reset error:', err);
      if (err.code === 'auth/user-not-found') {
        setError('Sähköpostiosoitetta ei löytynyt');
      } else {
        setError('Virhe salasanan palautuksessa. Yritä uudelleen.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      const userData = await getUser(auth.currentUser!.uid);
      
      // Redirect based on user role
      if (userData?.role === 'vendor') {
        navigate('/vendor-dashboard');
      } else {
        navigate('/');
      }
      
    } catch (err) {
      console.error('Login error:', err);
      setError('Virheellinen sähköposti tai salasana');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-bilo-gray to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full relative">
        {/* Logo */}
        <div className="text-center mb-12 transform hover:scale-105 transition-all duration-300">
          <div className="inline-flex items-center justify-center w-20 h-20 mx-auto bg-gradient-to-br from-bilo-silver to-gray-300 
            rounded-2xl shadow-lg group hover:shadow-xl transition-all duration-300">
            <Car className="w-10 h-10 text-white transform group-hover:rotate-12 transition-all duration-300" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-bilo-navy">
            {showForgotPassword ? 'Palauta salasana' : 'Tervetuloa takaisin'}
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Kirjaudu sisään jatkaaksesi
          </p>
        </div>

        <div className="bg-white/90 backdrop-blur-sm py-8 px-6 shadow-xl rounded-2xl border border-white/20">
          {showForgotPassword ? (
            <div className="animate-fadeIn">
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetEmailSent(false);
                  setError('');
                }}
                className="flex items-center text-gray-600 hover:text-gray-900 mb-6 group"
              >
                <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                Takaisin kirjautumiseen
              </button>
              
              {resetEmailSent ? (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Salasanan palautuslinkki lähetetty!
                  </h3>
                  <p className="text-gray-600">
                    Tarkista sähköpostisi ja seuraa ohjeita salasanan palauttamiseksi.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-6">
                  <div>
                    <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700">
                      Sähköposti
                    </label>
                    <div className="mt-1 relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors duration-200">
                        <Mail className="h-5 w-5 text-gray-400 group-hover:text-bilo-silver transition-colors duration-200" />
                      </div>
                      <input
                        id="reset-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="appearance-none block w-full pl-10 pr-3 py-3 bg-gray-50 border-2 border-transparent rounded-xl
                          placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-bilo-silver focus:border-transparent
                          focus:bg-white sm:text-sm transition-all duration-300 ease-in-out group-hover:bg-gray-100"
                        placeholder="Syötä sähköpostiosoitteesi"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center py-3 px-4 next-step-button
                      text-bilo-navy font-medium rounded-xl
                      transition-all duration-300 relative group
                      disabled:opacity-50 disabled:cursor-not-allowed
                      active:scale-98 focus:outline-none focus:ring-2 focus:ring-bilo-silver"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                        <span className="animate-pulse relative z-10">Lähetetään...</span>
                      </>
                    ) : (
                      <span className="relative z-10 group-hover:translate-x-0.5 transition-transform">
                        Lähetä palautuslinkki
                      </span>
                    )}
                  </button>
                </form>
              )}
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-xl animate-shake">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Sähköposti
              </label>
              <div className="mt-1 relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors duration-200">
                  <Mail className="h-5 w-5 text-gray-400 group-hover:text-bilo-silver transition-colors duration-200" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-3 bg-gray-50 border-2 border-transparent rounded-xl
                    placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-bilo-silver focus:border-transparent
                    focus:bg-white sm:text-sm transition-all duration-300 ease-in-out group-hover:bg-gray-100"
                  placeholder="Sähköposti"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Salasana
              </label>
              <div className="mt-1 relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors duration-200">
                  <Lock className="h-5 w-5 text-gray-400 group-hover:text-bilo-silver transition-colors duration-200" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-10 py-3 bg-gray-50 border-2 border-transparent rounded-xl
                    placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-bilo-silver focus:border-transparent
                    focus:bg-white sm:text-sm transition-all duration-300 ease-in-out group-hover:bg-gray-100"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-bilo-silver transition-colors duration-200" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-bilo-silver transition-colors duration-200" />
                  )}
                </button>
              </div>
            </div>
            
            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Unohditko salasanasi?
              </button>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="next-step-button w-full flex justify-center items-center py-3 px-4 rounded-xl
                  text-sm font-medium text-bilo-navy relative group
                  disabled:opacity-50 disabled:cursor-not-allowed
                  active:scale-98 focus:outline-none focus:ring-2 focus:ring-bilo-silver"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                    <span className="animate-pulse relative z-10">Kirjaudutaan...</span>
                  </>
                ) : (
                  <span className="relative z-10 group-hover:translate-x-0.5 transition-transform">
                    Kirjaudu sisään
                  </span>
                )}
              </button>
            </div>
          </form>
          )}

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500 font-medium">
                  Eikö sinulla ole tiliä?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                to="/register"
                className="next-step-button w-full flex justify-center items-center px-4 py-3 rounded-xl
                  text-sm font-medium text-bilo-navy relative group
                  transition-all duration-300 hover:scale-[1.02] hover:shadow-xl
                  active:scale-98 focus:outline-none focus:ring-2 focus:ring-bilo-silver"
              >
                <span className="relative z-10 group-hover:translate-x-0.5 transition-transform">
                  Luo uusi tili
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
