import React from 'react';
import { X, Clock, Car, User, Phone, Mail, Calendar, Check, XCircle, ChevronDown, CreditCard, Coins } from 'lucide-react';
import type { Appointment } from '../types/database';
import { format } from 'date-fns';
import { fi } from 'date-fns/locale';
import { updateAppointment } from '../lib/db';
import { useState } from 'react';

interface AppointmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment;
  onStatusChange: () => void;
}

const AppointmentDialog: React.FC<AppointmentDialogProps> = ({ 
  isOpen, 
  onClose, 
  appointment,
  onStatusChange
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedDetails, setEditedDetails] = useState(() => ({
    firstName: appointment.customerDetails?.firstName || '',
    lastName: appointment.customerDetails?.lastName || '',
    phone: appointment.customerDetails?.phone || '',
    email: appointment.customerDetails?.email || '',
    licensePlate: appointment.customerDetails?.licensePlate || '',
    notes: appointment.notes || '',
  }));

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

  if (!isOpen) return null;

  const handleStatusChange = async (newStatus: Appointment['status']) => {
    try {
      setLoading(true);
      setError(null);
      
      await updateAppointment(appointment.id, {
        ...appointment,
        status: newStatus
      });

      onStatusChange();
      onClose();
    } catch (err) {
      console.error('Error updating appointment:', err);
      setError('Virhe varauksen päivityksessä');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'no_show':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled_by_customer':
        return 'bg-orange-100 text-orange-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Vahvistettu';
      case 'completed':
        return 'Valmis';
      case 'no_show':
        return 'Ei saapunut';
      case 'cancelled_by_customer':
        return 'Asiakas perunut';
      case 'cancelled':
        return 'Peruttu';
      default:
        return 'Odottaa';
    }
  };

  const handleSaveChanges = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await updateAppointment(appointment.id, {
        ...appointment,
        customerDetails: {
          ...appointment.customerDetails,
          firstName: editedDetails.firstName,
          lastName: editedDetails.lastName,
          phone: editedDetails.phone,
          email: editedDetails.email,
          licensePlate: editedDetails.licensePlate
        },
        notes: editedDetails.notes
      });

      onStatusChange();
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating appointment:', err);
      setError('Virhe varauksen päivityksessä');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-lg flex flex-col max-h-[90vh]">
        {/* Header - Fixed */}
        <div className="p-4 border-b">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Varauksen tiedot</h2>
              <p className="mt-1 text-sm text-gray-500">
                Varaus #{appointment.id.slice(0, 8)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Status Badge */}
          <div className="mt-3 relative w-full sm:w-auto">
            <select
              value={appointment.status}
              onChange={(e) => handleStatusChange(e.target.value as Appointment['status'])}
              className={`appearance-none w-full sm:w-auto ${getStatusColor(appointment.status)} px-3 py-1.5 pr-8 rounded-lg text-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              disabled={loading}
            >
              <option value="confirmed">Vahvistettu</option>
              <option value="completed">Valmis</option>
              <option value="no_show">Ei saapunut</option>
              <option value="cancelled_by_customer">Asiakas perunut</option>
              <option value="cancelled">Peruttu</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-current pointer-events-none" />
          </div>

          {/* Appointment Details */}
          <div className="mt-4 space-y-4">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="font-medium">
                  {format(appointment.date, "d. MMMM yyyy 'klo' HH:mm", { locale: fi })}
                </p>
              </div>
            </div>

            <div className="flex items-center">
              <Clock className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="font-medium">Kesto: {appointment.duration || 30} min</p>
                <p className="text-sm text-gray-500">Hinta: {appointment.totalPrice}€</p>
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Rekisterinumero</label>
                  <input
                    type="text"
                    value={editedDetails.licensePlate}
                    onChange={(e) => setEditedDetails(prev => ({ ...prev, licensePlate: e.target.value.toUpperCase() }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Etunimi</label>
                    <input
                      type="text"
                      value={editedDetails.firstName}
                      onChange={(e) => setEditedDetails(prev => ({ ...prev, firstName: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Sukunimi</label>
                    <input
                      type="text"
                      value={editedDetails.lastName}
                      onChange={(e) => setEditedDetails(prev => ({ ...prev, lastName: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Puhelinnumero</label>
                  <input
                    type="tel"
                    value={editedDetails.phone}
                    onChange={(e) => setEditedDetails(prev => ({ ...prev, phone: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Sähköposti</label>
                  <input
                    type="email"
                    value={editedDetails.email}
                    onChange={(e) => setEditedDetails(prev => ({ ...prev, email: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Lisätiedot</label>
                  <textarea
                    value={editedDetails.notes}
                    onChange={(e) => setEditedDetails(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center">
                  <Car className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium">{appointment.customerDetails?.licensePlate || 'Ei rekisterinumeroa'}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <User className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium">
                      {appointment.customerDetails?.firstName} {appointment.customerDetails?.lastName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Phone className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium">{appointment.customerDetails?.phone || 'Ei puhelinnumeroa'}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Mail className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium">{appointment.customerDetails?.email || 'Ei sähköpostia'}</p>
                  </div>
                </div>

                {appointment.notes && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">{appointment.notes}</p>
                  </div>
                )}
              </>
            )}
          </div>
          {/* Payment Details */}
          <div className="mt-4 bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <CreditCard className="w-5 h-5 mr-2 text-gray-500" />
              Maksutiedot
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Palvelun hinta</span>
                <span className="font-medium">{appointment.totalPrice}€</span>
              </div>
              {appointment.coinsUsed > 0 && (
                <>
                  <div className="flex justify-between items-center text-yellow-600">
                    <span className="flex items-center">
                      <Coins className="w-4 h-4 mr-1.5" />
                      <span>Käytetyt kolikot</span>
                    </span>
                    <span>-{appointment.coinsUsed} kpl</span>
                  </div>
                  <div className="flex justify-between items-center text-yellow-600">
                    <span>Kolikkoalennus</span>
                    <span>-{(appointment.coinsUsed * 0.5).toFixed(2)}€</span>
                  </div>
                  <div className="pt-3 border-t border-gray-200 mt-2">
                    <div className="flex justify-between items-center font-medium">
                      <span>Lopullinen hinta</span>
                      <span>{(appointment.totalPrice - (appointment.coinsUsed * 0.5)).toFixed(2)}€</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

          {error && (
            <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <X className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

        {/* Footer - Fixed */}
        <div className="p-4 border-t bg-gray-50">
          {/* Edit Buttons for Confirmed Appointments */}
          {appointment.status === 'confirmed' && !isEditing && (
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Muokkaa tietoja
              </button>
            </div>
          )}
          
          {/* Edit Mode Buttons */}
          {isEditing && (
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Peruuta
              </button>
              <button
                onClick={handleSaveChanges}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Tallennetaan...' : 'Tallenna muutokset'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentDialog;
