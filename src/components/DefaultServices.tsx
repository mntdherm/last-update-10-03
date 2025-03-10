import React from 'react';
import { Plus, Clock, Coins } from 'lucide-react';
import type { Service } from '../types/database';
import { DEFAULT_SERVICES } from '../lib/defaultServices';

interface DefaultServicesProps {
  onAddService: (service: Omit<Service, 'id' | 'vendorId'>) => void;
}

const DefaultServices: React.FC<DefaultServicesProps> = ({ onAddService }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Valmiit palvelumallit</h3>
      <p className="text-gray-600 mb-6">
        Lisää valmiita palvelumalleja nopeasti käyttöösi. Voit muokata niiden tietoja myöhemmin.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DEFAULT_SERVICES.map((service, index) => (
          <div key={index} className="border rounded-lg p-4 hover:border-blue-500 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-medium">{service.name}</h4>
                <p className="text-sm text-gray-600">{service.description}</p>
              </div>
              <button
                onClick={() => onAddService(service)}
                className="text-blue-600 hover:text-blue-800 p-2"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center justify-between mt-4 text-sm">
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-gray-600">
                  <Clock className="w-4 h-4 mr-1" />
                  {service.duration} min
                </div>
                <span className="font-medium">{service.price}€</span>
              </div>
              {service.coinReward > 0 && (
                <div className="flex items-center text-yellow-600">
                  <Coins className="w-4 h-4 mr-1" />
                  +{service.coinReward}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DefaultServices;
