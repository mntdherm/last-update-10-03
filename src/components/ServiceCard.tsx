import React from 'react';
import { Clock, Coins, Edit, Check, X } from 'lucide-react';
import type { Service } from '../types/database';

interface ServiceCardProps {
  service: Service;
  onEdit: () => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, onEdit }) => {
  return (
    <div 
      className={`ios-glass bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300 transform hover:scale-105 border ${
        service.available ? 'border-l-4 border-bilo-emerald' : 'border-l-4 border-red-500'
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-bilo-navy">{service.name}</h3>
          <p className="text-gray-600 mt-1.5 text-sm line-clamp-2">{service.description}</p>
        </div>
        <button 
          className="p-2.5 bg-bilo-gray hover:bg-bilo-silver text-gray-600 hover:text-bilo-navy rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
          onClick={onEdit}
          aria-label="Muokkaa palvelua"
        >
          <Edit className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mt-5">
        <div className="flex items-center bg-bilo-gray px-3 py-1.5 rounded-full shadow-sm">
          <Clock className="h-4 w-4 text-gray-500 mr-1.5" />
          <span className="text-sm text-bilo-navy">{service.duration} min</span>
        </div>
        
        <div className="flex items-center bg-bilo-silver px-3 py-1.5 rounded-full shadow-sm">
          <span className="text-sm font-medium text-bilo-navy">{service.price.toFixed(2)}€</span>
        </div>
        
        {service.coinReward > 0 && (
          <div className="flex items-center bg-yellow-50 px-3 py-1.5 rounded-full shadow-sm">
            <Coins className="h-4 w-4 text-yellow-600 mr-1.5" />
            <span className="text-sm font-medium text-yellow-700">+{service.coinReward}</span>
          </div>
        )}
        
        <div className={`flex items-center px-3 py-1.5 rounded-full ml-auto shadow-sm ${
          service.available ? 'bg-green-50 text-bilo-emerald' : 'bg-red-50 text-red-700'
        }`}>
          {service.available ? (
            <>
              <Check className="h-4 w-4 mr-1.5" />
              <span className="text-sm font-medium">Saatavilla</span>
            </>
          ) : (
            <>
              <X className="h-4 w-4 mr-1.5" />
              <span className="text-sm font-medium">Ei saatavilla</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;
