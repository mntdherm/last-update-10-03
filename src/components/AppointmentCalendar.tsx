import React, { useState } from 'react';
import { format, addWeeks, subWeeks, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { fi } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Appointment, Vendor } from '../types/database';

interface AppointmentCalendarProps {
  vendor: Vendor;
  appointments: Appointment[];
  onAppointmentClick?: (appointment: Appointment) => void;
}

const HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 8:00 - 22:00

const statusColors = {
  open: 'bg-emerald-100',
  closed: 'bg-rose-100',
  '24h': 'bg-sky-100',
  default: 'bg-white',
};

const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({
  vendor,
  appointments,
  onAppointmentClick
}) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [hoveredAppointment, setHoveredAppointment] = useState<string | null>(null);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const nextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));
  const prevWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));

  const getOperatingHours = (date: Date) => {
    const dayName = format(date, 'EEEE', { locale: fi }).toLowerCase();
    return vendor.operatingHours[dayName] || { open: '09:00', close: '17:00' };
  };

  const isOpen = (date: Date, hour: number) => {
    const hours = getOperatingHours(date);

    // If hours are set to 'closed', the business is closed
    if (hours.open === 'closed' && hours.close === 'closed') {
      return false;
    }

    // If hours are set to 24h operation
    if (hours.open === '00:00' && hours.close === '23:59') {
      return true;
    }

    // Parse operating hours
    const [openHour] = hours.open.split(':').map(Number);
    const [closeHour] = hours.close.split(':').map(Number);

    return hour >= openHour && hour < closeHour;
  };

  const getAppointmentsForDay = (date: Date) => {
    return appointments.filter(appointment => {
      const appointmentDate = appointment.date instanceof Date
        ? appointment.date
        : new Date(appointment.date);
      return isSameDay(appointmentDate, date);
    });
  };

  const formatAppointmentTime = (date: Date | string) => {
    const appointmentDate = date instanceof Date ? date : new Date(date);
    return format(appointmentDate, 'HH:mm');
  };

  const getDayStatus = (date: Date) => {
    const hours = getOperatingHours(date);
    if (hours.open === 'closed' && hours.close === 'closed') {
      return 'closed';
    }
    if (hours.open === '00:00' && hours.close === '23:59') {
      return '24h';
    }
    return 'open';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
      {/* Calendar Header */}
      <div className="p-4 border-b sm:p-6">
        <div className="flex items-center justify-between mb-2 sm:mb-4">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={prevWeek}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <h2 className="text-sm font-semibold sm:text-xl">
              {format(weekStart, 'd.M.yyyy', { locale: fi })} - {format(weekEnd, 'd.M.yyyy', { locale: fi })}
            </h2>
            <button
              onClick={nextWeek}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
          <div className="hidden sm:flex items-center space-x-2 sm:space-x-4">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-emerald-500 rounded-full mr-1"></div>
              <span className="text-xs">Avoinna</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-rose-500 rounded-full mr-1"></div>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-600 rounded-full mr-1"></div>
              <span className="text-xs">Varaus</span>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="relative">
        {/* Time Labels */}
        <div className="absolute left-0 top-0 w-10 sm:w-14 bg-gray-50 z-10 border-r border-gray-200">
          {HOURS.map(hour => (
            <div
              key={hour}
              className="h-12 sm:h-16 border-b border-gray-200 flex items-center justify-center text-[10px] sm:text-xs font-medium text-gray-500"
            >
              {hour.toString().padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="ml-10 sm:ml-14">
          <div className="grid grid-cols-7 divide-x divide-gray-200">
            {days.map(day => {
              const dayAppointments = getAppointmentsForDay(day);
              const dayStatus = getDayStatus(day);
              const dayColor = statusColors[dayStatus] || statusColors.default;
              const hours = getOperatingHours(day);
              const isClosedDay = hours.open === 'closed' && hours.close === 'closed';
              const is24h = hours.open === '00:00' && hours.close === '23:59';

              return (
                <div key={day.toString()} className={`relative ${dayColor}`}>
                  {/* Day Header */}
                  <div className="text-center py-1 border-b border-gray-200">
                    <div className="text-xs font-medium text-gray-600">
                      {format(day, 'EEEEE', { locale: fi })}
                    </div>
                    <div className="text-sm font-semibold mt-1">
                      {format(day, 'd')}
                    </div>
                  </div>

                  {HOURS.map(hour => {
                    const isOpenHour = isOpen(day, hour);

                    return (
                      <div
                        key={hour}
                        className={`h-12 sm:h-16 relative ${!isOpenHour && !is24h ? 'bg-gray-50/50' : ''}`}
                      >
                        {/* Closed Indicator */}
                        {/* {!isOpenHour && !is24h && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-xs text-red-400 font-medium">Suljettu</div>
                          </div>
                        )} */}

                        {/* Appointments */}
                        {dayAppointments.map(appointment => {
                          const appointmentDate = appointment.date instanceof Date
                            ? appointment.date
                            : new Date(appointment.date);
                          const appointmentHour = appointmentDate.getHours();
                          const appointmentMinutes = appointmentDate.getMinutes();

                          if (appointmentHour === hour) {
                            const isHovered = hoveredAppointment === appointment.id;
                            return (
                              <div
                                onClick={() => onAppointmentClick?.(appointment)}
                                onMouseEnter={() => setHoveredAppointment(appointment.id)}
                                onMouseLeave={() => setHoveredAppointment(null)}
                                key={appointment.id}
                                className={`absolute left-0 right-0 p-1 rounded m-0.5 text-xs cursor-pointer transition-colors
                                  transform ${isHovered ? 'scale-[1.02] shadow-lg' : ''}
                                  ${appointment.status === 'confirmed'
                                    ? 'bg-emerald-500 hover:bg-emerald-600'
                                    : appointment.status === 'no_show'
                                      ? 'bg-purple-600 hover:bg-purple-700'
                                      : appointment.status === 'cancelled_by_customer'
                                        ? 'bg-amber-500 hover:bg-amber-600'
                                        : appointment.status === 'cancelled'
                                          ? 'bg-rose-500 hover:bg-rose-600'
                                          : 'bg-blue-600 hover:bg-blue-700'
                                  } text-white`}
                                style={{
                                  top: `${(appointmentMinutes / 60) * 100}%`,
                                  height: `${(appointment.duration / 60) * 100}%`,
                                  zIndex: isHovered ? 20 : 10
                                }}
                              >
                                <div className="flex items-center space-x-1">
                                  {formatAppointmentTime(appointmentDate)}
                                  {appointment.customerDetails?.licensePlate && (
                                    <span className="font-medium">{appointment.customerDetails.licensePlate}</span>
                                  )}
                                </div>
                                {isHovered && appointment.customerDetails && (
                                  <div className="text-xxs mt-0.5 opacity-90">
                                    {appointment.customerDetails.firstName} {appointment.customerDetails.lastName}
                                  </div>
                                )}
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentCalendar;
