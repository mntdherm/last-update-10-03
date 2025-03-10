import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getCustomerAppointments } from '../../lib/db';
import { Calendar, Clock, Star, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { fi } from 'date-fns/locale';
import type { Appointment } from '../../types/database';
import CustomerLayout from './Layout';
import FeedbackDialog from '../../components/FeedbackDialog';
import { useSupportDialog } from '../../contexts/SupportContext';

const CustomerAppointments = () => {
  const { currentUser } = useAuth();
  const { setShowSupportDialog } = useSupportDialog();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAppointments = async () => {
      if (currentUser) {
        const userAppointments = await getCustomerAppointments(currentUser.uid);
        const formattedAppointments = userAppointments.map(appointment => ({
          ...appointment,
          date: new Date(appointment.date.seconds * 1000)
        }));
        setAppointments(formattedAppointments);
        setLoading(false);
      }
    };
    loadAppointments();
  }, [currentUser]);

  if (loading) {
    return (
      <CustomerLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Varaukset</h2>

        <div className="space-y-4">
          {appointments.map(appointment => (
            <div key={appointment.id} className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-all">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium">Pesu #{appointment.id.slice(0, 8)}</p>
                  <p className="text-sm text-gray-600 flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {format(appointment.date, "d. MMMM yyyy 'klo' HH:mm", { locale: fi })}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  appointment.status === 'confirmed' ? 'bg-green-100 text-green-800 ring-1 ring-green-600/20' :
                  appointment.status === 'completed' ? 'bg-blue-100 text-blue-800 ring-1 ring-blue-600/20' :
                  appointment.status === 'no_show' ? 'bg-purple-100 text-purple-800 ring-1 ring-purple-600/20' :
                  appointment.status === 'cancelled_by_customer' ? 'bg-orange-100 text-orange-800 ring-1 ring-orange-600/20' :
                  appointment.status === 'cancelled' ? 'bg-red-100 text-red-800 ring-1 ring-red-600/20' :
                  'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-600/20'
                }`}>
                  {appointment.status === 'confirmed' ? 'Vahvistettu' :
                   appointment.status === 'completed' ? 'Valmis' :
                   appointment.status === 'no_show' ? 'Ei saapunut' :
                   appointment.status === 'cancelled_by_customer' ? 'Peruttu (asiakas)' :
                   appointment.status === 'cancelled' ? 'Peruttu' :
                   'Odottaa'}
                </span>
              </div>

              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSupportDialog(true, `Apua varaukseni kanssa #${appointment.id.slice(0, 8)}`);
                  }}
                  className="inline-flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200/50 rounded-lg transition-colors"
                >
                  <MessageSquare className="w-4 h-4 mr-1.5" />
                  Tarvitsetko apua?
                </button>
                <div className="flex items-center space-x-2">
                {appointment.status === 'completed' && !appointment.feedback && (
                  <button
                    onClick={() => setSelectedAppointment(appointment)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                  >
                    <Star className="w-4 h-4 mr-1.5" />
                    Anna palautetta
                  </button>
                )}
                {appointment.feedback && (
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="flex items-center">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < appointment.feedback!.rating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="ml-2">Palaute annettu</span>
                  </div>
                )}
                </div>
              </div>
            </div>
          ))}

          {appointments.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Ei varauksia</p>
            </div>
          )}
        </div>
      </div>

      {selectedAppointment && (
        <FeedbackDialog
          isOpen={!!selectedAppointment}
          onClose={() => {
            setSelectedAppointment(null);
            // Refresh appointments to show updated feedback
            if (currentUser) {
              getCustomerAppointments(currentUser.uid).then(appointments => {
                const formattedAppointments = appointments.map(appointment => ({
                  ...appointment,
                  date: new Date(appointment.date.seconds * 1000)
                }));
                setAppointments(formattedAppointments);
              });
            }
          }}
          appointment={selectedAppointment}
        />
      )}
    </CustomerLayout>
  );
};

export default CustomerAppointments;
