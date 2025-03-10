import React, { useState } from 'react';
import { X, Loader2, Calendar, Clock, Percent, Tag, ChevronDown } from 'lucide-react';
import type { Offer, Service } from '../types/database';
import { createOffer, updateOffer } from '../lib/db';

interface OfferDialogProps {
  isOpen: boolean;
  onClose: () => void;
  offer?: Offer | null;
  vendorId: string;
  services: Service[];
  onOfferSaved: () => void;
}

const OfferDialog: React.FC<OfferDialogProps> = ({ 
  isOpen, 
  onClose, 
  offer,
  vendorId,
  services,
  onOfferSaved 
}) => {
  const [formData, setFormData] = useState({
    title: offer?.title || '',
    description: offer?.description || '',
    serviceId: offer?.serviceId || services[0]?.id || '',
    discountPercentage: offer?.discountPercentage || 10,
    startDate: offer?.startDate ? new Date(offer.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    endDate: offer?.endDate ? new Date(offer.endDate).toISOString().split('T')[0] : '',
    active: offer?.active ?? true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.serviceId || !formData.startDate || !formData.endDate) {
      setError('Täytä kaikki kentät');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const offerData = {
        ...formData,
        vendorId,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        discountPercentage: Number(formData.discountPercentage)
      };

      if (offer) {
        await updateOffer(offer.id, offerData);
      } else {
        await createOffer(offerData);
      }

      onOfferSaved();
      onClose();
    } catch (err) {
      console.error('Error saving offer:', err);
      setError('Virhe tarjouksen tallennuksessa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl w-full max-w-lg transform transition-all animate-[iosScale_0.3s_cubic-bezier(0.175,0.885,0.32,1.275)] shadow-2xl border border-bilo-silver/20">
        <div className="p-6 relative">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <div className="p-2 bg-bilo-gray rounded-xl mr-3">
                <Tag className="w-6 h-6 text-bilo-navy" />
              </div>
              <h2 className="text-2xl font-bold text-bilo-navy">
                {offer ? 'Muokkaa tarjousta' : 'Uusi tarjous'}
              </h2>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative group">
              <label className="block text-sm font-medium text-gray-700 mb-1">Palvelu</label>
              <select
                value={formData.serviceId}
                onChange={(e) => setFormData(prev => ({ ...prev, serviceId: e.target.value }))}
                className="block w-full rounded-xl py-3 px-4 bg-bilo-gray border-2 border-transparent
                  focus:bg-white focus:ring-2 focus:ring-bilo-silver focus:border-transparent
                  transition-all duration-300 ease-in-out appearance-none
                  hover:bg-gray-100"
                required
              >
                {services.map(service => (
                  <option key={service.id} value={service.id}>
                    {service.name} ({service.price}€)
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-[60%] transform -translate-y-1/2 text-gray-400 pointer-events-none transition-transform duration-200 group-hover:text-gray-600" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Otsikko</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="block w-full rounded-xl py-3 px-4 bg-bilo-gray border-2 border-transparent
                  focus:bg-white focus:ring-2 focus:ring-bilo-silver focus:border-transparent
                  transition-all duration-300 ease-in-out
                  hover:bg-gray-100"
                placeholder="Esim. Kesätarjous -20%"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Kuvaus</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="block w-full rounded-xl py-3 px-4 bg-bilo-gray border-2 border-transparent
                  focus:bg-white focus:ring-2 focus:ring-bilo-silver focus:border-transparent
                  transition-all duration-300 ease-in-out resize-none
                  hover:bg-gray-100"
                placeholder="Kerro asiakkaille tarjouksen yksityiskohdat ja ehdot..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Alennusprosentti</label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <input
                  type="number"
                  value={formData.discountPercentage}
                  onChange={(e) => setFormData(prev => ({ ...prev, discountPercentage: Number(e.target.value) }))}
                  min="1"
                  max="100"
                  className="block w-full pr-12 rounded-xl py-3 px-4 bg-bilo-gray border-2 border-transparent
                    focus:bg-white focus:ring-2 focus:ring-bilo-silver focus:border-transparent
                    transition-all duration-300 ease-in-out
                    hover:bg-gray-100"
                  required
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">%</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Alkaa</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  className="block w-full rounded-xl py-3 px-4 bg-bilo-gray border-2 border-transparent
                    focus:bg-white focus:ring-2 focus:ring-bilo-silver focus:border-transparent
                    transition-all duration-300 ease-in-out
                    hover:bg-gray-100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Päättyy</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  className="block w-full rounded-xl py-3 px-4 bg-bilo-gray border-2 border-transparent
                    focus:bg-white focus:ring-2 focus:ring-bilo-silver focus:border-transparent
                    transition-all duration-300 ease-in-out
                    hover:bg-gray-100"
                  required
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                className="h-5 w-5 text-bilo-navy focus:ring-bilo-silver border-bilo-gray rounded-md
                  transition-colors duration-200"
              />
              <label className="ml-3 block text-sm font-medium text-gray-700">
                Tarjous on aktiivinen
              </label>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
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

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-bilo-navy hover:text-bilo-navy/80 rounded-xl hover:bg-bilo-gray
                  transition-all duration-200 active:scale-95"
              >
                Peruuta
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-bilo-silver text-bilo-navy rounded-xl
                  hover:opacity-90 disabled:opacity-50 flex items-center transform transition-all
                  active:scale-95 shadow-lg font-medium"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Tallennetaan...
                  </>
                ) : (
                  'Tallenna'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OfferDialog;
