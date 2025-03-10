import React, { useState, useEffect } from 'react';
import { X, Loader2, ChevronDown, Plus } from 'lucide-react';
import type { Service, ServiceCategory } from '../types/database';
import { createService, updateService, deleteService, createServiceCategory } from '../lib/db';

interface ServiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  service?: Service | null;
  vendorId: string;
  categories: ServiceCategory[];
  onServiceSaved: () => void;
}

const ServiceDialog: React.FC<ServiceDialogProps> = ({ 
  isOpen, 
  onClose, 
  service, 
  vendorId,
  categories,
  onServiceSaved 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    price: '',
    duration: '30',
    available: true,
    coinReward: '0'
  });
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    icon: 'car'
  });
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
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

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name,
        description: service.description,
        categoryId: service.categoryId,
        price: service.price.toString(),
        duration: service.duration.toString(),
        available: service.available,
        coinReward: (service.coinReward || 0).toString()
      });
    } else {
      setFormData({
        name: '',
        description: '',
        categoryId: categories[0]?.id || '',
        price: '',
        duration: '30',
        available: true,
        coinReward: '0'
      });
    }
  }, [service]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.categoryId && categories.length > 0) {
      formData.categoryId = categories[0].id;
    }
    
    try {
      setLoading(true);
      setError(null);

      const serviceData = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        duration: parseInt(formData.duration) || 30,
        coinReward: parseInt(formData.coinReward) || 0,
        categoryId: formData.categoryId || categories[0]?.id
      };

      if (service) {
        await updateService(service.id, {
          ...serviceData,
          vendorId // Ensure vendorId is preserved
        });
      } else {
        await createService({
          ...serviceData,
          vendorId,
          id: '' // Will be set by Firestore
        });
      }

      onServiceSaved();
      onClose();
    } catch (err) {
      console.error('Error saving service:', err);
      setError('Virhe palvelun tallennuksessa');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!service) return;

    try {
      setLoading(true);
      setError(null);

      await deleteService(service.id);
      onServiceSaved();
      onClose();
    } catch (err) {
      console.error('Error deleting service:', err);
      setError('Virhe palvelun poistossa');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault?.();
    
    if (!newCategory.name || !newCategory.description) {
      setError('Täytä kaikki kentät');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const categoryId = await createServiceCategory({
        ...newCategory,
        vendorId,
        order: categories.length + 1,
        icon: newCategory.icon
      });
      
      // Set the new category as selected
      setFormData(prev => ({ ...prev, categoryId }));
      // Reset form
      setNewCategory({
        name: '',
        description: '',
        icon: 'car'
      });
      setShowNewCategoryForm(false);
      // Refresh categories list
      const refreshCategories = async () => {
        await onServiceSaved();
      };
      await refreshCategories();
      
    } catch (err) {
      console.error('Error creating category:', err);
      setError('Virhe kategorian luonnissa');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 modal-animation overflow-y-auto">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl ios-glass transform transition-all duration-300 my-4 sm:my-8 mx-4">
        <div className="sticky top-0 bg-white z-10 border-b px-4 py-3 sm:px-6 sm:py-4 flex justify-between items-center">
          <h2 className="text-lg sm:text-xl font-bold text-bilo-navy">
            {service ? 'Muokkaa palvelua' : 'Lisää uusi palvelu'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-bilo-navy transition-colors duration-300 p-2 rounded-full hover:bg-bilo-gray">
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-sm font-medium text-bilo-navy mb-1">Nimi</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="modern-input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-bilo-navy mb-1">Kategoria</label>
              <div className="relative mt-1">
                <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                    className="modern-input appearance-none pr-10 w-full"
                    required
                  >
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNewCategoryForm(true)}
                    data-add-category
                    className="px-3 py-2 bg-bilo-gray text-bilo-navy rounded-xl hover:bg-bilo-silver flex items-center justify-center transition-all duration-300 active:scale-95"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    <span>Lisää kategoria</span>
                  </button>
                </div>
                
                {/* New Category Form */}
                {showNewCategoryForm && (
                  <div className="fixed inset-0 sm:absolute sm:top-full sm:left-0 sm:right-0 sm:inset-auto flex items-center justify-center sm:block sm:mt-2 bg-black/40 sm:bg-transparent backdrop-blur-sm sm:backdrop-blur-none z-20 p-4 sm:p-0">
                    <div className="bg-white rounded-xl shadow-lg ios-glass border border-gray-100 w-full max-w-sm sm:max-w-none sm:w-auto animate-fadeIn p-5">
                      <div className="flex justify-between items-center mb-4 sm:hidden">
                        <h3 className="text-lg font-medium text-bilo-navy">Lisää uusi kategoria</h3>
                        <button 
                          type="button" 
                          onClick={() => setShowNewCategoryForm(false)}
                          className="text-gray-500 hover:text-bilo-navy p-1"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-bilo-navy mb-1">Kategorian nimi</label>
                          <input
                            placeholder="Esim. Premium-pesut"
                            type="text"
                            value={newCategory.name}
                            onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                            className="modern-input"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-bilo-navy mb-1">Kuvaus</label>
                          <input
                            placeholder="Esim. Premium-tason autopesupalvelut"
                            type="text"
                            value={newCategory.description}
                            onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                            className="modern-input"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-bilo-navy mb-1">Kuvake</label>
                          <select
                            value={newCategory.icon}
                            onChange={(e) => setNewCategory(prev => ({ ...prev, icon: e.target.value }))}
                            className="modern-input"
                          >
                            <option value="car">Auto</option>
                            <option value="armchair">Sisätilat</option>
                            <option value="star">Premium</option>
                            <option value="sparkles">Erikois</option>
                            <option value="package">Muu</option>
                          </select>
                        </div>
                        
                        <div className="flex justify-end space-x-3 pt-2">
                          <button
                            type="button"
                            onClick={() => setShowNewCategoryForm(false)}
                            className="px-4 py-2.5 text-gray-600 hover:text-bilo-navy transition-colors duration-300 rounded-xl"
                          >
                            Peruuta
                          </button>
                          <button
                            type="submit"
                            disabled={loading}
                            onClick={handleCreateCategory}
                            className="px-4 py-2.5 bg-bilo-silver text-bilo-navy rounded-xl hover:bg-bilo-navy hover:text-white shadow-md hover:shadow-lg transition-all duration-300 active:scale-95 disabled:opacity-50"
                          >
                            {loading ? 'Luodaan...' : 'Luo kategoria'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-bilo-navy mb-1">Kuvaus</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="modern-input"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-bilo-navy mb-1">Hinta (€)</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  min="0"
                  step="0.01"
                  className="modern-input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-bilo-navy mb-1">Kesto (min)</label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                  min="5"
                  step="5"
                  className="modern-input"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-bilo-navy mb-1">Kolikkopalkkio</label>
              <input
                type="number"
                value={formData.coinReward}
                onChange={(e) => setFormData(prev => ({ ...prev, coinReward: e.target.value }))}
                min="0"
                className="modern-input"
              />
              <p className="mt-1 text-sm text-gray-500">
                Asiakkaat saavat tämän verran kolikoita varatessaan tämän palvelun
              </p>
            </div>

            <div className="flex items-center mt-4">
              <div className="relative inline-block w-10 h-6 mr-2">
                <input 
                  type="checkbox"
                  checked={formData.available}
                  onChange={(e) => setFormData(prev => ({ ...prev, available: e.target.checked }))}
                  className="opacity-0 w-0 h-0"
                  id="toggle-available"
                />
                <label 
                  htmlFor="toggle-available"
                  className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-all duration-300 ${formData.available ? 'bg-bilo-emerald' : 'bg-gray-300'}`}
                >
                  <span 
                    className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-all duration-300 transform ${formData.available ? 'left-5' : 'left-1'}`}
                  />
                </label>
              </div>
              <label htmlFor="toggle-available" className="block text-sm text-bilo-navy cursor-pointer">
                Palvelu on varattavissa
              </label>
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

            <div className="flex flex-col sm:flex-row justify-between gap-4 sm:gap-0 pt-4">
              {service && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-4 py-2.5 text-red-600 hover:text-red-700 font-medium disabled:opacity-50 hover:bg-red-50 rounded-xl transition-all duration-300 order-2 sm:order-1"
                >
                  Poista palvelu
                </button>
              )}
              <div className="flex space-x-3 w-full sm:w-auto justify-end order-1 sm:order-2">
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
                  className="px-5 py-2.5 bg-bilo-silver text-bilo-navy rounded-xl hover:bg-bilo-navy hover:text-white shadow-md hover:shadow-lg transition-all duration-300 active:scale-95 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <Loader2 className="animate-spin h-5 w-5 mr-2" />
                      Tallennetaan...
                    </div>
                  ) : (
                    'Tallenna'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ServiceDialog;
