import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUser, getCustomerAppointments, updateUser } from '../lib/db';
import { Calendar, Clock, Save, Loader2, Star, UserIcon, Coins, MessageSquare } from 'lucide-react';
import { useSupportDialog } from '../contexts/SupportContext';
import type { User, Appointment } from '../types/database';
import FeedbackDialog from '../components/FeedbackDialog';
import { format } from 'date-fns';
import { fi } from 'date-fns/locale';
import RewardsCard from '../components/RewardsCard';

const CustomerDashboard = () => {
  const { currentUser } = useAuth();
  const { setShowSupportDialog } = useSupportDialog();
  const [userData, setUserData] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    licensePlate: ''
  });

  useEffect(() => {
    if (currentUser) {
      const fetchData = async () => {
        const user = await getUser(currentUser.uid);
        const userAppointments = await getCustomerAppointments(currentUser.uid);
        
        // Convert Firestore timestamps to Date objects
        const formattedAppointments = userAppointments.map(appointment => ({
          ...appointment,
          date: new Date(appointment.date.seconds * 1000)
        }));
        
        setUserData(user);
        setAppointments(formattedAppointments);
        
        // Set profile data from user data if available
        if (user) {
          setProfileData({
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
            phone: user.phone || '',
            licensePlate: user.licensePlate || ''
          });
        }
      };
      fetchData();
    }
  }, [currentUser]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      setLoading(true);
      setError(null);

      await updateUser(currentUser.uid, {
        ...userData,
        ...profileData
      });

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header with Stats */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <UserIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tervetuloa, {profileData.firstName || 'Käyttäjä'}</h1>
              <p className="mt-1 text-gray-600">Hallitse profiiliasi ja seuraa varauksiasi</p>
            </div>
          </div>
          
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-inner">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-500">Tulevat varaukset</p>
                    <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-800">
                      {appointments.filter(a => a.status === 'confirmed').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-inner">
                    <Star className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-500">Arvostelut</p>
                    <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-green-800">
                      {appointments.filter(a => a.feedback).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-inner">
                    <Coins className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-500">Kolikot</p>
                    <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-purple-800">
                      {userData?.wallet?.coins || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      
      {/* Profile Settings */}
      <div className="bg-white rounded-2xl shadow-sm p-8 mb-8 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <UserIcon className="h-6 w-6 text-gray-600" />
            </div>
            <h2 className="ml-3 text-xl font-semibold text-gray-900">Profiilitiedot</h2>
          </div>
        </div>

        <form onSubmit={handleProfileUpdate} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Etunimi</label>
              <input
                type="text"
                value={profileData.firstName}
                onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all hover:bg-gray-100"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Sukunimi</label>
              <input
                type="text"
                value={profileData.lastName}
                onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all hover:bg-gray-100"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Rekisterinumero</label>
            <input
              type="text"
              value={profileData.licensePlate}
              onChange={(e) => setProfileData(prev => ({ ...prev, licensePlate: e.target.value.toUpperCase() }))}
              className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all hover:bg-gray-100"
              placeholder="ABC-123"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Sähköposti</label>
            <input
              type="email"
              value={profileData.email}
              disabled
              className="mt-1 block w-full rounded-xl border-gray-300 bg-gray-100 shadow-sm text-gray-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Puhelinnumero</label>
            <input
              type="tel"
              value={profileData.phone}
              onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
              className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all hover:bg-gray-100"
              placeholder="+358"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-green-700">Profiili päivitetty onnistuneesti!</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Tallennetaan...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Tallenna muutokset
                </>
              )}
            </button>
            <button
              onClick={() => {
                setShowSupportDialog(true);
              }}
              className="ml-4 inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <MessageSquare className="w-4 h-4 mr-1.5" />
              Tarvitsetko apua?
            </button>
          </div>
        </form>
      </div>

      {/* Rewards Section */}
      {userData?.wallet && (
        <div className="mb-8">
          <RewardsCard
            coins={userData.wallet.coins}
            transactions={userData.wallet.transactions}
          />
        </div>
      )}

      {/* Appointments Section */}
      <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="ml-3 text-xl font-semibold text-gray-900">Tulevat varaukset</h2>
          </div>
        </div>
        
        <div className="space-y-4">
          {appointments.map(appointment => (
            <div key={appointment.id} className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-all transform hover:scale-[1.01] border border-gray-200/50">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium">Pesu #{appointment.id.slice(0, 8)}</p>
                  <p className="text-sm text-gray-600 flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {format(appointment.date, "d. MMMM yyyy 'klo' HH:mm", { locale: fi })}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  appointment.status === 'confirmed' ? 'bg-green-100 text-green-800 ring-1 ring-green-600/20' :
                  appointment.status === 'completed' ? 'bg-blue-100 text-blue-800 ring-1 ring-blue-600/20' :
                  appointment.status === 'no_show' ? 'bg-purple-100 text-purple-800 ring-1 ring-purple-600/20' :
                  appointment.status === 'cancelled_by_customer' ? 'bg-orange-100 text-orange-800 ring-1 ring-orange-600/20' :
                  appointment.status === 'cancelled' ? 'bg-red-100 text-red-800 ring-1 ring-red-600/20' :
                  'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-600/20'
                }`}>
                  {appointment.status === 'confirmed' ? 'Vahvistettu' :
                   appointment.status === 'completed' ? 'Valmis' :
                   appointment.status === 'no_show' ? 'Ei saapunut' :
                   appointment.status === 'cancelled_by_customer' ? 'Peruttu (asiakas)' :
                   appointment.status === 'cancelled' ? 'Peruttu' :
                   'Odottaa'}
                </span>
              </div>
              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Set the support dialog subject with appointment ID
                    setShowSupportDialog(true, `Apua varaukseni kanssa #${appointment.id.slice(0, 8)}`);
                  }}
                  className="inline-flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200/50 rounded-lg transition-colors"
                >
                  <MessageSquare className="w-4 h-4 mr-1.5" />
                  Tarvitsetko apua?
                </button>
                <div className="flex items-center space-x-2">
              {appointment.status === 'completed' && !appointment.feedback && (
                <button
                  onClick={() => setSelectedAppointment(appointment)}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Star className="w-4 h-4 mr-1.5" />
                  Anna palautetta
                </button>
              )}
              {appointment.feedback && (
                <div className="flex items-center text-sm text-gray-600">
                  <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < appointment.feedback!.rating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="ml-2">Palaute annettu</span>
                </div>
              )}
                </div>
              </div>
            </div>
          ))}
          
          {appointments.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Ei tulevia varauksia</p>
            </div>
          )}
        </div>
      </div>
      </div>
      
      {selectedAppointment && (
        <FeedbackDialog
          isOpen={!!selectedAppointment}
          onClose={() => {
            setSelectedAppointment(null);
            // Refresh appointments to show updated feedback
            if (currentUser) {
              getCustomerAppointments(currentUser.uid).then(appointments => {
                const formattedAppointments = appointments.map(appointment => ({
                  ...appointment,
                  date: new Date(appointment.date.seconds * 1000)
                }));
                setAppointments(formattedAppointments);
              });
            }
          }}
          appointment={selectedAppointment}
        />
      )}
    </div>
  );
};

export default CustomerDashboard;
