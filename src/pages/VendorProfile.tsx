import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, Star, Clock, Calendar, Shield, Award, Tag, Percent, ChevronRight, Coins, Package } from 'lucide-react';
import { getVendor, getVendorServices, getServiceCategories, getVendorOffers } from '../lib/db';
import type { Vendor, Service, ServiceCategory, Offer } from '../types/database';
import { format } from 'date-fns';
import { fi } from 'date-fns/locale';
import BookingModal from '../components/BookingModal';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../contexts/AuthContext';

const VendorProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [availableCategories, setAvailableCategories] = useState<ServiceCategory[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [highlightedService, setHighlightedService] = useState<string | null>(null);
  const coverRef = useRef<HTMLDivElement>(null);
  const categoryRefs = useRef<{[key: string]: HTMLDivElement | null}>({});

  useEffect(() => {
    const loadVendorData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const vendorData = await getVendor(id);
        const [servicesData, categoriesData, offersData] = await Promise.all([
          getVendorServices(id),
          getServiceCategories(id),
          getVendorOffers(id)
        ]);
        
        if (!vendorData) {
          setError('Yritystä ei löytynyt');
          return;
        }

        setVendor(vendorData);
        setServices(servicesData);
        setCategories(categoriesData);
        setOffers(offersData.filter(o => o.active));
        
        // Filter categories to only show those with available services
        const availableCats = categoriesData.filter(category => 
          servicesData.some(service => service.categoryId === category.id)
        );
        
        setAvailableCategories(availableCats);
        
        // Set first available category as active by default
        if (availableCats.length > 0) {
          setActiveCategory(availableCats[0].id);
        }
      } catch (err) {
        console.error('Error loading vendor:', err);
        setError('Virhe ladattaessa yrityksen tietoja');
      } finally {
        setLoading(false);
      }
    };

    loadVendorData();
  }, [id]);

  // Handle scroll effects
  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleBooking = (service: Service) => {
    setSelectedService(service);
    setIsBookingModalOpen(true);
  };

  const getServiceDiscount = (service: Service) => {
    const activeOffer = offers.find(o => 
      o.serviceId === service.id && 
      new Date(o.startDate) <= new Date() && 
      new Date(o.endDate) >= new Date()
    );
    return activeOffer?.discountPercentage || 0;
  };

  const getDiscountedPrice = (service: Service) => {
    const discount = getServiceDiscount(service);
    return discount > 0 
      ? service.price * (1 - discount / 100)
      : service.price;
  };

  const scrollToCategory = (categoryId: string) => {
    setActiveCategory(categoryId);
    const element = categoryRefs.current[categoryId];
    if (element) {
      const yOffset = -100; // Offset to account for sticky header
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({top: y, behavior: 'smooth'});
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Hups!</h2>
          <p className="text-gray-600">{error || 'Yritystä ei löytynyt'}</p>
        </div>
      </div>
    );
  }

  const today = format(new Date(), 'EEEE').toLowerCase();
  const todayHours = vendor.operatingHours[today] || vendor.operatingHours.monday;

  // Calculate parallax effect for cover image
  const parallaxOffset = scrollPosition * 0.4;
  const coverOpacity = Math.max(1 - scrollPosition / 500, 0.3);

  return (
    <div className="min-h-screen bg-gray-50">
      {vendor.structuredData && (
        <Helmet>
          <script type="application/ld+json">
            {JSON.stringify(vendor.structuredData)}
          </script>
        </Helmet>
      )}
      {/* Cover Photo with Parallax Effect */}
      <div 
        ref={coverRef}
        className="h-80 bg-cover bg-center relative overflow-hidden transition-all duration-500"
        style={{ 
          backgroundImage: vendor.coverImage 
            ? `url(${vendor.coverImage})` 
            : 'url("https://images.unsplash.com/photo-1605164599901-db7f68c4b175?auto=format&fit=crop&q=80")'
        }}
      >
        <div 
          className="absolute inset-0 bg-black transition-opacity duration-500"
          style={{ 
            opacity: 0.3 + (scrollPosition / 1000),
            transform: `translateY(${parallaxOffset}px) scale(${1 + scrollPosition / 2000})` 
          }}
        ></div>
        
        {/* Floating business name that appears on scroll */}
        <div 
          className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black to-transparent transition-all duration-300"
          style={{ 
            opacity: Math.min(scrollPosition / 100, 1),
            transform: `translateY(${Math.min(scrollPosition / 10, 20)}px)`
          }}
        >
          <h1 className="text-white text-2xl font-bold">{vendor.businessName}</h1>
        </div>
      </div>

      {/* Profile Section */}
      <div className="max-w-7xl mx-auto px-4 relative">
        {/* Logo with animation */}
        <div 
          className="absolute -top-20 left-8 w-40 h-40 rounded-full border-4 border-white overflow-hidden bg-white shadow-lg transition-all duration-300 hover:shadow-xl"
          style={{ 
            transform: `translateY(${Math.min(scrollPosition / 8, 10)}px) scale(${1 - scrollPosition / 1000})` 
          }}
        >
          <img 
            src={vendor.logoImage || "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&q=80"} 
            alt={vendor.businessName}
            className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
          />
        </div>

        {/* Business Info */}
        <div className="pt-24 pb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 transition-all duration-300 hover:text-blue-600">{vendor.businessName}</h1>
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-gray-600">
                <div className="flex items-center shrink-0 group cursor-pointer">
                  <MapPin className="h-5 w-5 mr-1 group-hover:text-blue-500 transition-colors duration-300" />
                  <span className="group-hover:text-blue-500 transition-colors duration-300">{vendor.address}, {vendor.postalCode} {vendor.city}</span>
                </div>
                {vendor.rating && (
                  <div className="flex items-center shrink-0">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-4 w-4 transition-all duration-300 transform hover:scale-125 cursor-pointer
                            ${i < Math.floor(vendor.rating) 
                              ? 'text-yellow-400 fill-current' 
                              : i < vendor.rating 
                                ? 'text-yellow-400 fill-current opacity-70' 
                                : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                    <span className="ml-2 transition-all duration-300 hover:font-medium">{vendor.rating.toFixed(1)}</span>
                  </div>
                )}
                <div className="flex items-center shrink-0 group cursor-pointer">
                  <Clock className="h-5 w-5 mr-1 group-hover:text-green-500 transition-colors duration-300" />
                  <span className="whitespace-nowrap group-hover:text-green-500 transition-colors duration-300">
                    {todayHours.open === 'closed' && todayHours.close === 'closed'
                      ? 'Suljettu tänään'
                      : todayHours.open === '00:00' && todayHours.close === '23:59'
                      ? 'Avoinna 24h'
                      : `Avoinna tänään: ${todayHours.open} - ${todayHours.close}`
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats & Highlights with hover effects */}
          <div className="mt-6 bg-white rounded-lg shadow-sm p-4 transition-all duration-300 hover:shadow-md">
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-gray-50 hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 cursor-pointer">
                <Calendar className="h-5 w-5 text-gray-500 mb-1 transition-colors duration-300 group-hover:text-blue-500" />
                <span className="text-sm font-medium text-gray-900">{new Date(vendor.createdAt.seconds * 1000).getFullYear()}</span>
                <span className="text-xs text-gray-500">Perustettu</span>
              </div>
              <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-gray-50 hover:bg-green-50 transition-all duration-300 transform hover:scale-105 cursor-pointer">
                <Shield className={`h-5 w-5 mb-1 transition-colors duration-300 ${vendor.verified ? 'text-green-500' : 'text-gray-500'}`} />
                <span className={`text-sm font-medium transition-colors duration-300 ${vendor.verified ? 'text-green-600' : 'text-gray-900'}`}>
                  {vendor.verified ? 'Vahvistettu' : 'Odottaa'}
                </span>
                <span className="text-xs text-gray-500">Tila</span>
              </div>
              <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-gray-50 hover:bg-yellow-50 transition-all duration-300 transform hover:scale-105 cursor-pointer">
                <Star className="h-5 w-5 text-yellow-400 mb-1 transition-transform duration-300 hover:rotate-12" />
                <span className="text-sm font-medium text-gray-900">
                  {vendor.rating ? `${vendor.rating.toFixed(1)}/5` : '-'}
                </span>
                <span className="text-xs text-gray-500">
                  {vendor.ratingCount ? `${vendor.ratingCount} arvostelua` : 'Ei arvosteluja'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Category Navigation - iOS Style */}
        {availableCategories.length > 1 && (
          <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm shadow-sm mb-6 py-3 px-4 rounded-xl transition-all duration-300 hover:shadow-md">
            <div className="flex overflow-x-auto scrollbar-hide space-x-3 py-2 px-1">
              {availableCategories.map(category => (
                <button
                  key={category.id}
                  onClick={() => scrollToCategory(category.id)}
                  className={`
                    whitespace-nowrap px-4 py-2.5 rounded-full 
                    transition-all duration-300 transform active:scale-95
                    font-medium text-sm
                    ${activeCategory === category.id
                      ? 'bg-gradient-to-b from-gray-100 to-gray-300 text-gray-800 shadow-sm border border-gray-300/50'
                      : 'bg-gray-100/80 text-gray-600 hover:bg-gray-200/80 border border-transparent'
                    }
                    ios-btn-active
                  `}
                  style={{
                    boxShadow: activeCategory === category.id 
                      ? 'inset 0 1px 1px rgba(255,255,255,0.8), 0 1px 3px rgba(0,0,0,0.1)' 
                      : 'none'
                  }}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Services Section */}
        <div className="py-12">
          {/* Active Offers with enhanced animations */}
          {offers.length > 0 && (
            <div className="mb-12 animate-fadeIn">
              <div className="flex items-center justify-center mb-8">
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-gray-900 relative">
                    Voimassa olevat tarjoukset
                    <div className="absolute -top-4 -right-4 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 animate-pulse">
                      <Percent className="w-4 h-4" />
                    </div>
                  </h2>
                  <p className="mt-2 text-gray-600">Hyödynnä erikoistarjoukset nyt!</p>
                  <div className="mt-4 w-20 h-1 bg-green-600 mx-auto rounded-full"></div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {offers.map((offer, index) => {
                  const service = services.find(s => s.id === offer.serviceId);
                  if (!service) return null;
                  
                  const discountedPrice = service.price * (1 - offer.discountPercentage / 100);
                  
                  return (
                    <div 
                      key={offer.id} 
                      className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-500 border border-green-100 transform hover:-translate-y-1 hover:border-green-300"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="p-6 relative overflow-hidden">
                        {/* Discount badge with animation */}
                        <div className="absolute -right-10 -top-10 w-20 h-20 bg-green-500 rotate-45 transform transition-transform duration-300 hover:scale-110">
                          <div className="absolute bottom-0 left-0 right-0 text-center text-white font-bold text-sm" style={{ transform: 'rotate(-45deg) translateY(-10px)' }}>
                            {offer.discountPercentage}%
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <Tag className="w-5 h-5 text-green-600" />
                            <span className="text-sm font-medium bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              Tarjous
                            </span>
                          </div>
                          <div className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            <Percent className="w-4 h-4 mr-1" />
                            <span className="text-sm font-medium">{offer.discountPercentage}%</span>
                          </div>
                        </div>
                        
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 transition-colors duration-300 hover:text-green-600">{offer.title}</h3>
                        <p className="text-gray-600 text-sm mb-4">{offer.description}</p>
                        
                        <div className="bg-gray-50 rounded-lg p-4 transition-all duration-300 hover:bg-green-50">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">{service.name}</span>
                            <div className="flex items-center text-gray-500">
                              <Clock className="w-4 h-4 mr-1" />
                              <span>{service.duration} min</span>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-sm text-gray-600">Normaalihinta:</span>
                            <span className="text-sm line-through text-gray-500">{service.price}€</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900">Tarjoushinta:</span>
                            <span className="text-lg font-semibold text-green-600 transition-all duration-300 hover:scale-110">
                              {discountedPrice.toFixed(2)}€
                            </span>
                          </div>
                        </div>
                        
                        <button 
                          onClick={() => handleBooking(service)}
                          className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-300 text-sm font-medium flex items-center justify-center transform hover:scale-105 active:scale-95 shadow-sm hover:shadow"
                        >
                          Varaa tarjoushintaan
                          <ChevronRight className="w-4 h-4 ml-1 transition-transform duration-300 group-hover:translate-x-1" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-center mb-12">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 relative">
                Saatavilla olevat palvelut
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 animate-pulse">
                  <Package className="w-4 h-4" />
                </div>
              </h2>
              <p className="mt-2 text-gray-600">Valitse haluamasi palvelu alta ja varaa aika</p>
              <div className="mt-4 w-20 h-1 bg-blue-600 mx-auto rounded-full"></div>
            </div>
          </div>
          <div className="space-y-8">
            {availableCategories.map(category => {
              const categoryServices = services.filter(service => service.categoryId === category.id);
              if (categoryServices.length === 0) return null;
              
              return (
                <div 
                  key={category.id} 
                  ref={el => categoryRefs.current[category.id] = el}
                  className={`scroll-mt-24 transition-all duration-500 ${
                    activeCategory === category.id ? 'scale-100 opacity-100' : 'scale-98 opacity-90'
                  }`}
                >
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 transition-all duration-300 hover:text-blue-600 cursor-pointer">{category.name}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categoryServices.map(service => (
                      <div 
                        key={service.id} 
                        className={`group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 hover:border-blue-200 overflow-hidden transform hover:-translate-y-1 ${
                          highlightedService === service.id ? 'ring-2 ring-blue-400 shadow-md' : ''
                        }`}
                        onMouseEnter={() => setHighlightedService(service.id)}
                        onMouseLeave={() => setHighlightedService(null)}
                      >
                        <div className="p-6 relative">
                          {/* Discount tag if applicable */}
                          {getServiceDiscount(service) > 0 && (
                            <div className="absolute -right-12 -top-12 w-24 h-24 bg-green-500 rotate-45 transform">
                              <div className="absolute bottom-0 left-0 right-0 text-center text-white font-bold" style={{ transform: 'rotate(-45deg) translateY(-12px)' }}>
                                -{getServiceDiscount(service)}%
                              </div>
                            </div>
                          )}
                          
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                                {service.name}
                              </h4>
                              <p className="mt-1.5 text-gray-600 text-sm leading-relaxed">
                                {service.description}
                              </p>
                            </div>
                            <div className="flex items-center justify-center w-10 h-10 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors duration-300 transform group-hover:rotate-12">
                              <Clock className="w-5 h-5 text-blue-600" />
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center px-3 py-1 bg-gray-50 rounded-full text-sm text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors duration-300">
                                <Clock className="w-4 h-4 mr-1.5" />
                                {service.duration} min
                              </div>
                              {service.coinReward > 0 && (
                                <div className="flex items-center px-3 py-1 bg-yellow-50 rounded-full text-sm text-yellow-700 transform group-hover:scale-110 transition-transform duration-300">
                                  <Coins className="w-4 h-4 mr-1.5 animate-pulse" />
                                  +{service.coinReward}
                                </div>
                              )}
                            </div>
                            <div className="mt-4 flex items-center space-x-3">
                              <div className="flex flex-col items-end">
                                {getServiceDiscount(service) > 0 && (
                                  <span className="text-sm text-gray-500 line-through">
                                    {service.price.toFixed(2)}€
                                  </span>
                                )}
                                <span className={`text-lg font-semibold transition-all duration-300 ${
                                  getServiceDiscount(service) > 0 
                                    ? 'text-green-600 transform group-hover:scale-110' 
                                    : 'text-gray-900'
                                }`}>
                                  {getDiscountedPrice(service).toFixed(2)}€
                                </span>
                              </div>
                              <button 
                                onClick={() => handleBooking(service)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 text-sm font-medium flex items-center group-hover:scale-105 transform active:scale-95 shadow-sm hover:shadow"
                              >
                                Varaa
                                <ChevronRight className="w-4 h-4 ml-1 transition-transform duration-300 group-hover:translate-x-1" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            
            {services.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-lg transition-all duration-300 hover:bg-gray-100">
                <div className="text-gray-400 mb-3">
                  <Package className="w-12 h-12 mx-auto" />
                </div>
                <p className="text-gray-600">
                  Ei palveluita saatavilla
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedService && (
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => {
            setIsBookingModalOpen(false);
            setSelectedService(null);
          }}
          service={selectedService}
          vendorId={vendor.id}
          vendor={vendor}
        />
      )}
    </div>
  );
};

export default VendorProfile;
