import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getVendor, updateVendor } from '../lib/db';
import type { Vendor } from '../types/database';
import { 
  Clock, Save, Loader2, Building, Phone, MapPin, 
  FileText, User, Mail, Globe, Info, Image as ImageIcon 
} from 'lucide-react';
import ImageUpload from '../components/ImageUpload';
import OperatingHours from '../components/OperatingHours';

const DAYS = [
  { id: 'monday', label: 'Maanantai' },
  { id: 'tuesday', label: 'Tiistai' },
  { id: 'wednesday', label: 'Keskiviikko' },
  { id: 'thursday', label: 'Torstai' },
  { id: 'friday', label: 'Perjantai' },
  { id: 'saturday', label: 'Lauantai' },
  { id: 'sunday', label: 'Sunnuntai' }
];

const VendorSettings = () => {
  const { currentUser } = useAuth();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Track operating hours status for each day
  const [dayStatus, setDayStatus] = useState<Record<string, 'open' | 'closed' | '24h'>>({});

  const [formData, setFormData] = useState({
    businessName: '',
    description: '',
    address: '',
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
        const vendorData = await getVendor(currentUser.uid);
        if (vendorData) {
          setVendor(vendorData);
          
          // Initialize form data
          setFormData({
            businessName: vendorData.businessName,
            description: vendorData.description || '',
            address: vendorData.address,
            phone: vendorData.phone,
            email: vendorData.email || '',
            website: vendorData.website || '',
            coverImage: vendorData.coverImage || '',
            logoImage: vendorData.logoImage || '',
            operatingHours: vendorData.operatingHours
          });
          
          // Initialize day status based on operating hours
          const initialDayStatus: Record<string, 'open' | 'closed' | '24h'> = {};
          DAYS.forEach(day => {
            const dayHours = vendorData.operatingHours[day.id];
            if (!dayHours) {
              initialDayStatus[day.id] = 'closed';
            } else if (dayHours.open === '00:00' && dayHours.close === '23:59') {
              initialDayStatus[day.id] = '24h';
            } else {
              initialDayStatus[day.id] = 'open';
            }
          });
          setDayStatus(initialDayStatus);
        }
      } catch (err) {
        console.error('Error loading vendor:', err);
        setError('Virhe ladattaessa yrityksen tietoja');
      } finally {
        setLoading(false);
      }
    };

    loadVendorData();
  }, [currentUser]);

  // Handle change in day status (open/closed/24h)
  const handleDayStatusChange = (day: string, status: 'open' | 'closed' | '24h') => {
    setDayStatus(prev => ({
      ...prev,
      [day]: status
    }));
    
    // Update hours based on status
    if (status === 'closed') {
      // Remove hours for closed days
      const newHours = { ...formData.operatingHours };
      delete newHours[day];
      setFormData(prev => ({
        ...prev,
        operatingHours: newHours
      }));
    } else if (status === '24h') {
      // Set 24h for 24h days
      setFormData(prev => ({
        ...prev,
        operatingHours: {
          ...prev.operatingHours,
          [day]: { open: '00:00', close: '23:59' }
        }
      }));
    } else {
      // Ensure open days have default hours if not already set
      if (!formData.operatingHours[day]) {
        setFormData(prev => ({
          ...prev,
          operatingHours: {
            ...prev.operatingHours,
            [day]: { open: '09:00', close: '17:00' }
          }
        }));
      }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      await updateVendor(vendor.id, {
        ...vendor,
        ...formData
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bilo-gray">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bilo-navy"></div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bilo-gray">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-bilo-navy mb-2">Virhe!</h2>
          <p className="text-gray-600">Yritystietoja ei löytynyt</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 bg-bilo-gray min-h-screen font-ubuntu">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-bilo-navy">Yrityksen asetukset</h1>
        <p className="mt-2 text-gray-600">Hallitse yrityksesi tietoja ja aukioloaikoja</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. KUVAT (IMAGES) SECTION */}
        <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-6 border border-gray-100">
          <div className="flex items-center mb-6">
            <span className="bg-bilo-gray/50 p-2 rounded-lg mr-3">
              <ImageIcon className="h-5 w-5 text-bilo-silver" />
            </span>
            <h2 className="text-xl font-semibold text-bilo-navy">Kuvat</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-bilo-navy mb-2">Logo</label>
              <div className="bg-bilo-gray/50 p-4 rounded-xl transition duration-300 hover:shadow-md">
                <ImageUpload
                  type="logo"
                  currentImage={formData.logoImage}
                  onImageUploaded={(url) => handleImageUploaded('logo', url)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-bilo-navy mb-2">Kansikuva</label>
              <div className="bg-bilo-gray/50 p-4 rounded-xl transition duration-300 hover:shadow-md">
                <ImageUpload
                  type="cover"
                  currentImage={formData.coverImage}
                  onImageUploaded={(url) => handleImageUploaded('cover', url)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. PERUSTIEDOT (BASIC INFO) SECTION */}
        <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-6 border border-gray-100">
          <div className="flex items-center mb-6">
            <span className="bg-bilo-gray/50 p-2 rounded-lg mr-3">
              <Info className="h-5 w-5 text-bilo-silver" />
            </span>
            <h2 className="text-xl font-semibold text-bilo-navy">Perustiedot</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-bilo-navy mb-2">Yrityksen nimi</label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                  className="w-full px-4 py-3 bg-bilo-gray/50 border-2 border-transparent rounded-xl focus:border-bilo-silver focus:ring-2 focus:ring-bilo-silver/20 focus:bg-white transition-all duration-300"
                  placeholder="Yrityksen nimi"
                />
                <Building className="absolute right-3 top-1/2 transform -translate-y-1/2 text-bilo-silver/70 h-5 w-5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-bilo-navy mb-2">Kuvaus</label>
              <div className="relative">
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 bg-bilo-gray/50 border-2 border-transparent rounded-xl focus:border-bilo-silver focus:ring-2 focus:ring-bilo-silver/20 focus:bg-white transition-all duration-300"
                  placeholder="Kerro lyhyesti yrityksestäsi"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Kuvaa lyhyesti yrityksesi palvelut ja vahvuudet. Hyvä kuvaus auttaa asiakkaita löytämään palvelusi.</p>
            </div>
          </div>
        </div>

        {/* 3. SIJAINTI (LOCATION) SECTION */}
        <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-6 border border-gray-100">
          <div className="flex items-center mb-6">
            <span className="bg-bilo-gray/50 p-2 rounded-lg mr-3">
              <MapPin className="h-5 w-5 text-bilo-silver" />
            </span>
            <h2 className="text-xl font-semibold text-bilo-navy">Sijainti</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-bilo-navy mb-2">Osoite</label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-4 py-3 bg-bilo-gray/50 border-2 border-transparent rounded-xl focus:border-bilo-silver focus:ring-2 focus:ring-bilo-silver/20 focus:bg-white transition-all duration-300"
                  placeholder="Yrityksen osoite"
                />
                <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 text-bilo-silver/70 h-5 w-5 pointer-events-none" />
              </div>
              <p className="mt-1 text-xs text-gray-500">Anna tarkka katuosoite, jotta asiakkaat löytävät perille helposti.</p>
            </div>
          </div>
        </div>

        {/* 4. YHTEYSTIEDOT (CONTACT INFORMATION) SECTION */}
        <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-6 border border-gray-100">
          <div className="flex items-center mb-6">
            <span className="bg-bilo-gray/50 p-2 rounded-lg mr-3">
              <Phone className="h-5 w-5 text-bilo-silver" />
            </span>
            <h2 className="text-xl font-semibold text-bilo-navy">Yhteystiedot</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-bilo-navy mb-2">Puhelinnumero</label>
              <div className="relative">
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-3 bg-bilo-gray/50 border-2 border-transparent rounded-xl focus:border-bilo-silver focus:ring-2 focus:ring-bilo-silver/20 focus:bg-white transition-all duration-300"
                  placeholder="+358 40 1234567"
                />
                <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-bilo-silver/70 h-5 w-5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-bilo-navy mb-2">Sähköposti</label>
              <div className="relative">
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 bg-bilo-gray/50 border-2 border-transparent rounded-xl focus:border-bilo-silver focus:ring-2 focus:ring-bilo-silver/20 focus:bg-white transition-all duration-300"
                  placeholder="yritys@esimerkki.fi"
                />
                <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-bilo-silver/70 h-5 w-5 pointer-events-none" />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-bilo-navy mb-2">Verkkosivusto</label>
              <div className="relative">
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  className="w-full px-4 py-3 bg-bilo-gray/50 border-2 border-transparent rounded-xl focus:border-bilo-silver focus:ring-2 focus:ring-bilo-silver/20 focus:bg-white transition-all duration-300"
                  placeholder="https://www.yrityksesi.fi"
                />
                <Globe className="absolute right-3 top-1/2 transform -translate-y-1/2 text-bilo-silver/70 h-5 w-5 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* 5. AUKIOLOAJAT (OPERATING HOURS) SECTION */}
        <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-6 border border-gray-100">
          <div className="flex items-center mb-6">
            <span className="bg-bilo-gray/50 p-2 rounded-lg mr-3">
              <Clock className="h-5 w-5 text-bilo-silver" />
            </span>
            <h2 className="text-xl font-semibold text-bilo-navy">Aukioloajat</h2>
          </div>
          
          <OperatingHours
            operatingHours={formData.operatingHours}
            dayStatus={dayStatus}
            onStatusChange={handleDayStatusChange}
            onHoursChange={handleHoursChange}
          />
        </div>

        {/* Error and Success Messages */}
        {error && (
          <div className="bg-red-50 backdrop-blur-sm border border-red-100 rounded-xl p-4 shadow-sm animate-fadeIn">
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
          <div className="bg-bilo-emerald/10 backdrop-blur-sm border border-bilo-emerald/20 rounded-xl p-4 shadow-sm animate-fadeIn">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-bilo-emerald" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-bilo-emerald">Muutokset tallennettu onnistuneesti!</p>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center px-6 py-3 rounded-xl bg-gradient-to-b from-bilo-silver to-[#A8A8A8] text-bilo-navy font-medium shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.03] active:scale-95 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-bilo-silver focus:ring-offset-2"
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
      </form>
    </div>
  );
};

export default VendorSettings;
