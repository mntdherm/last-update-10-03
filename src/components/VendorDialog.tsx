import React, { useEffect, useState } from 'react';
import { X, MapPin, Phone, Mail, Globe, Star, Store, Calendar, Check, Ban, Clock, Package, History, Coins, DollarSign, ChevronDown } from 'lucide-react';
import type { Vendor, Service, Appointment } from '../types/database';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { fi } from 'date-fns/locale';
import { getVendorServices, getVendorAppointments, getUser } from '../lib/db';
import type { User } from '../types/database';

interface VendorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  vendor: Vendor;
  onVerify: (vendorId: string) => void;
  onBan: (userId: string) => void;
}

const VendorDialog: React.FC<VendorDialogProps> = ({ 
  isOpen, 
  onClose, 
  vendor,
  onVerify,
  onBan
}) => {
  const [services, setServices] = useState<Service[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'logs' | 'income'>('info');
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyAppointments, setMonthlyAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [servicesData, appointmentsData, userData] = await Promise.all([
          getVendorServices(vendor.id),
          getVendorAppointments(vendor.id),
          getUser(vendor.userId)
        ]);
        setServices(servicesData);
        setAppointments(appointmentsData);
        setUserData(userData);
      } catch (err) {
        console.error('Error loading vendor data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      loadData();
    }
  }, [isOpen, vendor.id]);

  useEffect(() => {
    // Filter appointments for selected month and calculate income
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    
    const filteredAppointments = appointments.filter(appointment => {
      const appointmentDate = appointment.date instanceof Date 
        ? appointment.date 
        : new Date(appointment.date.seconds * 1000);
      return appointmentDate >= monthStart && appointmentDate <= monthEnd;
    });
    
    const income = filteredAppointments.reduce((sum, appointment) => {
      return sum + appointment.totalPrice;
    }, 0);
    
    setMonthlyAppointments(filteredAppointments);
    setMonthlyIncome(income);
  }, [selectedMonth, appointments]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header with Tabs */}
          <div className="p-6 border-b">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100">
                  {vendor.logoImage ? (
                    <img 
                      src={vendor.logoImage} 
                      alt={vendor.businessName} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Store className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{vendor.businessName}</h2>
                  <p className="text-gray-500">Y-tunnus: {vendor.businessId}</p>
                </div>
              </div>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="border-b">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('info')}
                className={`py-4 px-6 inline-flex items-center border-b-2 font-medium text-sm
                  ${activeTab === 'info'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <Store className="w-5 h-5 mr-2" />
                Tiedot
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`py-4 px-6 inline-flex items-center border-b-2 font-medium text-sm
                  ${activeTab === 'logs'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <History className="w-5 h-5 mr-2" />
                Tapahtumat
              </button>
              <button
                onClick={() => setActiveTab('income')}
                className={`py-4 px-6 inline-flex items-center border-b-2 font-medium text-sm
                  ${activeTab === 'income'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <DollarSign className="w-5 h-5 mr-2" />
                Tulot
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'info' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Perustiedot</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium">{vendor.address}</p>
                      <p className="text-sm text-gray-500">{vendor.postalCode} {vendor.city}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-5 h-5 text-gray-400 mr-3" />
                    <p>{vendor.phone}</p>
                  </div>
                  <div className="flex items-center">
                    <Mail className="w-5 h-5 text-gray-400 mr-3" />
                    <p>{vendor.email}</p>
                  </div>
                  {vendor.website && (
                    <div className="flex items-center">
                      <Globe className="w-5 h-5 text-gray-400 mr-3" />
                      <a 
                        href={vendor.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {vendor.website}
                      </a>
                    </div>
                  )}
                </div>

                {/* Operating Hours */}
                <h3 className="text-lg font-semibold pt-4">Aukioloajat</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-2">
                    {Object.entries(vendor.operatingHours).map(([day, hours]) => (
                      <div key={day} className="flex justify-between items-center">
                        <span className="capitalize">{format(new Date(2024, 0, 1), 'EEEE', { locale: fi })}</span>
                        <span className="text-gray-600">
                          {hours.open === 'closed' && hours.close === 'closed'
                            ? 'Suljettu'
                            : hours.open === '00:00' && hours.close === '23:59'
                            ? '24h'
                            : `${hours.open} - ${hours.close}`
                          }
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Stats and Services */}
              <div className="space-y-4">
                {/* Stats */}
                <h3 className="text-lg font-semibold">Tilastot</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Calendar className="w-5 h-5 text-blue-600 mr-2" />
                        <span className="text-gray-600">Varaukset</span>
                      </div>
                      <span className="text-2xl font-bold">{appointments.length}</span>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Star className="w-5 h-5 text-yellow-500 mr-2" />
                        <span className="text-gray-600">Arvosana</span>
                      </div>
                      <span className="text-2xl font-bold">{vendor.rating || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Services */}
                <h3 className="text-lg font-semibold pt-4">Palvelut ({services.length})</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-3">
                    {services.map(service => (
                      <div key={service.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{service.name}</p>
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock className="w-4 h-4 mr-1" />
                            <span>{service.duration} min</span>
                          </div>
                        </div>
                        <span className="font-medium">{service.price}€</span>
                      </div>
                    ))}
                    {services.length === 0 && (
                      <div className="text-center py-4 text-gray-500">
                        <Package className="w-8 h-8 mx-auto mb-2" />
                        <p>Ei palveluita</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            )}
            
            {activeTab === 'logs' && (
              <div className="flow-root">
                {userData && (
                  <ul role="list" className="-mb-8">
                    {/* Account creation */}
                    <li>
                      <div className="relative pb-8">
                        <span className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-gray-200" />
                        <div className="relative flex items-start space-x-3">
                          <div className="relative">
                            <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center ring-8 ring-white">
                              <Store className="w-5 h-5 text-blue-500" />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1 py-3">
                            <div className="text-sm leading-8 text-gray-500">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-900">Yritys rekisteröity</span>
                                <time className="flex-shrink-0 whitespace-nowrap">
                                  {format(new Date(vendor.createdAt.seconds * 1000), "d.M.yyyy 'klo' HH:mm", { locale: fi })}
                                </time>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                    
                    {/* Verification status */}
                    {vendor.verified && (
                      <li>
                        <div className="relative pb-8">
                          <span className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-gray-200" />
                          <div className="relative flex items-start space-x-3">
                            <div className="relative">
                              <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center ring-8 ring-white">
                                <Check className="w-5 h-5 text-green-500" />
                              </div>
                            </div>
                            <div className="min-w-0 flex-1 py-3">
                              <div className="text-sm leading-8 text-gray-500">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-gray-900">Yritys vahvistettu</span>
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                    Vahvistettu
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    )}
                    
                    {/* Appointments */}
                    {appointments.map((appointment) => (
                      <li key={appointment.id}>
                        <div className="relative pb-8">
                          <span className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-gray-200" />
                          <div className="relative flex items-start space-x-3">
                            <div className="relative">
                              <div className="h-10 w-10 rounded-full bg-purple-50 flex items-center justify-center ring-8 ring-white">
                                <Calendar className="w-5 h-5 text-purple-500" />
                              </div>
                            </div>
                            <div className="min-w-0 flex-1 py-3">
                              <div className="text-sm leading-8 text-gray-500">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-gray-900">
                                    Varaus #{appointment.id.slice(0, 8)}
                                  </span>
                                  <time className="flex-shrink-0 whitespace-nowrap">
                                    {format(
                                      appointment.date instanceof Date 
                                        ? appointment.date 
                                        : new Date(appointment.date.seconds * 1000),
                                      "d.M.yyyy 'klo' HH:mm",
                                      { locale: fi }
                                    )}
                                  </time>
                                </div>
                                <div className="mt-2 flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                      appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                      appointment.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                      appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {appointment.status === 'confirmed' ? 'Vahvistettu' :
                                       appointment.status === 'completed' ? 'Valmis' :
                                       appointment.status === 'cancelled' ? 'Peruttu' :
                                       appointment.status}
                                    </span>
                                    {appointment.feedback && (
                                      <div className="flex items-center text-yellow-500">
                                        <Star className="w-4 h-4 fill-current" />
                                        <span className="ml-1 text-sm">{appointment.feedback.rating}</span>
                                      </div>
                                    )}
                                  </div>
                                  <span className="font-medium">{appointment.totalPrice}€</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            
            {activeTab === 'income' && (
              <div className="space-y-6">
                {/* Month selector */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setSelectedMonth(prev => subMonths(prev, 1))}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronDown className="w-5 h-5 rotate-90" />
                  </button>
                  <h3 className="text-lg font-medium">
                    {format(selectedMonth, 'MMMM yyyy', { locale: fi })}
                  </h3>
                  <button
                    onClick={() => setSelectedMonth(prev => subMonths(prev, -1))}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronDown className="w-5 h-5 -rotate-90" />
                  </button>
                </div>

                {/* Monthly summary */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Tulot yhteensä</h4>
                      <p className="mt-2 text-3xl font-bold text-gray-900">{monthlyIncome.toFixed(2)}€</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Varaukset</h4>
                      <p className="mt-2 text-3xl font-bold text-gray-900">{monthlyAppointments.length}</p>
                    </div>
                  </div>
                </div>

                {/* Appointments list */}
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg font-medium text-gray-900">Kuukauden varaukset</h3>
                  </div>
                  <div className="border-t border-gray-200">
                    <ul role="list" className="divide-y divide-gray-200">
                      {monthlyAppointments.map((appointment) => (
                        <li key={appointment.id} className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <p className="text-sm font-medium text-gray-900">
                                {appointment.customerDetails.firstName} {appointment.customerDetails.lastName}
                              </p>
                              <p className="text-sm text-gray-500">
                                {format(
                                  appointment.date instanceof Date 
                                    ? appointment.date 
                                    : new Date(appointment.date.seconds * 1000),
                                  "d.M.yyyy 'klo' HH:mm",
                                  { locale: fi }
                                )}
                              </p>
                            </div>
                            <div className="flex items-center">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full mr-4 ${
                                appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                appointment.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {appointment.status === 'confirmed' ? 'Vahvistettu' :
                                 appointment.status === 'completed' ? 'Valmis' :
                                 appointment.status === 'cancelled' ? 'Peruttu' :
                                 appointment.status}
                              </span>
                              <span className="text-sm font-medium text-gray-900">
                                {appointment.totalPrice.toFixed(2)}€
                              </span>
                            </div>
                          </div>
                        </li>
                      ))}
                      {monthlyAppointments.length === 0 && (
                        <li className="px-4 py-8 text-center text-gray-500">
                          Ei varauksia tässä kuussa
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  vendor.verified 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {vendor.verified ? 'Vahvistettu' : 'Odottaa vahvistusta'}
                </span>
                <span className="mx-2 text-gray-300">•</span>
                <span className="text-sm text-gray-500">
                  Liittynyt {format(new Date(vendor.createdAt.seconds * 1000), 'd.M.yyyy')}
                </span>
              </div>
              <div className="flex space-x-3">
                {!vendor.verified && (
                  <button
                    onClick={() => onVerify(vendor.id)}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Vahvista
                  </button>
                )}
                <button
                  onClick={() => onBan(vendor.userId)}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <Ban className="w-4 h-4 mr-2" />
                  Estä
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDialog;
