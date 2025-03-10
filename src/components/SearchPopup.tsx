import React from 'react';
import { X } from 'lucide-react';
import SearchBar from './SearchBar';
import { useState } from 'react';

interface SearchPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchPopup: React.FC<SearchPopupProps> = ({ isOpen, onClose }) => {
  const [selectedCity, setSelectedCity] = useState('');

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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 animate-[fadeIn_0.2s_ease-out]">
      <div className="w-full min-h-[60vh] bg-white/90 backdrop-blur-xl rounded-b-2xl transform transition-all animate-[iosSlideUp_0.3s_cubic-bezier(0.175,0.885,0.32,1.275)] shadow-2xl border border-white/20">
        <div className="p-4">
          <div className="flex justify-end mb-2">
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/80 rounded-full transition-all active:scale-90"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
          
          <SearchBar 
            isMobile={true}
            onClose={onClose}
            selectedCity={selectedCity}
            onCityChange={setSelectedCity}
          />
        </div>
      </div>
    </div>
  );
};

export default SearchPopup;
