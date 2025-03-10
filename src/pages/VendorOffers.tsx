import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getVendor, getVendorServices, getVendorOffers } from '../lib/db';
import type { Vendor, Service, Offer } from '../types/database';
import { Plus, Calendar, Percent, Clock, Tag, Loader2, AlertCircle, Package } from 'lucide-react';
import OfferDialog from '../components/OfferDialog';
import { format } from 'date-fns';
import { fi } from 'date-fns/locale';

const VendorOffers = () => {
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollPosition(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { currentUser } = useAuth();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);
        setError(null);

        const vendorData = await getVendor(currentUser.uid);
        if (!vendorData) {
          setError('Yritystä ei löytynyt');
          return;
        }

        const [servicesData, offersData] = await Promise.all([
          getVendorServices(vendorData.id),
          getVendorOffers(vendorData.id)
        ]);

        setVendor(vendorData);
        setServices(servicesData);
        setOffers(offersData);
      } catch (err) {
        console.error('Error loading vendor data:', err);
        setError('Virhe tietojen latauksessa');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

  const handleRefreshOffers = async () => {
    if (!vendor) return;
    
    try {
      const offersData = await getVendorOffers(vendor.id);
      setOffers(offersData);
    } catch (err) {
      console.error('Error refreshing offers:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          <span>Ladataan...</span>
        </div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-lg font-medium text-center text-gray-900 mb-2">Virhe</h3>
          <p className="text-gray-600 text-center">{error || 'Yritystä ei löytynyt'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* iOS-style sticky header */}
      <div className={`fixed md:relative top-0 left-0 right-0 z-[45] transition-all duration-300 
        ${scrollPosition > 20 ? 'bg-white/90 backdrop-blur-lg shadow-sm' : 'bg-white/50 backdrop-blur-sm'}`}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-2xl font-bold transition-all duration-300 ${
                scrollPosition > 20 ? 'text-gray-900' : 'text-gray-800'
              }`}>
                Tarjoukset
              </h1>
              <p className="text-sm text-gray-500 mt-1">Hallitse yrityksesi tarjouksia</p>
            </div>
            <button
              onClick={() => {
                setSelectedOffer(null);
                setIsOfferDialogOpen(true);
              }}
              className="flex items-center px-4 py-2 bg-bilo-silver text-bilo-navy rounded-xl hover:bg-bilo-silver/90 
                transition-all duration-300 transform hover:scale-105 active:scale-95"
            >
              <Plus className="w-5 h-5 mr-2" />
              <span className="font-medium">Lisää tarjous</span>
            </button>
          </div>
        </div>
      </div>
      {/* Quick Stats */}
      <div className="pt-24 md:pt-6 pb-6 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 border border-bilo-gray/50">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-bilo-gray rounded-xl">
                  <Tag className="w-6 h-6 text-bilo-navy" />
                </div>
                <span className="text-2xl font-bold text-bilo-navy">
                  {offers.filter(o => o.active).length}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-600">Aktiiviset</p>
            </div>
            
            <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 border border-bilo-gray/50">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-bilo-gray rounded-xl">
                  <Package className="w-6 h-6 text-bilo-navy" />
                </div>
                <span className="text-2xl font-bold text-bilo-navy">
                  {services.length}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-600">Palvelut</p>
            </div>
          </div>
        </div>
      </div>

      {/* Offers Grid */}
      <div className="px-4 md:px-6 pb-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {offers.map(offer => {
          const service = services.find(s => s.id === offer.serviceId);
          const isActive = offer.active && new Date(offer.startDate) <= new Date() && new Date(offer.endDate) >= new Date();
          
          return (
            <div 
              key={offer.id}
              onClick={() => {
                setSelectedOffer(offer);
                setIsOfferDialogOpen(true);
              }}
              className={`bg-white rounded-2xl shadow-sm p-6 cursor-pointer hover:shadow-md transition-all duration-300
                transform hover:-translate-y-1 border ${
                isActive ? 'border-bilo-emerald/50' : 'border-bilo-gray/50'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Tag className={`w-5 h-5 ${isActive ? 'text-bilo-emerald' : 'text-bilo-silver'}`} />
                  <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                    isActive 
                      ? 'bg-bilo-emerald/10 text-bilo-emerald'
                      : 'bg-bilo-gray text-bilo-navy'
                  }`}>
                    {isActive ? 'Aktiivinen' : 'Ei aktiivinen'}
                  </span>
                </div>
                <div className="flex items-center bg-bilo-gray text-bilo-navy px-2 py-1 rounded-full">
                  <Percent className="w-4 h-4 mr-1" />
                  <span className="text-sm font-medium">{offer.discountPercentage}%</span>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">{offer.title}</h3>
              <p className="text-gray-600 text-sm mb-4">{offer.description}</p>

              {service && (
                <div className="bg-bilo-gray/50 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{service.name}</span>
                    <div className="flex items-center text-gray-500">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>{service.duration} min</span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-gray-600">Normaalihinta:</span>
                    <span className="line-through">{service.price}€</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span className="text-gray-900">Tarjoushinta:</span>
                    <span className="text-bilo-navy font-bold">
                      {(service.price * (1 - offer.discountPercentage / 100)).toFixed(2)}€
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>{format(new Date(offer.startDate), 'd.M.yyyy', { locale: fi })}</span>
                </div>
                <span>-</span>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>{format(new Date(offer.endDate), 'd.M.yyyy', { locale: fi })}</span>
                </div>
              </div>
            </div>
          );
        })}

        {offers.length === 0 && (
          <div className="col-span-full bg-gradient-to-br from-white to-bilo-gray/20 rounded-2xl p-12 text-center
            transform transition-all duration-500 hover:shadow-lg hover:scale-[1.01] border border-bilo-silver/10">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 bg-bilo-silver/20 rounded-full blur-xl animate-pulse"></div>
              <div className="relative bg-white rounded-full p-4 shadow-lg">
                <Tag className="w-12 h-12 text-bilo-navy transition-transform duration-300 transform hover:scale-110" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-bilo-navy mb-3">Ei tarjouksia</h3>
            <p className="text-gray-600 mb-8 max-w-sm mx-auto">
              Lisää ensimmäinen tarjous klikkaamalla "Lisää tarjous" -painiketta
            </p>
            <button
              onClick={() => {
                setSelectedOffer(null);
                setIsOfferDialogOpen(true);
              }}
              className="inline-flex items-center px-6 py-3 bg-bilo-silver text-bilo-navy rounded-xl
                font-medium transition-all duration-300 transform hover:scale-105 active:scale-95
                shadow-md hover:shadow-xl group"
            >
              <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
              <span className="relative z-10 group-hover:translate-x-0.5 transition-transform">
                Lisää ensimmäinen tarjous
              </span>
            </button>
          </div>
        )}
        </div>
      </div>

      {/* Offer Dialog */}
      {vendor && (
        <OfferDialog
          isOpen={isOfferDialogOpen}
          onClose={() => {
            setIsOfferDialogOpen(false);
            setSelectedOffer(null);
          }}
          offer={selectedOffer}
          vendorId={vendor.id}
          services={services}
          onOfferSaved={handleRefreshOffers}
        />
      )}
    </div>
  );
};

export default VendorOffers;
