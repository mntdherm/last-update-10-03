import React from 'react';
import { MapPin } from 'lucide-react';

interface CitySelectorProps {
  selectedCity: string;
  onCityChange: (city: string) => void;
}

const CITIES = [
  'Helsinki',
  'Espoo', 
  'Tampere',
  'Vantaa',
  'Oulu',
  'Turku',
  'Jyväskylä',
  'Lahti',
  'Kuopio',
  'Pori',
  'Joensuu',
  'Lappeenranta',
  'Hämeenlinna',
  'Vaasa',
  'Seinäjoki',
  'Rovaniemi',
  'Mikkeli',
  'Kotka',
  'Salo',
  'Porvoo'
];

const CitySelector: React.FC<CitySelectorProps> = ({ selectedCity, onCityChange }) => {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <MapPin className="h-5 w-5 text-gray-400" />
      </div>
      <select
        value={selectedCity}
        onChange={(e) => onCityChange(e.target.value)}
        className="block w-full pl-10 pr-10 py-3 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-xl bg-white"
      >
        <option value="">Kaikki kaupungit</option>
        {CITIES.map(city => (
          <option key={city} value={city}>{city}</option>
        ))}
      </select>
    </div>
  );
};

export default CitySelector;
