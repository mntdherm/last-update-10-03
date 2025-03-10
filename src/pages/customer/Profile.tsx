import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getUser, updateUser } from '../../lib/db';
import { Loader2, User, Mail, Phone, Car, Save, ChevronRight, Shield, Bell } from 'lucide-react';
import CustomerLayout from './Layout';

const CustomerProfile = () => {
  const { currentUser } = useAuth();
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    licensePlate: ''
  });
  const [showSaveButton, setShowSaveButton] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      if (currentUser) {
        const userData = await getUser(currentUser.uid);
        if (userData) {
          setProfileData({
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            email: userData.email || '',
            phone: userData.phone || '',
            licensePlate: userData.licensePlate || ''
          });
        }
      }
    };
    loadUserData();
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      setLoading(true);
      setError(null);

      await updateUser(currentUser.uid, profileData);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Profiilin päivitys epäonnistui');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bilo-gray">
      {/* iOS-style header */}
      <div className={`transition-all duration-300 
        ${scrolled ? 'bg-white/90 backdrop-blur-lg shadow-sm' : 'bg-transparent'}`}>
        <div className="px-4 py-6">
          <h1 className={`text-2xl font-semibold transition-all duration-300
            ${scrolled ? 'text-bilo-navy' : 'text-gray-900'}`}>
            Profiili
          </h1>
        </div>
      </div>

      <form 
        ref={formRef}
        onSubmit={handleSubmit} 
        id="profile-form"
        className="pb-32 px-4 space-y-6 h-screen overflow-y-auto"
      >
        {/* Profile Header */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-gradient-to-br from-bilo-silver to-gray-300 
              rounded-2xl flex items-center justify-center shadow-inner">
              <User className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-bilo-navy">
                {profileData.firstName || 'Käyttäjä'}
              </h2>
              <p className="text-gray-500">{profileData.email}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-sm font-medium text-gray-500">Henkilötiedot</h3>
            </div>

            <div className="divide-y divide-gray-100">
              <div className="space-y-5">
                <div className="p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Etunimi</label>
                  <input
                    type="text"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-transparent
                      focus:border-bilo-silver focus:ring-2 focus:ring-bilo-silver/20 focus:bg-white
                      transition-all duration-300"
                    required
                  />
                </div>

                <div className="p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sukunimi</label>
                  <input
                    type="text"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-transparent
                      focus:border-bilo-silver focus:ring-2 focus:ring-bilo-silver/20 focus:bg-white
                      transition-all duration-300"
                    required
                  />
                </div>

                <div className="p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rekisterinumero</label>
                  <input
                    type="text"
                    value={profileData.licensePlate}
                    onChange={(e) => setProfileData(prev => ({ ...prev, licensePlate: e.target.value.toUpperCase() }))}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-transparent
                      focus:border-bilo-silver focus:ring-2 focus:ring-bilo-silver/20 focus:bg-white
                      transition-all duration-300"
                    placeholder="ABC-123"
                    required
                  />
                </div>

                <div className="p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sähköposti</label>
                  <input
                    type="email"
                    value={profileData.email}
                    disabled
                    className="w-full px-4 py-3 rounded-xl bg-gray-100 border-2 border-transparent
                      text-gray-500 cursor-not-allowed"
                  />
                </div>

                <div className="p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Puhelinnumero</label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-transparent
                      focus:border-bilo-silver focus:ring-2 focus:ring-bilo-silver/20 focus:bg-white
                      transition-all duration-300"
                    placeholder="+358"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center px-6 py-3 next-step-button
            text-bilo-navy font-medium rounded-xl mt-6
            transition-all duration-300 relative group
            hover:scale-[1.02] hover:shadow-xl
            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
            active:scale-98 focus:outline-none focus:ring-2 focus:ring-bilo-silver"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin h-5 w-5 mr-2 relative z-10" />
              <span className="animate-pulse relative z-10">Tallennetaan...</span>
            </>
          ) : (
            <>
              <Save className="h-5 w-5 mr-2 relative z-10 group-hover:scale-110 transition-transform" />
              <span className="relative z-10 group-hover:translate-x-0.5 transition-transform">
                Tallenna muutokset
              </span>
            </>
          )}
        </button>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-xl animate-shake">
            <p className="text-lg text-red-700 font-poppins">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-xl animate-fadeIn">
            <p className="text-lg text-green-700 font-poppins">Profiili päivitetty onnistuneesti!</p>
          </div>
        )}
      </form>

      {/* Floating Save Button */}
      {showSaveButton && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-lg border-t
          border-gray-200/50 shadow-lg transform transition-all duration-300
          animate-slideUp">
          <button
            type="submit"
            form="profile-form"
            disabled={loading}
            className="w-full flex items-center justify-center px-6 py-3 bg-bilo-navy
              text-white rounded-xl font-medium transform transition-all duration-300
              hover:bg-bilo-navy/90 active:scale-98 disabled:opacity-50
              disabled:cursor-not-allowed focus:outline-none focus:ring-2
              focus:ring-bilo-navy focus:ring-offset-2"
          >
            {loading ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Tallenna muutokset
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default CustomerProfile;
