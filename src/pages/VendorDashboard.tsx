import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getVendor, getVendorAppointments, getVendorServices, updateVendor, getServiceCategories, initializeServiceCategories, createService, getDefaultServices } from '../lib/db';
import type { Vendor, Appointment, Service, ServiceCategory } from '../types/database';
import { Calendar, Clock, Settings, BarChart3, Package, Plus, Save, Loader2, MapPin, Phone, Mail, Globe, Clock3, Coins, Car, Armchair, Star, Sparkles, Store, Check, ChevronDown, Edit, Info, Building, User, Award } from 'lucide-react';
import { geocodeAddress } from '../lib/maps';
import AppointmentCalendar from '../components/AppointmentCalendar';
import AppointmentDialog from '../components/AppointmentDialog';
import ServiceCard from '../components/ServiceCard';
import DefaultServices from '../components/DefaultServices';
import ImageUpload from '../components/ImageUpload';
import ServiceDialog from '../components/ServiceDialog';
import OperatingHours from '../components/OperatingHours';
import CategoryDialog from '../components/CategoryDialog';

type Tab = 'services' | 'analytics' | 'settings';
type OperatingStatus = 'open' | 'closed' | '24h';

const VendorDashboard = () => {
  const { currentUser } = useAuth();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('services');
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [dayStatus, setDayStatus] = useState<Record<string, OperatingStatus>>({});
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const refreshCategories = async () => {
    if (vendor) {
      const serviceCategories = await getServiceCategories(vendor.id);
      setCategories(serviceCategories);
    }
  };

  const [formData, setFormData] = useState({
    businessName: '',
    description: '',
    address: '',
    city: '',
    postalCode: '',
    phone: '',
    email: '',
    website: '',
    coverImage: '',
    logoImage: '',
    operatingHours: {} as Vendor['operatingHours']
  });

  useEffect(() => {
    const loadVendorData = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);
        const vendorData = await getVendor(currentUser.uid);
        if (vendorData) {
          setVendor(vendorData);
          setFormData({
            businessName: vendorData.businessName,
            description: vendorData.description || '',
            address: vendorData.address,
            city: vendorData.city || '',
            postalCode: vendorData.postalCode || '',
            phone: vendorData.phone,
            email: vendorData.email || '',
            website: vendorData.website || '',
            coverImage: vendorData.coverImage || '',
            logoImage: vendorData.logoImage || '',
            operatingHours: vendorData.operatingHours
          });

          const initialDayStatus: Record<string, OperatingStatus> = {};
          Object.entries(vendorData.operatingHours).forEach(([day, hours]) => {
            if (!hours || (hours.open === 'closed' && hours.close === 'closed')) {
              initialDayStatus[day] = 'closed';
            } else if (hours.open === '00:00' && hours.close === '23:59') {
              initialDayStatus[day] = '24h';
            } else {
              initialDayStatus[day] = 'open';
            }
          });
          setDayStatus(initialDayStatus);

          const vendorAppointments = await getVendorAppointments(vendorData.id);
          const vendorServices = await getVendorServices(vendorData.id);
          const serviceCategories = await getServiceCategories(vendorData.id);
          
          const formattedAppointments = vendorAppointments.map(appointment => ({
            ...appointment,
            date: new Date(appointment.date.seconds * 1000)
          }));
          
          setAppointments(formattedAppointments);
          setServices(vendorServices);
          setCategories(serviceCategories);
          
          // Initialize first category as expanded
          if (serviceCategories.length > 0) {
            setExpandedCategories({ [serviceCategories[0].id]: true });
          }
        }
      } catch (err) {
        console.error('Error loading vendor data:', err);
        setError('Virhe ladattaessa tietoja');
      } finally {
        setLoading(false);
      }
    };

    loadVendorData();
  }, [currentUser]);

  const handleSaveSettings = async () => {
    if (!vendor) return;

    // Validate required fields
    if (!formData.businessName.trim()) {
      setError('Yrityksen nimi on pakollinen');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      // Only geocode if we have a complete address
      let coordinates = null;
      if (formData.address && formData.postalCode && formData.city) {
        const fullAddress = `${formData.address}, ${formData.postalCode} ${formData.city}`;
        coordinates = await geocodeAddress(fullAddress);
      }

      // Clean up formData to remove any undefined values
      const cleanFormData = Object.fromEntries(
        Object.entries({
          ...formData,
          location: coordinates || undefined
        }).filter(([_, v]) => v !== undefined && v !== '')
      );

      await updateVendor(vendor.id, {
        ...vendor,
        ...cleanFormData,
        ...formData,
        updatedAt: new Date()
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating vendor:', err);
      setError('Virhe tallennettaessa muutoksia');
    } finally {
      setSaving(false);
    }
  };

  const handleHoursChange = (day: string, type: 'open' | 'close', value: string) => {
    setFormData(prev => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: {
          ...prev.operatingHours[day],
          [type]: value
        }
      }
    }));
  };

  const handleStatusChange = (day: string, status: OperatingStatus) => {
    setDayStatus(prev => ({ ...prev, [day]: status }));
    
    let newHours = { open: '', close: '' };
    if (status === 'closed') {
      newHours = { open: 'closed', close: 'closed' };
    } else if (status === '24h') {
      newHours = { open: '00:00', close: '23:59' };
    } else {
      // For 'open' status, keep the existing hours or set defaults
      const existingHours = formData.operatingHours[day];
      newHours = {
        open: existingHours?.open || '09:00',
        close: existingHours?.close || '17:00'
      };
    }

    setFormData(prev => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: newHours
      }
    }));
  };

  const handleImageUploaded = async (type: 'logo' | 'cover', url: string) => {
    try {
      if (!vendor) return;

      const updatedData = {
        ...vendor,
        [type === 'logo' ? 'logoImage' : 'coverImage']: url
      };

      await updateVendor(vendor.id, updatedData);
      setFormData(prev => ({
        ...prev,
        [type === 'logo' ? 'logoImage' : 'coverImage']: url
      }));

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating image:', err);
      setError('Virhe kuvan päivityksessä');
    }
  };

  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const tabs = [
    { id: 'services', label: 'Palvelut', icon: <Package className="w-5 h-5" /> },
    { id: 'analytics', label: 'Analytiikka', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'settings', label: 'Asetukset', icon: <Settings className="w-5 h-5" /> }
  ] as const;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bilo-gray">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bilo-navy"></div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bilo-gray">
        <div className="text-center bg-white rounded-xl shadow-md p-8 ios-glass">
          <h2 className="text-2xl font-bold text-bilo-navy mb-3">Virhe!</h2>
          <p className="text-gray-600">{error || 'Yritystietoja ei löytynyt'}</p>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'services':
        return (
          <div className="animate-fadeIn space-y-8">
            {/* Services Header */}
            <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100 hover:shadow-lg transition-all duration-300 ios-glass">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-bilo-navy">Palvelut</h2>
                  <p className="mt-1 text-gray-600">Hallitse tarjoamiasi palveluita</p>
                </div>
                <button 
                  className="next-step-button flex items-center px-6 py-3 rounded-full font-medium text-bilo-navy hover:text-white transition-all duration-300 active:scale-95 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  onClick={() => {
                    setEditingService(null);
                    setIsServiceDialogOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2 transition-all" />
                  Lisää palvelu
                </button>
              </div>
              
              {/* Quick Stats */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="ios-glass bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                  <div className="flex items-center">
                    <div className="bg-bilo-gray p-3 rounded-full shadow-sm">
                      <Package className="h-6 w-6 text-bilo-navy" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600 font-medium">Palvelut yhteensä</p>
                      <p className="text-2xl font-bold text-bilo-navy">
                        {services.length}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="ios-glass bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                  <div className="flex items-center">
                    <div className="bg-bilo-gray p-3 rounded-full shadow-sm">
                      <Check className="h-6 w-6 text-bilo-emerald" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600 font-medium">Saatavilla</p>
                      <p className="text-2xl font-bold text-bilo-emerald">
                        {services.filter(s => s.available).length}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="ios-glass bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                  <div className="flex items-center">
                    <div className="bg-bilo-gray p-3 rounded-full shadow-sm">
                      <Coins className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600 font-medium">Kolikot yhteensä</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {services.reduce((sum, service) => sum + service.coinReward, 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Services by Category */}
            <div className="space-y-5">
              {categories.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl shadow-md ios-glass">
                  <Package className="w-16 h-16 mx-auto text-bilo-silver mb-4" />
                  <h3 className="text-xl font-medium text-bilo-navy mb-2">Ei palvelukategorioita</h3>
                  <p className="text-gray-500 mb-6">Aloita lisäämällä ensimmäinen palvelusi</p>
                  <button
                    onClick={() => {
                      setEditingService(null);
                      setIsServiceDialogOpen(true);
                    }}
                    className="next-step-button px-6 py-3 rounded-full font-medium text-bilo-navy hover:text-white transition-all duration-300 active:scale-95 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    <Plus className="w-4 h-4 mr-2 inline-block" />
                    Lisää palvelu
                  </button>
                </div>
              ) : (
                categories.map(category => {
                  const categoryServices = services.filter(service => service.categoryId === category.id);
                  const isExpanded = expandedCategories[category.id];
                  
                  return (
                    <div key={category.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 transition-all duration-300 hover:shadow-lg ios-glass">
                      <div
                        onClick={() => toggleCategoryExpansion(category.id)}
                        className="w-full p-6 flex items-center justify-between bg-white cursor-pointer group transition-all duration-300"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-bilo-gray rounded-full shadow-sm group-hover:shadow transition-all duration-300">
                            {category.icon === 'car' && <Car className="w-5 h-5 text-bilo-navy" />}
                            {category.icon === 'armchair' && <Armchair className="w-5 h-5 text-bilo-navy" />}
                            {category.icon === 'star' && <Star className="w-5 h-5 text-bilo-navy" />}
                            {category.icon === 'sparkles' && <Sparkles className="w-5 h-5 text-bilo-navy" />}
                            {category.icon === 'package' && <Package className="w-5 h-5 text-bilo-navy" />}
                          </div>
                          <div className="text-left">
                            <h3 className="font-medium text-bilo-navy flex items-center">
                              {category.name}
                            </h3>
                            <p className="text-sm text-gray-500 mt-0.5">{categoryServices.length} palvelua</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCategory(category);
                            }}
                            className="p-2 text-gray-400 hover:text-bilo-navy opacity-0 group-hover:opacity-100 transition-all duration-300 bg-bilo-gray rounded-full hover:bg-bilo-silver"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isExpanded ? 'transform rotate-180' : ''}`} />
                        </div>
                      </div>
                      
                      <div 
                        className={`transition-all duration-300 overflow-hidden ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
                      >
                        <div className="p-6 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {categoryServices.map(service => (
                              <ServiceCard
                                key={service.id}
                                service={service}
                                onEdit={() => {
                                  setEditingService(service);
                                  setIsServiceDialogOpen(true);
                                }}
                              />
                            ))}
                          </div>
                          
                          {categoryServices.length === 0 && (
                            <div className="text-center py-8 bg-bilo-gray rounded-xl">
                              <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                              <p className="text-gray-500 mb-3">Ei palveluita tässä kategoriassa</p>
                              <button
                                onClick={() => {
                                  setEditingService(null);
                                  setIsServiceDialogOpen(true);
                                }}
                                className="mt-2 px-6 py-3 text-bilo-navy hover:text-white font-medium rounded-full bg-bilo-silver hover:bg-bilo-navy transition-all duration-300 active:scale-95"
                              >
                                <Plus className="w-4 h-4 mr-1 inline-block" />
                                Lisää palvelu
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {vendor && (
              <ServiceDialog
                isOpen={isServiceDialogOpen}
                onClose={() => {
                  setIsServiceDialogOpen(false);
                  setEditingService(null);
                }}
                service={editingService}
                vendorId={vendor.id}
                categories={categories}
                onServiceSaved={async () => {
                  await refreshCategories();
                  const updatedServices = await getVendorServices(vendor.id);
                  setServices(updatedServices);
                }}
              />
            )}
            {editingCategory && (
              <CategoryDialog
                isOpen={!!editingCategory}
                onClose={() => setEditingCategory(null)}
                category={editingCategory}
                onCategorySaved={async () => {
                  await refreshCategories();
                }}
              />
            )}
          </div>
        );
      
      case 'analytics':
        return (
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900">Analytiikka</h2>
              <p className="mt-1 text-gray-600">Seuraa liiketoimintasi kehitystä</p>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold">Varaukset tässä kuussa</h3>
                <p className="text-3xl font-bold mt-2 text-blue-700">
                  {appointments.filter(a => {
                    const now = new Date();
                    const appointmentDate = new Date(a.date);
                    return appointmentDate.getMonth() === now.getMonth();
                  }).length}
                </p>
                <div className="mt-4 flex items-center text-blue-600">
                  <Calendar className="h-5 w-5 mr-2" />
                  <span className="text-sm">Tässä kuussa</span>
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold">Suosituin palvelu</h3>
                <p className="text-3xl font-bold mt-2 text-green-700">
                  {services.length > 0 ? services[0].name : '-'}
                </p>
                <div className="mt-4 flex items-center text-green-600">
                  <Package className="h-5 w-5 mr-2" />
                  <span className="text-sm">Eniten varauksia</span>
                </div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold">Keskimääräinen arvio</h3>
                <p className="text-3xl font-bold mt-2 text-yellow-700">{vendor.rating || '-'}/5</p>
                <div className="mt-4 flex items-center text-yellow-600">
                  <Star className="h-5 w-5 mr-2" />
                  <span className="text-sm">{vendor.ratingCount || 0} arvostelua</span>
                </div>
              </div>
            </div>
            </div>
          </div>
        );
      
      case 'settings':
        return (
          <div className="space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Asetukset</h2>
              <p className="mt-1 text-gray-600">Hallitse yrityksen asetuksia</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold mb-6">Kuvat</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
                  <ImageUpload
                    type="logo"
                    currentImage={formData.logoImage}
                    onImageUploaded={(url) => handleImageUploaded('logo', url)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kansikuva</label>
                  <ImageUpload
                    type="cover"
                    currentImage={formData.coverImage}
                    onImageUploaded={(url) => handleImageUploaded('cover', url)}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold mb-6">Perustiedot</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    <span className="flex items-center">
                      <Package className="w-4 h-4 mr-2" />
                      Yrityksen nimi
                    </span>
                  </label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Kuvaus</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold mb-6">Sijainti</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    <span className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      Katuosoite
                    </span>
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Esim. Esimerkkikatu 123"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    <span className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      Kaupunki
                    </span>
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Esim. Helsinki"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    <span className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      Postinumero
                    </span>
                  </label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, postalCode: e.target.value.toUpperCase() }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Esim. 00100"
                    maxLength={5}
                    pattern="[0-9]{5}"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Syötä 5-numeroinen postinumero
                                  </p>
                </div>
              </div>            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold mb-6">Yhteystiedot</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    <span className                    className="flex items-center">
                      <Phone className="w-4 h-4 mr-2" />
                      Puhelinnumero
                    </span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    <span className="flex items-center">
                      <Mail className="w-4 h-4 mr-2" />
                      Sähköposti
                    </span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    <span className="flex items-center">
                      <Globe className="w-4 h-4 mr-2" />
                      Verkkosivusto
                    </span>
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="https://"
                  />
                </div>
              </div>
            </div>

            <OperatingHours
              operatingHours={formData.operatingHours}
              dayStatus={dayStatus}
              onStatusChange={handleStatusChange}
              onHoursChange={handleHoursChange}
            />

            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border-l-4 border-green-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">Muutokset tallennettu onnistuneesti!</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="flex items-center px-6 py-3 rounded-xl font-medium bg-bilo-silver text-bilo-navy hover:bg-bilo-navy hover:text-white transition-all duration-300 active:scale-95 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50"
              >
                {saving ? (
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
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-bilo-gray">
      {/* Header with notification for unverified vendors */}
      {!vendor.verified && (
        <div className="bg-yellow-50 border-b border-yellow-100">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Yrityksesi odottaa vielä ylläpidon vahvistusta. Yritys ei näy hakutuloksissa ennen vahvistusta.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Company Info Header - Much more compact with iOS-style sections */}
      <div className="bg-white shadow-sm border-b ios-glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          {/* Business Profile Summary Cards - Smaller and no icons in titles */}
          <div className="flex flex-wrap gap-3">
            {/* Logo & Business Name Section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-sm p-3 border border-gray-100 flex-1 transform transition-all duration-300 hover:shadow-md hover:scale-[1.01] min-w-[200px]">
              <div className="flex items-center space-x-3">
                <div className="relative w-10 h-10 bg-bilo-gray rounded-md overflow-hidden border border-white">
                  {vendor.logoImage ? (
                    <img 
                      src={vendor.logoImage} 
                      alt={vendor.businessName}
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-bilo-silver/20">
                      <Building className="w-5 h-5 text-bilo-silver" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center">
                    <h1 className="text-base font-bold text-bilo-navy">{vendor.businessName}</h1>
                    {vendor.verified && (
                      <div className="ml-1 bg-bilo-emerald/10 p-0.5 rounded-full">
                        <Check className="h-3 w-3 text-bilo-emerald" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <Store className="h-3 w-3 mr-1 text-bilo-navy/60" />
                    <span>{vendor.businessId}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Contact Info Section - Without icon in title */}
            <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-sm p-3 border border-gray-100 flex-1 transform transition-all duration-300 hover:shadow-md hover:scale-[1.01] min-w-[200px]">
              <div className="flex flex-col h-full">
                <h3 className="text-xs font-medium text-bilo-navy mb-2">Yhteystiedot</h3>
                <div className="space-y-1">
                  <div className="flex items-center">
                    <Phone className="h-3 w-3 mr-1.5 text-gray-500" />
                    <span className="text-xs text-gray-600">{vendor.phone}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="h-3 w-3 mr-1.5 text-gray-500" />
                    <span className="text-xs text-gray-600">{vendor.email}</span>
                  </div>
                  {vendor.website && (
                    <div className="flex items-center">
                      <Globe className="h-3 w-3 mr-1.5 text-gray-500" />
                      <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:text-blue-800 truncate">
                        {vendor.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Address & Location Section - Without icon in title */}
            <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-sm p-3 border border-gray-100 flex-1 transform transition-all duration-300 hover:shadow-md hover:scale-[1.01] min-w-[200px]">
              <div className="flex flex-col h-full">
                <h3 className="text-xs font-medium text-bilo-navy mb-2">Toimipisteen sijainti</h3>
                <div>
                  <div className="flex">
                    <MapPin className="h-3 w-3 mr-1.5 text-gray-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-600">{vendor.address}</p>
                      <p className="text-xs text-gray-600">{vendor.postalCode} {vendor.city}</p>
                    </div>
                  </div>
                  <div className="flex items-center mt-1">
                    <Clock className="h-3 w-3 mr-1.5 text-gray-500" />
                    <span className="text-xs text-gray-600">
                      {vendor.operatingHours?.monday?.open === 'closed' && vendor.operatingHours?.monday?.close === 'closed'
                        ? 'Suljettu tänään'
                        : vendor.operatingHours?.monday?.open === '00:00' && vendor.operatingHours?.monday?.close === '23:59'
                        ? 'Avoinna 24h'
                        : `Avoinna: ${vendor.operatingHours?.monday?.open || '09:00'} - ${vendor.operatingHours?.monday?.close || '17:00'}`
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Stats Cards - More compact version */}
          <div className="mt-3 flex flex-wrap gap-3">
            <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-sm p-2 border border-gray-100 transition-all duration-300 hover:shadow-md hover:bg-white/90 hover:scale-[1.01] flex-1 min-w-[100px]">
              <div className="flex items-center">
                <div className="bg-bilo-gray/60 p-1.5 rounded-md">
                  <Calendar className="h-3 w-3 text-bilo-navy/80" />
                </div>
                <div className="ml-2">
                  <p className="text-base font-bold text-bilo-navy">
                    {appointments.filter(a => a.status === 'confirmed').length}
                  </p>
                  <p className="text-[10px] text-gray-500">Tulevat varaukset</p>
                </div>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-sm p-2 border border-gray-100 transition-all duration-300 hover:shadow-md hover:bg-white/90 hover:scale-[1.01] flex-1 min-w-[100px]">
              <div className="flex items-center">
                <div className="bg-bilo-gray/60 p-1.5 rounded-md">
                  <Package className="h-3 w-3 text-bilo-navy/80" />
                </div>
                <div className="ml-2">
                  <p className="text-base font-bold text-bilo-emerald">
                    {services.filter(s => s.available).length}
                  </p>
                  <p className="text-[10px] text-gray-500">Aktiiviset palvelut</p>
                </div>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-sm p-2 border border-gray-100 transition-all duration-300 hover:shadow-md hover:bg-white/90 hover:scale-[1.01] flex-1 min-w-[100px]">
              <div className="flex items-center">
                <div className="bg-bilo-gray/60 p-1.5 rounded-md">
                  <Star className="h-3 w-3 text-bilo-navy/80" />
                </div>
                <div className="ml-2">
                  <p className="text-base font-bold text-yellow-600">
                    {vendor.rating || '-'}/5
                  </p>
                  <p className="text-[10px] text-gray-500">Arvosana</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mt-6 bg-white rounded-xl shadow-md overflow-x-auto backdrop-blur-sm ios-glass">
          <nav className="flex p-2 min-w-max" aria-label="Tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex-1 inline-flex items-center justify-center py-4 px-6 rounded-xl font-medium text-sm transition-all duration-300 whitespace-nowrap transform active:scale-95
                  ${activeTab === tab.id
                    ? 'bg-bilo-silver text-bilo-navy shadow-md'
                    : 'text-gray-600 hover:text-bilo-navy hover:bg-bilo-gray'
                  }
                `}
              >
                <span className={`mr-3 transition-colors duration-300 ${activeTab === tab.id ? 'text-bilo-navy' : 'text-gray-400'}`}>
                  {tab.icon}
                </span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="py-8">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;
