import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getVendor, getVendorAppointments } from '../lib/db';
import type { Vendor, Appointment } from '../types/database';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import AppointmentCalendar from '../components/AppointmentCalendar';
import AppointmentDialog from '../components/AppointmentDialog';
import { format } from 'date-fns';
import { fi } from 'date-fns/locale';

const VendorCalendar = () => {
  const { currentUser } = useAuth();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollPosition(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const loadVendorData = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        const vendorData = await getVendor(currentUser.uid);
        if (vendorData) {
          setVendor(vendorData);
          const vendorAppointments = await getVendorAppointments(vendorData.id);
          const formattedAppointments = vendorAppointments.map(appointment => ({
            ...appointment,
            date: new Date(appointment.date.seconds * 1000)
          }));
          setAppointments(formattedAppointments);
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
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Virhe!</h2>
          <p className="text-gray-600">{error || 'Yritystietoja ei löytynyt'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* iOS-style sticky header */}
      <div className={`fixed md:relative top-0 left-0 right-0 z-[45] transition-all duration-300 ${
        scrollPosition > 20 ? 'bg-white/90 backdrop-blur-lg shadow-sm' : 'bg-white/50 backdrop-blur-sm'
      }`}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-2xl font-bold transition-all duration-300 ${
                scrollPosition > 20 ? 'text-gray-900' : 'text-gray-800'
              }`}>
                Varauskalenteri
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {format(currentMonth, 'MMMM yyyy', { locale: fi })}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors ios-btn-active md:hover:bg-gray-50"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={() => setCurrentMonth(new Date())}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors ios-btn-active md:bg-gray-50 md:hover:bg-gray-100"
              >
                Tänään
              </button>
              <button
                onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors ios-btn-active md:hover:bg-gray-50"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats - iOS-style cards */}
      <div className="pt-24 md:pt-6 pb-6 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-blue-50 rounded-xl">
                  <CalendarIcon className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-2xl font-bold text-blue-600">
                  {appointments.filter(a => a.status === 'confirmed').length}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-600">Tulevat</p>
            </div>
            
            <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-green-50 rounded-xl">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-2xl font-bold text-green-600">
                  {appointments.filter(a => a.status === 'completed').length}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-600">Valmiit</p>
            </div>
          </div>
        </div>
      </div>

        {/* Calendar */}
        <div className="px-4 md:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm md:shadow-md overflow-hidden">
              <AppointmentCalendar 
                vendor={vendor} 
                appointments={appointments}
                onAppointmentClick={setSelectedAppointment}
              />
            </div>
          </div>
        </div>

        {/* Appointment Dialog */}
        {selectedAppointment && (
          <AppointmentDialog
            isOpen={!!selectedAppointment}
            onClose={() => setSelectedAppointment(null)}
            appointment={selectedAppointment}
            onStatusChange={async () => {
              if (!vendor) return;
              const updatedAppointments = await getVendorAppointments(vendor.id);
              const formattedAppointments = updatedAppointments.map(appointment => ({
                ...appointment,
                date: new Date(appointment.date.seconds * 1000)
              }));
              setAppointments(formattedAppointments);
            }}
          />
        )}
    </div>
  );
};

export default VendorCalendar;
