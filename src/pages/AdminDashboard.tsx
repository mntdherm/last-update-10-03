import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUser, getVendor, deleteUser, deleteVendor } from '../lib/db';
import { collection, query, getDocs, where, orderBy, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { User, Vendor, Appointment } from '../types/database';
import { Users, Store, Star, Ban, CheckCircle, XCircle, Search, Filter, ChevronDown, BarChart, Activity, Coins, X, Check, MessageSquare } from 'lucide-react';
import AdminReports from '../components/AdminReports';
import VendorDialog from '../components/VendorDialog';
import SupportList from '../components/SupportList';
import AccountLogsDialog from '../components/AccountLogsDialog';
import CoinManagementDialog from '../components/CoinManagementDialog';
import SystemHealthMonitor from '../components/SystemHealthMonitor';

const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUserForCoins, setSelectedUserForCoins] = useState<User | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [userAppointments, setUserAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'vendors' | 'reports' | 'system' | 'support'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'banned'>('all');

  const handleUserClick = async (user: User) => {
    try {
      setSelectedUser(user);
      // Fetch user's appointments if they are a customer
      if (user.role === 'customer') {
        const appointmentsQuery = query(
          collection(db, 'appointments'),
          where('customerId', '==', user.id),
          orderBy('date', 'desc')
        );
        const appointmentsSnapshot = await getDocs(appointmentsQuery);
        const appointments = appointmentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Appointment[];
        setUserAppointments(appointments);
      }
    } catch (err) {
      console.error('Error fetching user appointments:', err);
      setError('Virhe käyttäjän tietojen haussa');
    }
  };
  useEffect(() => {
    const loadData = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);
        setError(null);

        // Check if user is admin
        const adminUser = await getUser(currentUser.uid);
        if (!adminUser || adminUser.role !== 'admin') {
          setError('Ei käyttöoikeutta');
          return;
        }

        // Load users
        const usersQuery = query(
          collection(db, 'users'),
          orderBy('createdAt', 'desc')
        );
        const usersSnapshot = await getDocs(usersQuery);
        const usersData = usersSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        })) as User[];
        setUsers(usersData);

        // Load vendors
        const vendorsQuery = query(
          collection(db, 'vendors'),
          orderBy('createdAt', 'desc')
        );
        const vendorsSnapshot = await getDocs(vendorsQuery);
        const vendorsData = vendorsSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        })) as Vendor[];
        setVendors(vendorsData);

      } catch (err) {
        console.error('Error loading admin data:', err);
        setError('Virhe tietojen latauksessa');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

  const handleBanUser = async (userId: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        banned: true,
        updatedAt: serverTimestamp()
      });
      
      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, banned: true }
          : user
      ));
      
      // Close any open dialogs
      setSelectedUser(null);
      setSelectedVendor(null);
    } catch (err) {
      console.error('Error banning user:', err);
      setError('Virhe käyttäjän estämisessä');
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        banned: false,
        updatedAt: serverTimestamp()
      });
      
      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, banned: false }
          : user
      ));
    } catch (err) {
      console.error('Error unbanning user:', err);
      setError('Virhe käyttäjän eston poistossa');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      await deleteUser(userId);
      
      // Update local state
      setUsers(prev => prev.filter(user => user.id !== userId));
      setShowDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Virhe käyttäjän poistossa');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVendor = async (vendorId: string, userId: string) => {
    try {
      setLoading(true);
      setError(null);
      await deleteVendor(vendorId);
      await deleteUser(userId);
      
      // Update local state
      setVendors(prev => prev.filter(vendor => vendor.id !== vendorId));
      setUsers(prev => prev.filter(user => user.id !== userId));
      setShowDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting vendor:', err);
      setError('Virhe yrityksen poistossa');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyVendor = async (vendorId: string) => {
    try {
      const vendorRef = doc(db, 'vendors', vendorId);
      setError(null);
      
      await updateDoc(vendorRef, {
        verified: true,
        updatedAt: serverTimestamp()
      });
      
      // Update local state
      setVendors(prev => prev.map(vendor => 
        vendor.id === vendorId 
          ? { ...vendor, verified: true }
          : vendor
      ));
    } catch (err) {
      setError('Virhe yrityksen vahvistuksessa. Yritä uudelleen.');
      console.error('Error verifying vendor:', err);
      setError('Virhe yrityksen vahvistuksessa');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'banned') return matchesSearch && user.banned;
    return matchesSearch && !user.banned;
  });

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = 
      vendor.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.email?.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'banned') return matchesSearch && vendor.banned;
    return matchesSearch && !vendor.banned;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Virhe!</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-2xl font-bold text-gray-900">Ylläpito</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-medium">Käyttäjät</h3>
                  <p className="text-gray-500">Yhteensä</p>
                </div>
              </div>
              <span className="text-2xl font-bold">{users.length}</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Store className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-medium">Yritykset</h3>
                  <p className="text-gray-500">Yhteensä</p>
                </div>
              </div>
              <span className="text-2xl font-bold">{vendors.length}</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Star className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-medium">Arvostelut</h3>
                  <p className="text-gray-500">Keskiarvo</p>
                </div>
              </div>
              <span className="text-2xl font-bold">4.5</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('users')}
                className={`py-4 px-6 inline-flex items-center border-b-2 font-medium text-sm
                  ${activeTab === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <Users className="w-5 h-5 mr-2" />
                Käyttäjät
              </button>
              <button
                onClick={() => setActiveTab('vendors')}
                className={`py-4 px-6 inline-flex items-center border-b-2 font-medium text-sm
                  ${activeTab === 'vendors'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <Store className="w-5 h-5 mr-2" />
                Yritykset
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`py-4 px-6 inline-flex items-center border-b-2 font-medium text-sm
                  ${activeTab === 'reports'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <BarChart className="w-5 h-5 mr-2" />
                Raportit
              </button>
              <button
                onClick={() => setActiveTab('system')}
                className={`py-4 px-6 inline-flex items-center border-b-2 font-medium text-sm
                  ${activeTab === 'system'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <Activity className="w-5 h-5 mr-2" />
                Järjestelmä
              </button>
              <button
                onClick={() => setActiveTab('support')}
                className={`py-4 px-6 inline-flex items-center border-b-2 font-medium text-sm
                  ${activeTab === 'support'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <MessageSquare className="w-5 h-5 mr-2" />
                Tukipyynnöt
              </button>
            </nav>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Hae..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button
                  className="px-4 py-2 border border-gray-300 rounded-lg inline-flex items-center text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  {filterStatus === 'all' ? 'Kaikki' : 
                   filterStatus === 'banned' ? 'Estetyt' : 'Aktiiviset'}
                  <ChevronDown className="w-4 h-4 ml-2" />
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 hidden">
                  <button
                    onClick={() => setFilterStatus('all')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Kaikki
                  </button>
                  <button
                    onClick={() => setFilterStatus('active')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Aktiiviset
                  </button>
                  <button
                    onClick={() => setFilterStatus('banned')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Estetyt
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* List */}
        {activeTab === 'reports' ? (
          <AdminReports />
        ) : activeTab === 'system' ? (
          <SystemHealthMonitor />
        ) : activeTab === 'support' ? (
          <SupportList />
        ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {activeTab === 'users' ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Käyttäjä
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rooli
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kolikot
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tila
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Toiminnot
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map(user => (
                    <tr key={user.id}>
                      <td 
                        className="px-6 py-4 whitespace-nowrap cursor-pointer hover:bg-gray-50"
                        onClick={() => handleUserClick(user)}
                      >
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <Users className="h-6 w-6 text-gray-500" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${user.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800'
                            : user.role === 'vendor'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.wallet?.coins || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          {user.banned ? (
                            <button
                              onClick={() => handleUnbanUser(user.id)}
                              className="text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded-full"
                            >
                              <Check className="h-5 w-5" />
                            </button>
                          ) : (
                            <>
                          <button
                            onClick={() => setSelectedUserForCoins(user)}
                            className="text-yellow-600 hover:text-yellow-900 p-1 hover:bg-yellow-50 rounded-full"
                          >
                            <Coins className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleBanUser(user.id)}
                            className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded-full"
                          >
                            <Ban className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(user.id)}
                            className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded-full"
                          >
                            <X className="h-5 w-5" />
                          </button>
                          </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.banned ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Estetty
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Aktiivinen
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleBanUser(user.id)}
                          className={`text-red-600 hover:text-red-900 ${user.banned ? 'hidden' : ''}`}
                        >
                          <Ban className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Yritys
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sijainti
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Arvosana
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tila
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Toiminnot
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredVendors.map(vendor => (
                    <tr key={vendor.id}>
                      <td 
                        className="px-6 py-4 whitespace-nowrap cursor-pointer hover:bg-gray-50"
                        onClick={() => handleUserClick(vendors.find(v => v.userId === vendor.userId)!)}
                      >
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <button
                              onClick={() => setSelectedVendor(vendor)}
                              className="h-10 w-10 rounded-full overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all"
                            >
                              {vendor.logoImage ? (
                                <img
                                  className="h-10 w-10 object-cover"
                                  src={vendor.logoImage}
                                  alt={vendor.businessName}
                                />
                              ) : (
                                <div className="h-10 w-10 bg-gray-200 flex items-center justify-center">
                                  <Store className="h-6 w-6 text-gray-500" />
                                </div>
                              )}
                            </button>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {vendor.businessName}
                              <span className="ml-2 text-sm text-gray-500">
                                ({vendor.businessId})
                              </span>
                            </div>
                            <div className="text-sm text-gray-500">{vendor.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{vendor.address}</div>
                        <div className="text-sm text-gray-500">
                          {vendor.postalCode} {vendor.city}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Star className="h-5 w-5 text-yellow-400" />
                          <span className="ml-1 text-sm text-gray-900">
                            {vendor.rating?.toFixed(1) || '-'}
                          </span>
                          <span className="ml-1 text-sm text-gray-500">
                            ({vendor.ratingCount || 0})
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {vendor.verified ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Vahvistettu
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Odottaa
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          {!vendor.verified && (
                            <button
                              onClick={() => handleVerifyVendor(vendor.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              <CheckCircle className="h-5 w-5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleBanUser(vendor.userId)}
                            className={`text-red-600 hover:text-red-900 ${vendor.banned ? 'hidden' : ''}`}
                          >
                            <Ban className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(vendor.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <XCircle className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>)}
      </div>
      
      {/* Account Logs Dialog */}
      {selectedUser && (
        <AccountLogsDialog
          isOpen={!!selectedUser}
          onClose={() => {
            setSelectedUser(null);
            setUserAppointments([]);
          }}
          user={selectedUser}
          appointments={userAppointments}
        />
      )}
      
      {/* Vendor Dialog */}
      {selectedVendor && (
        <VendorDialog
          isOpen={!!selectedVendor}
          onClose={() => setSelectedVendor(null)}
          vendor={selectedVendor}
          onVerify={handleVerifyVendor}
          onBan={handleBanUser}
        />
      )}
      
      {/* Coin Management Dialog */}
      {selectedUserForCoins && (
        <CoinManagementDialog
          isOpen={!!selectedUserForCoins}
          onClose={() => setSelectedUserForCoins(null)}
          user={selectedUserForCoins}
          onCoinsUpdated={async () => {
            // Refresh user data
            const updatedUser = await getUser(selectedUserForCoins.id);
            if (updatedUser) {
              setUsers(prev => prev.map(u => 
                u.id === selectedUserForCoins.id ? updatedUser : u
              ));
            }
          }}
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Vahvista poisto</h3>
            <p className="text-gray-600 mb-6">
              Oletko varma että haluat poistaa tämän {
                vendors.find(v => v.id === showDeleteConfirm) ? 'yrityksen' : 'käyttäjän'
              }? Tätä toimintoa ei voi perua.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Peruuta
              </button>
              <button
                onClick={() => {
                  const vendor = vendors.find(v => v.id === showDeleteConfirm);
                  if (vendor) {
                    handleDeleteVendor(vendor.id, vendor.userId);
                  } else {
                    handleDeleteUser(showDeleteConfirm);
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Poista
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
