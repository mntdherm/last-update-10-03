import React, { useState, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, startOfWeek, endOfWeek, isBefore, startOfToday } from 'date-fns';
import { fi } from 'date-fns/locale';
import { Calendar, Clock, CreditCard, X, ChevronRight, ChevronLeft, Check, UserIcon, Coins, LogIn } from 'lucide-react';
import type { Service, Vendor, User as UserType, Offer } from '../types/database';
import { createAppointment, getUser, getVendorOffers } from '../lib/db';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const getDayOperatingHours = (date: Date, vendor: Vendor) => {
  const dayName = format(date, 'EEEE').toLowerCase();
  return vendor.operatingHours[dayName] || { open: '09:00', close: '17:00' };
};

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service;
  vendorId: string;
  vendor: Vendor;
}

type Step = 'date' | 'time' | 'details' | 'signup' | 'confirm';

interface CustomerDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  licensePlate: string;
  password?: string;
}

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, service, vendorId, vendor }) => {
  const { currentUser, signup } = useAuth();
  const navigate = useNavigate();
  
  // Add/remove no-scroll class on body
  React.useEffect(() => {
    if (isOpen) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
    
    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, [isOpen]);

  // Add/remove no-scroll class on body
  React.useEffect(() => {
    if (isOpen) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
    
    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, [isOpen]);

  const [currentStep, setCurrentStep] = useState<Step>('date');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [useCoins, setUseCoins] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [userData, setUserData] = useState<UserType | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({
    firstName: '',
    lastName: '',
    email: currentUser?.email || '',
    phone: '',
    licensePlate: '',
    password: ''
  });

  if (!isOpen) return null;

  useEffect(() => {
    const loadUserData = async () => {
      if (currentUser) {
        const [user, vendorOffers] = await Promise.all([
          getUser(currentUser.uid),
          getVendorOffers(vendorId)
        ]);
        setUserData(user);
        setOffers(vendorOffers.filter(o => o.active));
      }
    };
    loadUserData();
  }, [currentUser, vendorId]);

  const getServiceDiscount = () => {
    const activeOffer = offers.find(o => 
      o.serviceId === service.id && 
      new Date(o.startDate) <= new Date() && 
      new Date(o.endDate) >= new Date()
    );
    return activeOffer?.discountPercentage || 0;
  };

  const getDiscountedPrice = () => {
    const discount = getServiceDiscount();
    return discount > 0 
      ? service.price * (1 - discount / 100)
      : service.price;
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) {
      setError('Valitse päivä ja aika');
      return;
    }

    if (!customerDetails.firstName || !customerDetails.lastName || !customerDetails.email || 
        !customerDetails.phone || !customerDetails.licensePlate) {
      setError('Täytä kaikki asiakastiedot');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let userId = currentUser?.uid;

      if (!currentUser && customerDetails.password) {
        try {
          const userCredential = await signup(customerDetails.email, customerDetails.password);
          userId = userCredential.user.uid;
        } catch (err: any) {
          if (err.code === 'auth/email-already-in-use') {
            setShowLoginPrompt(true);
            setError('Sähköposti on jo käytössä. Kirjaudu sisään jatkaaksesi.');
            return;
          }
          throw err;
        }
      }

      if (!userId) {
        setError('Kirjautuminen epäonnistui');
        return;
      }

      const dateTime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':');
      dateTime.setHours(parseInt(hours), parseInt(minutes));

      if (useCoins) {
        if (!userData || useCoins > userData.wallet.coins) {
          setError('Ei tarpeeksi kolikoita');
          return;
        }
      }

      const appointmentData = {
        customerId: userId,
        vendorId,
        serviceId: service.id,
        date: dateTime,
        status: 'confirmed',
        totalPrice: useCoins 
          ? Math.max(0, getDiscountedPrice() - (Math.min(
              userData?.wallet.coins || 0,
              Math.floor(getDiscountedPrice() / 0.5)
            ) * 0.5))
          : getDiscountedPrice(),
        customerDetails: {
          firstName: customerDetails.firstName,
          lastName: customerDetails.lastName,
          email: customerDetails.email,
          phone: customerDetails.phone,
          licensePlate: customerDetails.licensePlate
        }
      };

      await createAppointment(appointmentData, useCoins ? Math.min(
        userData?.wallet.coins || 0,
        Math.floor(service.price / 0.5)
      ) : 0);

      setBookingComplete(true);
      setTimeout(() => {
        navigate('/');
        onClose();
      }, 3000);

    } catch (err) {
      console.error('Booking error:', err);
      setError('Varauksen luonti epäonnistui. Yritä uudelleen.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    const bookingDetails = {
      service,
      vendorId,
      selectedDate,
      selectedTime,
      customerDetails
    };
    sessionStorage.setItem('pendingBooking', JSON.stringify(bookingDetails));
    navigate('/login');
  };

  const getAvailableTimes = () => {
    if (!selectedDate) return [];

    const hours = getDayOperatingHours(selectedDate, vendor);
    
    if (hours.open === 'closed' && hours.close === 'closed') {
      return [];
    }

    if (hours.open === '00:00' && hours.close === '23:59') {
      return Array.from({ length: 48 }, (_, i) => {
        const hour = Math.floor(i / 2);
        const minute = i % 2 === 0 ? '00' : '30';
        return `${hour.toString().padStart(2, '0')}:${minute}`;
      });
    }

    const [openHour, openMinute = '0'] = hours.open.split(':');
    const [closeHour, closeMinute = '0'] = hours.close.split(':');
    const startTime = parseInt(openHour) * 60 + parseInt(openMinute);
    const endTime = parseInt(closeHour) * 60 + parseInt(closeMinute);

    const times = [];
    for (let time = startTime; time < endTime; time += 30) {
      const hour = Math.floor(time / 60);
      const minute = time % 60;
      times.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    }

    return times;
  };

  const hasAvailableTimes = (date: Date) => {
    const hours = getDayOperatingHours(date, vendor);
    return !(hours.open === 'closed' && hours.close === 'closed');
  };

  const nextStep = () => {
    if (currentStep === 'date' && selectedDate) {
      setCurrentStep('time');
    } else if (currentStep === 'time' && selectedTime) {
      setCurrentStep('details');
    } else if (currentStep === 'details' && 
               customerDetails.firstName && 
               customerDetails.lastName && 
               customerDetails.email && 
               customerDetails.phone && 
               customerDetails.licensePlate) {
      if (!currentUser) {
        setCurrentStep('signup');
      } else {
        setCurrentStep('confirm');
      }
    } else if (currentStep === 'signup' && customerDetails.password) {
      setCurrentStep('confirm');
    }
  };

  const prevStep = () => {
    if (currentStep === 'time') {
      setCurrentStep('date');
    } else if (currentStep === 'details') {
      setCurrentStep('time');
    } else if (currentStep === 'signup') {
      setCurrentStep('details');
    } else if (currentStep === 'confirm') {
      setCurrentStep(currentUser ? 'details' : 'signup');
    }
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const renderDateStep = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const today = startOfToday();

    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="p-4 animate-fadeIn">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-gray-100 rounded-full transition-all duration-200 active:scale-95"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-semibold">
            {format(currentMonth, 'MMMM yyyy', { locale: fi })}
          </h2>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-full transition-all duration-200 active:scale-95"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAYS.map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map(day => {
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isPast = isBefore(day, today);
            const isAvailable = hasAvailableTimes(day);

            return (
              <div
                key={day.toString()}
                className={`
                  relative p-2 text-center
                  ${!isCurrentMonth && 'opacity-30'}
                  ${isPast && 'opacity-30 cursor-not-allowed'}
                `}
              >
                <button
                  onClick={() => !isPast && setSelectedDate(day)}
                  disabled={isPast || !isCurrentMonth}
                  className={`
                    w-full aspect-square flex flex-col items-center justify-center rounded-lg
                    transition-all duration-200
                    ${isSelected 
                      ? 'bg-blue-600 text-white scale-105 shadow-lg' 
                      : 'hover:bg-gray-100 hover:scale-105'}
                    ${isPast || !isCurrentMonth ? 'cursor-not-allowed' : 'cursor-pointer'}
                    ${isAvailable && !isSelected ? 'hover:bg-green-50' : ''}
                    active:scale-95
                  `}
                >
                  <span className={`text-sm ${isToday(day) && 'font-bold'}`}>
                    {format(day, 'd')}
                  </span>
                  {isAvailable && (
                    <div className={`mt-1 h-1 w-4 rounded-full mx-auto
                      ${isSelected ? 'bg-white' : 'bg-green-500'}
                      transition-all duration-200
                    `}></div>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderTimeStep = () => {
    const times = getAvailableTimes();

    if (times.length === 0) {
      return (
        <div className="p-4 text-center animate-fadeIn">
          <p className="text-gray-600">Valitettavasti tämä päivä on suljettu.</p>
          <button
            onClick={() => setCurrentStep('date')}
            className="mt-4 text-blue-600 hover:text-blue-800 transition-colors"
          >
            Valitse toinen päivä
          </button>
        </div>
      );
    }

    return (
      <div className="p-4 animate-fadeIn">
        <div className="text-center mb-6">
          <h3 className="text-lg font-medium">
            {selectedDate && format(selectedDate, 'EEEE d.M.yyyy', { locale: fi })}
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {times.map((time, index) => {
            const isSelected = time === selectedTime;

            return (
              <button
                key={time}
                onClick={() => setSelectedTime(time)}
                className={`
                  p-3 rounded-lg text-center
                  transition-all duration-200
                  transform hover:scale-105
                  active:scale-95
                  ${isSelected 
                    ? 'bg-blue-600 text-white shadow-lg scale-105' 
                    : 'bg-gray-50 hover:bg-gray-100'}
                `}
                style={{
                  animation: `fadeIn 0.3s ease-out ${index * 0.05}s both`
                }}
              >
                <span className="text-lg">{time}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDetailsStep = () => {
    return (
      <div className="p-4 animate-fadeIn">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Etunimi</label>
              <input
                type="text"
                value={customerDetails.firstName}
                onChange={(e) => setCustomerDetails(prev => ({ ...prev, firstName: e.target.value }))}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm
                  focus:border-blue-500 focus:ring-blue-500
                  transition-all duration-200
                  hover:border-gray-400"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sukunimi</label>
              <input
                type="text"
                value={customerDetails.lastName}
                onChange={(e) => setCustomerDetails(prev => ({ ...prev, lastName: e.target.value }))}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm
                  focus:border-blue-500 focus:ring-blue-500
                  transition-all duration-200
                  hover:border-gray-400"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rekisterinumero</label>
            <input
              type="text"
              value={customerDetails.licensePlate}
              onChange={(e) => setCustomerDetails(prev => ({ ...prev, licensePlate: e.target.value.toUpperCase() }))}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm
                focus:border-blue-500 focus:ring-blue-500
                transition-all duration-200
                hover:border-gray-400"
              placeholder="ABC-123"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sähköposti</label>
            <input
              type="email"
              value={customerDetails.email}
              onChange={(e) => setCustomerDetails(prev => ({ ...prev, email: e.target.value }))}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm
                focus:border-blue-500 focus:ring-blue-500
                transition-all duration-200
                hover:border-gray-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Puhelinnumero</label>
            <input
              type="tel"
              value={customerDetails.phone}
              onChange={(e) => setCustomerDetails(prev => ({ ...prev, phone: e.target.value }))}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm
                focus:border-blue-500 focus:ring-blue-500
                transition-all duration-200
                hover:border-gray-400"
              placeholder="+358"
              required
            />
          </div>
        </div>
      </div>
    );
  };

  const renderSignupStep = () => {
    return (
      <div className="p-4 animate-fadeIn">
        <div className="bg-blue-50 p-6 rounded-lg mb-6 transform hover:scale-[1.02] transition-transform duration-200">
          <div className="flex items-center space-x-3 text-blue-700">
            <Coins className="h-6 w-6 animate-bounce" />
            <h3 className="font-semibold text-lg">Liity jäseneksi ja saa 10 kolikkoa!</h3>
          </div>
          <p className="mt-2 text-sm text-blue-600">
            Aseta salasana tilillesi ja saat heti 10 kolikkoa käyttöösi. 
            Voit käyttää kolikoita alennuksiin tulevissa varauksissa.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sähköposti</label>
            <input
              type="email"
              value={customerDetails.email}
              disabled
              className="mt-1 block w-full rounded-lg border-gray-300 bg-gray-50 shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Salasana</label>
            <input
              type="password"
              value={customerDetails.password}
              onChange={(e) => setCustomerDetails(prev => ({ ...prev, password: e.target.value }))}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm
                focus:border-blue-500 focus:ring-blue-500
                transition-all duration-200
                hover:border-gray-400"
              placeholder="Vähintään 6 merkkiä"
              required
              minLength={6}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderConfirmStep = () => {
    if (!selectedDate || !selectedTime) return null;

    return (
      <div className="p-4 animate-fadeIn">
        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="font-semibold text-lg mb-4">Varauksen tiedot</h3>
          <div className="space-y-4">
            {currentUser && userData && userData.wallet.coins > 0 && (
              <div className="bg-yellow-50 p-4 rounded-lg mb-4 transform hover:scale-[1.02] transition-transform duration-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <Coins className="w-5 h-5 text-yellow-600 mr-2" />
                    <span className="text-sm text-yellow-700">Käytettävissä: {userData.wallet.coins} kolikkoa</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUseCoins(!useCoins)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium
                      transition-all duration-200
                      transform hover:scale-105 active:scale-95
                      ${useCoins 
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : 'bg-yellow-500 text-white hover:bg-yellow-600'
                      }`}
                  >
                    {useCoins ? 'Kolikot käytössä' : 'Käytä kolikot'}
                  </button>
                </div>
                {useCoins && (
                  <div className="mt-3 text-sm text-yellow-600 animate-fadeIn">
                    <p>Käytetään {Math.min(
                      userData.wallet.coins,
                      Math.floor(service.price / 0.5)
                    )} kolikkoa = {(Math.min(
                      userData.wallet.coins,
                      Math.floor(service.price / 0.5)
                    ) * 0.5).toFixed(2)}€ alennus</p>
                  </div>
                )}
              </div>
            )}
            
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 hover:bg-blue-100 rounded-lg transition-colors">
                <span className="text-gray-600">Palvelu</span>
                <span className="font-medium text-gray-900">{service.name}</span>
              </div>
              <div className="flex justify-between items-center p-2 hover:bg-blue-100 rounded-lg transition-colors">
                <span className="text-gray-600">Päivämäärä</span>
                <span className="font-medium text-gray-900">
                  {format(selectedDate, 'd.M.yyyy')}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 hover:bg-blue-100 rounded-lg transition-colors">
                <span className="text-gray-600">Aika</span>
                <span className="font-medium text-gray-900">{selectedTime}</span>
              </div>
              <div className="flex justify-between items-center p-2 hover:bg-blue-100 rounded-lg transition-colors">
                <span className="text-gray-600">Kesto</span>
                <span className="font-medium text-gray-900">{service.duration} min</span>
              </div>
              <div className="flex justify-between items-center p-2 hover:bg-blue-100 rounded-lg transition-colors">
                <span className="text-gray-600">Asiakas</span>
                <span className="font-medium text-gray-900">{customerDetails.firstName} {customerDetails.lastName}</span>
              </div>
              <div className="flex justify-between items-center p-2 hover:bg-blue-100 rounded-lg transition-colors">
                <span className="text-gray-600">Rekisterinumero</span>
                <span className="font-medium text-gray-900">{customerDetails.licensePlate}</span>
              </div>
            </div>
            
            <div className="pt-4 border-t mt-4">
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                <span className="font-semibold">Yhteensä</span>
                <div className="text-right">
                  {useCoins && (
                    <div className="text-sm text-gray-500 line-through mb-1 animate-fadeIn">
                      {getDiscountedPrice().toFixed(2)}€
                    </div>
                  )}
                  <span className="font-semibold text-lg text-gray-900">
                    {useCoins 
                      ? Math.max(0, getDiscountedPrice() - (Math.min(
                          userData?.wallet.coins || 0,
                          Math.floor(getDiscountedPrice() / 0.5)
                        ) * 0.5)).toFixed(2)
                      : getDiscountedPrice().toFixed(2)
                    }€
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSuccessStep = () => (
    <div className="p-8 text-center animate-fadeIn">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4
        animate-[bounce_1s_ease-in-out_infinite]">
        <Check className="w-8 h-8 text-green-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        Varaus vahvistettu!
      </h3>
      <p className="text-gray-600 mb-4">
        Lähetimme varausvahvistuksen sähköpostiisi. Nähdään pian!
      </p>
      <div className="animate-pulse text-sm text-gray-500">
        Sinut ohjataan kojelaudalle...
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]
      animate-fadeIn">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col
        transform transition-all duration-300 animate-slideDown">
        {/* Header */}
        <div className="border-b p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Varaa aika</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors
                rounded-full p-1 hover:bg-gray-100"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mt-6 relative">

            {/* Date Step */}
            <div className={`flex flex-col items-center z-10 transition-all duration-300
              ${currentStep === 'date' ? 'text-bilo-navy' : 'text-gray-500'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center
                transition-all duration-300 transform
                ${currentStep === 'date' 
                  ? 'bg-gradient-to-br from-gray-100 to-bilo-silver scale-110 shadow-lg ring-2 ring-bilo-silver/30 animate-pulse' 
                  : 'bg-white border-2 border-gray-200 hover:border-bilo-silver hover:scale-105'}`}>
                <Calendar className={`w-5 h-5 transition-transform duration-300 ${currentStep === 'date' ? 'scale-110' : ''}`} />
              </div>
              <span className="mt-2 text-xs font-medium">Päivä</span>
            </div>

            {/* Time Step */}
            <div className={`flex flex-col items-center z-10 transition-all duration-300
              ${currentStep === 'time' ? 'text-bilo-navy' : 'text-gray-500'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center
                transition-all duration-300 transform
                ${currentStep === 'time' 
                  ? 'bg-gradient-to-br from-gray-100 to-bilo-silver scale-110 shadow-lg ring-2 ring-bilo-silver/30 animate-pulse' 
                  : 'bg-white border-2 border-gray-200 hover:border-bilo-silver hover:scale-105'}`}>
                <Clock className={`w-5 h-5 transition-transform duration-300 ${currentStep === 'time' ? 'scale-110' : ''}`} />
              </div>
              <span className="mt-2 text-xs font-medium">Aika</span>
            </div>

            {/* Details Step */}
            <div className={`flex flex-col items-center z-10 transition-all duration-300
              ${currentStep === 'details' ? 'text-bilo-navy' : 'text-gray-500'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center
                transition-all duration-300 transform
                ${currentStep === 'details' 
                  ? 'bg-gradient-to-br from-gray-100 to-bilo-silver scale-110 shadow-lg ring-2 ring-bilo-silver/30 animate-pulse' 
                  : 'bg-white border-2 border-gray-200 hover:border-bilo-silver hover:scale-105'}`}>
                <UserIcon className={`w-5 h-5 transition-transform duration-300 ${currentStep === 'details' ? 'scale-110' : ''}`} />
              </div>
              <span className="mt-2 text-xs font-medium">Tiedot</span>
            </div>

            {/* Signup Step (only for non-authenticated users) */}
            {!currentUser && (
              <>
                <div className={`flex flex-col items-center z-10 transition-all duration-300
                  ${currentStep === 'signup' ? 'text-bilo-navy' : 'text-gray-500'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center
                    transition-all duration-300 transform
                    ${currentStep === 'signup' 
                      ? 'bg-gradient-to-br from-gray-100 to-bilo-silver scale-110 shadow-lg ring-2 ring-bilo-silver/30 animate-pulse' 
                      : 'bg-white border-2 border-gray-200 hover:border-bilo-silver hover:scale-105'}`}>
                    <Coins className={`w-5 h-5 transition-transform duration-300 ${currentStep === 'signup' ? 'scale-110' : ''}`} />
                  </div>
                  <span className="mt-2 text-xs font-medium">Liity</span>
                </div>
              </>
            )}

            {/* Confirm Step */}
            <div className={`flex flex-col items-center z-10 transition-all duration-300
              ${currentStep === 'confirm' ? 'text-bilo-navy' : 'text-gray-500'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center
                transition-all duration-300 transform
                ${currentStep === 'confirm' 
                  ? 'bg-gradient-to-br from-gray-100 to-bilo-silver scale-110 shadow-lg ring-2 ring-bilo-silver/30 animate-pulse' 
                  : 'bg-white border-2 border-gray-200 hover:border-bilo-silver hover:scale-105'}`}>
                <Check className={`w-5 h-5 transition-transform duration-300 ${currentStep === 'confirm' ? 'scale-110' : ''}`} />
              </div>
              <span className="mt-2 text-xs font-medium">Vahvista</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {bookingComplete ? renderSuccessStep() : (
            <>
              {currentStep === 'date' && renderDateStep()}
              {currentStep === 'time' && renderTimeStep()}
              {currentStep === 'details' && renderDetailsStep()}
              {currentStep === 'signup' && renderSignupStep()}
              {currentStep === 'confirm' && renderConfirmStep()}
            </>
          )}

          {error && (
            <div className="m-4 bg-red-50 border-l-4 border-red-400 p-4 animate-shake">
              <div className="flex">
                <div className="flex-shrink-0">
                  <X className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                  {showLoginPrompt && (
                    <button
                      onClick={handleLogin}
                      className="mt-2 flex items-center text-blue-600 hover:text-blue-800
                        transition-colors group"
                    >
                      <LogIn className="h-4 w-4 mr-1 group-hover:translate-x-1 transition-transform" />
                      Kirjaudu sisään
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!bookingComplete && (
          <div className="border-t p-4 bg-gray-50">
            <div className="flex justify-between">
              {currentStep !== 'date' ? (
                <button
                  onClick={prevStep}
                  className="flex items-center px-4 py-2 text-gray-700 hover:text-gray-900
                    transition-all duration-200 hover:bg-gray-100 rounded-lg
                    active:scale-95"
                >
                  <ChevronLeft className="w-5 h-5 mr-1" />
                  Edellinen
                </button>
              ) : (
                <div></div>
              )}

              {currentStep !== 'confirm' ? (
                <button
                  onClick={nextStep}
                  disabled={
                    !selectedDate || 
                    (currentStep === 'time' && !selectedTime) ||
                    (currentStep === 'details' && (!customerDetails.firstName || !customerDetails.lastName || 
                     !customerDetails.email || !customerDetails.phone || !customerDetails.licensePlate)) ||
                    (currentStep === 'signup' && !customerDetails.password)
                  }
                  className="flex items-center px-6 py-3 next-step-button
                    text-bilo-navy font-medium rounded-xl
                    transition-all duration-300 relative group
                    hover:scale-[1.02] hover:shadow-xl
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                    active:scale-98 focus:outline-none focus:ring-2 focus:ring-bilo-silver"
                >
                  Seuraava
                  <ChevronRight className="w-5 h-5 ml-1 relative z-10 group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex items-center px-6 py-3 next-step-button
                    text-bilo-navy font-medium rounded-xl
                    transition-all duration-300 relative group
                    hover:scale-[1.02] hover:shadow-xl
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                    active:scale-98 focus:outline-none focus:ring-2 focus:ring-bilo-silver"
                >
                  {loading ? (
                    <>
                      <Clock className="animate-spin h-5 w-5 mr-2 relative z-10" />
                      <span className="animate-pulse relative z-10">Varataan...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5 mr-2 relative z-10 group-hover:scale-110 transition-transform" />
                      <span className="relative z-10 group-hover:translate-x-0.5 transition-transform">
                        Vahvista varaus
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to determine step status
const getStepStatus = (stepId: string, currentStep: Step) => {
  const steps = ['date', 'time', 'details', 'signup', 'confirm'];
  const currentIndex = steps.indexOf(currentStep);
  const stepIndex = steps.indexOf(stepId);
  
  if (stepIndex < currentIndex) return 'completed';
  if (stepIndex === currentIndex) return 'active';
  return 'pending';
};

export default BookingModal;
