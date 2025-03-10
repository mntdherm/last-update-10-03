import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapPin, Star, Clock, ChevronRight, Loader2, AlertCircle, Search, ArrowRight } from 'lucide-react';
import { searchVendors, getVendorServices, getRecommendedServices, getVendorOffers } from '../lib/db';
import type { Vendor, Service, Offer } from '../types/database';
import { format } from 'date-fns';
import { fi } from 'date-fns/locale';
import Map from '../components/Map';
import SearchBar from '../components/SearchBar';

const SearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const query = searchParams.get('q') || '';
  const cityFilter = searchParams.get('city') || '';

  const [results, setResults] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vendorServices, setVendorServices] = useState<Record<string, Service[]>>({});
  const [hasVendorsInCity, setHasVendorsInCity] = useState(true);
  const [vendorOffers, setVendorOffers] = useState<Record<string, Offer[]>>({});
  const [recommendedServices, setRecommendedServices] = useState<Service[]>([]);
  const [searchQuery, setSearchQuery] = useState(query);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);

  const handleNewSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  useEffect(() => {
    const fetchResults = async () => {
      try {
        if (!query) return;

        setLoading(true);
        setError(null);
        
        const vendors = await searchVendors(query);
        
        // Check if we have any vendors in the selected city
        if (cityFilter && vendors.length === 0) {
          setHasVendorsInCity(false);
          setResults([]);
          return;
        }
        
        setResults(vendors); 

        // Get recommended services
        const recommended = await getRecommendedServices();
        setRecommendedServices(recommended);

        if (vendors.length > 0) {
          const vendorPromises = vendors.map(async vendor => {
            const [services, offers] = await Promise.all([
              getVendorServices(vendor.id),
              getVendorOffers(vendor.id)
            ]);
            return {
              vendorId: vendor.id,
              services,
              offers: offers.filter(o => o.active)
            };
          });

          const results = await Promise.all(vendorPromises);
          const servicesMap: Record<string, Service[]> = {};
          const offersMap: Record<string, Offer[]> = {};
          results.forEach(({ vendorId, services, offers }) => {
            servicesMap[vendorId] = services;
            offersMap[vendorId] = offers;
          });
          setVendorServices(servicesMap);
          setVendorOffers(offersMap);
        }

      } catch (err) {
        console.error('Error fetching results:', err);
        setError('Hakutuloksia ei voitu ladata. Yritä hetken kuluttua uudelleen.');
      } finally {
        setLoading(false);
      }
    };

    if (query) {
      fetchResults();
    }
  }, [query]);

  const getCurrentDayHours = (vendor: Vendor) => {
    const today = format(new Date(), 'EEEE', { locale: fi }).toLowerCase();
    return vendor.operatingHours[today] || vendor.operatingHours.monday;
  };

  const handleBooking = (vendorId: string) => {
    navigate(`/vendor/${vendorId}`);
  };

  const handleVendorSelect = (vendorId: string) => {
    setSelectedVendorId(vendorId);
    const element = document.getElementById(`vendor-${vendorId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getServiceDiscount = (vendorId: string, service: Service) => {
    const offers = vendorOffers[vendorId] || [];
    const activeOffer = offers.find(o => 
      o.serviceId === service.id && 
      new Date(o.startDate) <= new Date() && 
      new Date(o.endDate) >= new Date()
    );
    return activeOffer?.discountPercentage || 0;
  };

  const getDiscountedPrice = (vendorId: string, service: Service) => {
    const discount = getServiceDiscount(vendorId, service);
    return discount > 0 
      ? service.price * (1 - discount / 100)
      : service.price;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2 text-blue-600">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Haetaan tuloksia...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-lg font-medium text-center text-gray-900 mb-2">Virhe haussa</h3>
          <p className="text-gray-600 text-center mb-4">{error}</p>
          <div className="flex justify-center">
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Yritä uudelleen
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50/50 to-gray-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Search Bar */}
          <div className="max-w-3xl mx-auto mb-8">
            <SearchBar 
              selectedCity={cityFilter}
              onCityChange={(city) => {
                const params = new URLSearchParams(location.search);
                if (city) {
                  params.set('city', city);
                } else {
                  params.delete('city');
                }
                window.location.href = `/search?${params.toString()}`;
              }}
            />
          </div>
          
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 shadow-sm">
              <span className="text-gray-600 mr-2">🔍</span>
              <span className="font-medium text-gray-900">{query}</span>
            </div>
            
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3 text-sm">
              <div className="flex items-center text-gray-600">
                <MapPin className="w-4 h-4 mr-1.5 text-gray-400" />
                {cityFilter ? cityFilter : 'Kaikki kaupungit'}
              </div>
              <div className="hidden sm:block text-gray-300">•</div>
              <div className="flex items-center text-gray-600">
                <Search className="w-4 h-4 mr-1.5 text-gray-400" />
                {results.length > 0 
                  ? `${results.length} autopesupalvelua löytyi`
                  : 'Ei hakutuloksia'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 pt-4 pb-8">
        <div>
          <div>
            {!hasVendorsInCity ? (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Tulossa pian kaupunkiin {cityFilter}!
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Emme vielä tarjoa palveluja tässä kaupungissa, mutta laajennamme toimintaamme jatkuvasti. 
                  Pysy kuulolla!
                </p>
                <button
                  onClick={() => {
                    const params = new URLSearchParams(location.search);
                    params.delete('city');
                    navigate(`/search?${params.toString()}`);
                  }}
                  className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Näytä kaikki palvelut
                </button>
              </div>
            ) : results.length === 0 ? (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-6 w-6 text-yellow-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        Valitettavasti emme löytäneet hakusanalla "{query}" yhtään palvelua
                      </h3>
                      <p className="mt-2 text-gray-600">
                        Tässä kuitenkin suosittelemiamme palveluita:
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 divide-y divide-gray-200">
                    {recommendedServices.map(service => (
                      <div key={service.id} className="py-4 first:pt-0 last:pb-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-lg font-medium text-gray-900">{service.name}</h4>
                            <p className="mt-1 text-sm text-gray-600">{service.description}</p>
                            <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                {service.duration} min
                              </span>
                              <div className="flex flex-col items-end">
                                {getServiceDiscount(service.vendorId, service) > 0 && (
                                  <span className="text-sm text-gray-500 line-through">
                                    {service.price}€
                                  </span>
                                )}
                                <span className={`font-medium ${
                                  getServiceDiscount(service.vendorId, service) > 0 ? 'text-green-600' : 'text-blue-600'
                                }`}>
                                  {getDiscountedPrice(service.vendorId, service).toFixed(2)}€
                                </span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleBooking(service.vendorId)}
                            className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Varaa
                            <ArrowRight className="h-4 w-4 ml-1" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map((vendor) => {
                  const services = vendorServices[vendor.id] || [];
                  const todayHours = getCurrentDayHours(vendor);
                  const isSelected = selectedVendorId === vendor.id;
                  const matchingService = services.find(service => 
                    service.name.toLowerCase().includes(query.toLowerCase()) ||
                    service.description.toLowerCase().includes(query.toLowerCase())
                  );
                  const hasOffers = vendorOffers[vendor.id]?.length > 0;
                  
                  return (
                    <div
                      id={`vendor-${vendor.id}`}
                      key={vendor.id}
                      onClick={() => handleBooking(vendor.id)}
                      className={`bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer select-none transform hover:scale-[1.02] ${
                        isSelected ? 'ring-2 ring-blue-500' : 'border border-gray-100/50 hover:border-blue-200'
                      }`}
                    >
                      <div className="p-4">
                        {/* Header */}
                        <div className="flex items-center space-x-3 mb-3">
                          {/* Offer and Review Badges */}
                          <div className="absolute top-2 right-2 flex flex-col items-end space-y-1">
                            {hasOffers && (
                              <div className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                Tarjous
                              </div>
                            )}
                            {vendor.rating && (
                              <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-full">
                                <Star className="h-3 w-3 text-yellow-400 mr-1" fill="currentColor" />
                                <span className="text-xs font-medium text-yellow-700">{vendor.rating}</span>
                              </div>
                            )}
                          </div>

                          {/* Logo */}
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            <img 
                              src={vendor.logoImage || "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&q=80"} 
                              alt={vendor.businessName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h2 className="text-base font-semibold text-gray-900 truncate">
                                {vendor.businessName}
                              </h2>
                            </div>
                            <div className="flex items-center text-gray-500 text-sm mt-0.5">
                              <MapPin className="h-3 w-3 mr-1" />
                              <span className="truncate">{vendor.address}</span>
                            </div>
                          </div>
                        </div>

                        {/* Matching Service */}
                        {matchingService && (
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-medium text-gray-900 text-sm line-clamp-1">
                                {matchingService.name}
                              </h3>
                              <div className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                todayHours.open === 'closed' && todayHours.close === 'closed'
                                  ? 'bg-red-100 text-red-800'
                                  : todayHours.open === '00:00' && todayHours.close === '23:59'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {todayHours.open === 'closed' && todayHours.close === 'closed'
                                  ? 'Suljettu'
                                  : todayHours.open === '00:00' && todayHours.close === '23:59'
                                  ? '24h'
                                  : `${todayHours.open} - ${todayHours.close}`
                                }
                              </div>
                            </div>
                            <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                              {matchingService.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className="flex items-center text-xs text-gray-600">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {matchingService.duration} min
                                </span>
                                <div className="flex items-center">
                                  {getServiceDiscount(vendor.id, matchingService) > 0 && (
                                    <span className="text-xs text-gray-500 line-through mr-1">
                                      {matchingService.price}€
                                    </span>
                                  )}
                                  <span className={`font-medium text-sm ${
                                    getServiceDiscount(vendor.id, matchingService) > 0 
                                      ? 'text-green-600' 
                                      : 'text-gray-900'
                                  }`}>
                                    {getDiscountedPrice(vendor.id, matchingService).toFixed(2)}€
                                  </span>
                                </div>
                              </div>
                              <button 
                                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium flex items-center hover:bg-blue-700 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBooking(vendor.id);
                                }}
                              >
                                Varaa
                                <ChevronRight className="h-3 w-3 ml-0.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchResults;
