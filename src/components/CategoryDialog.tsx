import React, { useState } from 'react';
import { X, Loader2, Package, Car, Armchair, Star, Sparkles } from 'lucide-react';
import type { ServiceCategory } from '../types/database';
import { updateServiceCategory } from '../lib/db';

interface CategoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  category: ServiceCategory;
  onCategorySaved: () => void;
}

const ICONS = [
  { id: 'car', label: 'Auto', icon: <Car className="w-5 h-5" /> },
  { id: 'armchair', label: 'Sisätilat', icon: <Armchair className="w-5 h-5" /> },
  { id: 'star', label: 'Premium', icon: <Star className="w-5 h-5" /> },
  { id: 'sparkles', label: 'Erikois', icon: <Sparkles className="w-5 h-5" /> },
  { id: 'package', label: 'Muu', icon: <Package className="w-5 h-5" /> }
];

const CategoryDialog: React.FC<CategoryDialogProps> = ({ 
  isOpen, 
  onClose, 
  category,
  onCategorySaved 
}) => {
  const [formData, setFormData] = useState({
    name: category.name,
    description: category.description,
    icon: category.icon
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description) {
      setError('Täytä kaikki kentät');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await updateServiceCategory(category.id, {
        ...category,
        name: formData.name,
        description: formData.description,
        icon: formData.icon
      });

      onCategorySaved();
      onClose();
    } catch (err) {
      console.error('Error updating category:', err);
      setError('Virhe kategorian päivityksessä');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl ios-glass m-4">
        <div className="sticky top-0 bg-white z-10 border-b px-4 py-3 sm:px-6 sm:py-4 flex justify-between items-center">
          <h2 className="text-lg sm:text-xl font-bold text-bilo-navy">Muokkaa kategoriaa</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-bilo-navy transition-colors duration-300 p-2 rounded-full hover:bg-bilo-gray">
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-bilo-navy mb-1">Kategorian nimi</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="modern-input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-bilo-navy mb-1">Kuvaus</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="modern-input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-bilo-navy mb-2">Kuvake</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {ICONS.map(icon => (
                  <button
                    key={icon.id}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, icon: icon.id }))}
                    className={`p-3 rounded-lg flex flex-col items-center justify-center space-y-1 transition-colors ${
                      formData.icon === icon.id 
                        ? 'bg-bilo-gray text-bilo-navy ring-2 ring-bilo-silver'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {icon.icon}
                    <span className="text-xs">{icon.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-3 sm:p-4 rounded-r-xl animate-fadeIn">
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

            <div className="flex flex-col-reverse sm:flex-row justify-end space-y-3 space-y-reverse sm:space-y-0 sm:space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-gray-600 hover:text-bilo-navy bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-300 active:scale-95"
              >
                Peruuta
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-bilo-silver text-bilo-navy rounded-xl hover:bg-bilo-navy hover:text-white shadow-md hover:shadow-lg transition-all duration-300 active:scale-95 disabled:opacity-50 flex items-center justify-center"
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

export default CategoryDialog;
