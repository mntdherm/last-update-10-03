import React from 'react';
import { X, Clock, User, Store, Calendar, CreditCard, Coins, LogIn, LogOut, Settings, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fi } from 'date-fns/locale';
import type { User as UserType, Transaction, Appointment } from '../types/database';

interface AccountLogsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType;
  appointments?: Appointment[];
}

const AccountLogsDialog: React.FC<AccountLogsDialogProps> = ({
  isOpen,
  onClose,
  user,
  appointments = []
}) => {
  if (!isOpen) return null;

  // Combine all activities into one timeline
  const timeline = [
    // Account creation
    {
      type: 'account',
      date: user.createdAt,
      description: 'Tili luotu',
      icon: <User className="w-5 h-5 text-blue-500" />
    },
    // Wallet transactions
    ...(user.wallet?.transactions || []).map(transaction => ({
      type: 'transaction',
      date: transaction.timestamp,
      description: transaction.description,
      amount: transaction.amount,
      transactionType: transaction.type,
      icon: <Coins className="w-5 h-5 text-yellow-500" />
    })),
    // Appointments
    ...appointments.map(appointment => ({
      type: 'appointment',
      date: appointment.date,
      description: `Varaus #${appointment.id.slice(0, 8)}`,
      status: appointment.status,
      price: appointment.totalPrice,
      icon: <Calendar className="w-5 h-5 text-green-500" />
    }))
  ].sort((a, b) => {
    const dateA = a.date instanceof Date ? a.date : new Date(a.date.seconds * 1000);
    const dateB = b.date instanceof Date ? b.date : new Date(b.date.seconds * 1000);
    return dateB.getTime() - dateA.getTime();
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'no_show': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Vahvistettu';
      case 'completed': return 'Valmis';
      case 'cancelled': return 'Peruttu';
      case 'no_show': return 'Ei saapunut';
      default: return status;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Tilin tapahtumat</h2>
              <p className="mt-1 text-gray-500">
                {user.role === 'vendor' ? 'Yritys' : 'Asiakas'}: {user.email}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Timeline */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="flow-root">
            <ul role="list" className="-mb-8">
              {timeline.map((event, eventIdx) => (
                <li key={eventIdx}>
                  <div className="relative pb-8">
                    {eventIdx !== timeline.length - 1 ? (
                      <span
                        className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-gray-200"
                        aria-hidden="true"
                      />
                    ) : null}
                    <div className="relative flex items-start space-x-3">
                      <div className="relative">
                        <div className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center ring-8 ring-white">
                          {event.icon}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1 py-3">
                        <div className="text-sm leading-8 text-gray-500">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900">{event.description}</span>
                            <time className="flex-shrink-0 whitespace-nowrap">
                              {format(
                                event.date instanceof Date 
                                  ? event.date 
                                  : new Date(event.date.seconds * 1000),
                                "d.M.yyyy 'klo' HH:mm",
                                { locale: fi }
                              )}
                            </time>
                          </div>
                          
                          {/* Transaction details */}
                          {'transactionType' in event && (
                            <div className="mt-2 flex items-center justify-between">
                              <span className={`text-sm ${
                                event.transactionType === 'credit' 
                                  ? 'text-green-600' 
                                  : 'text-red-600'
                              }`}>
                                {event.transactionType === 'credit' ? '+' : '-'}{event.amount} kolikkoa
                              </span>
                            </div>
                          )}

                          {/* Appointment details */}
                          {'status' in event && (
                            <div className="mt-2 flex items-center justify-between">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                getStatusColor(event.status)
                              }`}>
                                {getStatusText(event.status)}
                              </span>
                              <span className="font-medium">{event.price}€</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountLogsDialog;
