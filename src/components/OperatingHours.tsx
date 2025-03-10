import React from 'react';
import { Clock, Clock3, Sun, Moon, Ban, Clock2 as Clock24 } from 'lucide-react';
import type { Vendor } from '../types/database';

const DAYS = [
  { id: 'monday', label: 'Maanantai' },
  { id: 'tuesday', label: 'Tiistai' },
  { id: 'wednesday', label: 'Keskiviikko' },
  { id: 'thursday', label: 'Torstai' },
  { id: 'friday', label: 'Perjantai' },
  { id: 'saturday', label: 'Lauantai' },
  { id: 'sunday', label: 'Sunnuntai' }
];

type OperatingStatus = 'open' | 'closed' | '24h';

interface OperatingHoursProps {
  operatingHours: Vendor['operatingHours'];
  dayStatus: Record<string, OperatingStatus>;
  onStatusChange: (day: string, status: OperatingStatus) => void;
  onHoursChange: (day: string, type: 'open' | 'close', value: string) => void;
}

const OperatingHours: React.FC<OperatingHoursProps> = ({
  operatingHours,
  dayStatus,
  onStatusChange,
  onHoursChange
}) => {
  return (
    <div className="space-y-4 font-ubuntu">
      {/* Status Legend */}
      <div className="flex flex-wrap gap-4 mb-4 px-1">
        <div className="flex items-center text-sm bg-bilo-gray/30 rounded-lg px-3 py-1.5">
          <div className="w-3 h-3 bg-bilo-emerald rounded-full mr-2"></div>
          <span className="text-bilo-navy">Avoinna</span>
        </div>
        <div className="flex items-center text-sm bg-bilo-gray/30 rounded-lg px-3 py-1.5">
          <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
          <span className="text-bilo-navy">24h</span>
        </div>
        <div className="flex items-center text-sm bg-bilo-gray/30 rounded-lg px-3 py-1.5">
          <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
          <span className="text-bilo-navy">Suljettu</span>
        </div>
      </div>

      {/* Operating Hours Grid */}
      <div className="space-y-3">
        {DAYS.map(day => (
          <div key={day.id} className="p-4 bg-bilo-gray/30 rounded-xl hover:bg-bilo-gray/40 transition-all duration-300 shadow-sm hover:shadow">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              <div className="flex items-center">
                <span className="text-sm font-medium text-bilo-navy">{day.label}</span>
              </div>

              {/* Status Selection */}
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => onStatusChange(day.id, 'open')}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm transition-all duration-300 ${
                    dayStatus[day.id] === 'open'
                      ? 'bg-bilo-emerald/20 text-bilo-emerald font-medium ring-2 ring-bilo-emerald/50'
                      : 'bg-bilo-gray/50 text-gray-600 hover:bg-bilo-gray/70'
                  }`}
                >
                  <Sun className="w-4 h-4 mr-1.5" />
                  Auki
                </button>
                <button
                  type="button"
                  onClick={() => onStatusChange(day.id, '24h')}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm transition-all duration-300 ${
                    dayStatus[day.id] === '24h'
                      ? 'bg-blue-100 text-blue-600 font-medium ring-2 ring-blue-400/50'
                      : 'bg-bilo-gray/50 text-gray-600 hover:bg-bilo-gray/70'
                  }`}
                >
                  <Clock24 className="w-4 h-4 mr-1.5" />
                  24h
                </button>
                <button
                  type="button"
                  onClick={() => onStatusChange(day.id, 'closed')}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm transition-all duration-300 ${
                    dayStatus[day.id] === 'closed'
                      ? 'bg-red-100 text-red-600 font-medium ring-2 ring-red-400/50'
                      : 'bg-bilo-gray/50 text-gray-600 hover:bg-bilo-gray/70'
                  }`}
                >
                  <Ban className="w-4 h-4 mr-1.5" />
                  Suljettu
                </button>
              </div>

              {/* Time Inputs */}
              {dayStatus[day.id] === 'open' && (
                <div className="col-span-2 flex space-x-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Sun className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-bilo-silver" />
                      <input
                        type="time"
                        value={operatingHours[day.id]?.open || '09:00'}
                        onChange={(e) => onHoursChange(day.id, 'open', e.target.value)}
                        className="w-full pl-10 px-4 py-2.5 bg-white/70 border-2 border-transparent rounded-xl focus:border-bilo-silver focus:ring-2 focus:ring-bilo-silver/20 focus:bg-white shadow-sm transition-all duration-300"
                      />
                                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="relative">
                      <Moon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-bilo-silver" />
                      <input
                        type="time"
                        value={operatingHours[day.id]?.close || '17:00'}
                        onChange={(e) => onHoursChange(day.id, 'close', e.target.value)}
                        className="w-full pl-10 px-4 py-2.5 bg-white/70 border-2 border-transparent rounded-xl focus:border-bilo-silver focus:ring-2 focus:ring-bilo-silver/20 focus:bg-white shadow-sm transition-all duration-300"
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {dayStatus[day.id] === '24h' && (
                <div className="col-span-2 text-sm text-blue-600 flex items-center bg-white/60 px-4 py-2.5 rounded-xl">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>Avoinna 24 tuntia vuorokaudessa</span>
                </div>
              )}
              
              {dayStatus[day.id] === 'closed' && (
                <div className="col-span-2 text-sm text-red-600 flex items-center bg-white/60 px-4 py-2.5 rounded-xl">
                  <Ban className="w-4 h-4 mr-2" />
                  <span>Suljettu koko päivän</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OperatingHours;
