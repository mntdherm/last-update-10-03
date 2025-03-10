import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Clock, Sparkles, Car, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

interface SearchBarProps {
  onClose?: () => void;
  isMobile?: boolean;
  selectedCity?: string;
  onCityChange?: (city: string) => void;
}

const RECENT_SEARCHES_KEY = 'recentSearches';
const MAX_RECENT_SEARCHES = 5;

const POPULAR_SEARCHES = [
  { id: 'quick', name: 'Pikapesu', icon: <Car className="w-4 h-4" /> },
  { id: 'interior', name: 'Sisäpesu', icon: <Car className="w-4 h-4" /> },
  { id: 'premium', name: 'Premium-pesu', icon: <Sparkles className="w-4 h-4" /> }
];

const SearchBar: React.FC<SearchBarProps> = ({ onClose, isMobile, selectedCity, onCityChange }) => {
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [showCityPopup, setShowCityPopup] = useState(false);
  const cityPopupRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Load recent searches from localStorage
    const savedSearches = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches));
    }

    // Focus input on mobile
    if (isMobile && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isMobile]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const isSearchClick = searchRef.current?.contains(event.target as Node);
      const isCityPopupClick = cityPopupRef.current?.contains(event.target as Node);
      
      // Handle search suggestions
      if (!isSearchClick) {
        setIsFocused(false);
      }
      
      // Handle city popup
      if (!isCityPopupClick && !isSearchClick) {
        setShowCityPopup(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addToRecentSearches = (term: string) => {
    const newSearches = [
      term,
      ...recentSearches.filter(s => s !== term)
    ].slice(0, MAX_RECENT_SEARCHES);
    
    setRecentSearches(newSearches);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(newSearches));
  };

  const handleSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    
    // Add to recent searches
    addToRecentSearches(searchTerm);

    // Build search URL with parameters
    const params = new URLSearchParams();
    params.append('q', searchTerm);
    if (selectedCity) {
      params.append('city', selectedCity);
    }

    // Navigate to search results
    if (isMobile) {
      // For mobile popup, use window.location to force refresh
      window.location.href = `/search?${params.toString()}`;
    } else {
      // For desktop, use navigate
      navigate(`/search?${params.toString()}`);
    }
    setIsFocused(false);
    setQuery('');
    onClose?.();
  };

  const handlePopularSearch = (searchTerm: string) => {
    // Add to recent searches
    addToRecentSearches(searchTerm);

    // Build search URL with parameters
    const params = new URLSearchParams();
    params.append('q', searchTerm);
    if (selectedCity) {
      params.append('city', selectedCity);
    }
    
    // Navigate to search results
    if (isMobile) {
      // For mobile popup, use window.location to force refresh
      window.location.href = `/search?${params.toString()}`;
    } else {
      // For desktop, use navigate
      navigate(`/search?${params.toString()}`);
    }
    setIsFocused(false);
    setQuery('');
    onClose?.();
  };

  const removeRecentSearch = (term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSearches = recentSearches.filter(s => s !== term);
    setRecentSearches(newSearches);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(newSearches));
  };

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="flex flex-col space-y-3">
        {/* City Selector */}
        <div className="w-full">
          <button
            onClick={() => {
              setShowCityPopup(true);
              setIsFocused(false);
            }}
            className="relative w-full flex items-center pl-3 pr-4 py-3.5 text-left border border-gray-200 focus:outline-none focus:ring-2 focus:ring-bilo-silver rounded-lg bg-white hover:bg-bilo-gray transition-colors"
          >
            <MapPin className="h-5 w-5 text-bilo-navy mr-2" />
            <span className="text-sm font-medium truncate text-bilo-navy">
              {selectedCity || 'Kaikki kaupungit'}
            </span>
          </button>

          {/* City Selection Popup */}
          {showCityPopup && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-[fadeIn_0.2s_ease-out]">
              <div ref={cityPopupRef} className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl">
                <div className="p-4 border-b border-bilo-gray">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-bilo-navy">Valitse kaupunki</h3>
                    <button
                      onClick={() => setShowCityPopup(false)}
                      className="p-2 hover:bg-bilo-gray rounded-full transition-colors"
                    >
                      <X className="w-5 h-5 text-bilo-navy" />
                    </button>
                  </div>
                </div>
                <div className="p-2 max-h-[60vh] overflow-y-auto">
                  <button
                    onClick={() => {
                      onCityChange?.('');
                      setShowCityPopup(false);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-bilo-gray rounded-xl flex items-center group"
                  >
                    <MapPin className="w-5 h-5 text-bilo-navy group-hover:text-bilo-emerald mr-3" />
                    <span className="font-medium text-bilo-navy">Kaikki kaupungit</span>
                  </button>
                  {CITIES.map(city => (
                    <button
                      key={city}
                      onClick={() => {
                        onCityChange?.(city);
                        setShowCityPopup(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-bilo-gray rounded-xl flex items-center group"
                    >
                      <MapPin className="w-5 h-5 text-bilo-navy group-hover:text-bilo-emerald mr-3" />
                      <span className="font-medium text-bilo-navy">{city}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Search Input */}
        <div className="w-full">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
          }}
          onFocus={() => setIsFocused(true)}
          placeholder="Etsi palveluita..."
          className={`
            w-full pl-12 pr-10 py-3.5 bg-white/80 rounded-ios text-bilo-navy 
            w-full pl-12 pr-10 py-3.5 bg-white text-bilo-navy 
            placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-bilo-silver 
            border border-gray-200 rounded-lg
            hover:bg-bilo-gray transition-all
            ${isMobile ? 'shadow-sm' : 'shadow-md'}
          `}
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setIsFocused(false);
            }}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-bilo-navy hover:text-bilo-navy p-1 hover:bg-bilo-gray rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {isFocused && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-bilo-gray overflow-hidden z-50">
          {query && (
            <button
              onClick={() => handleSearch(query)}
              className="w-full px-4 py-3 text-left hover:bg-bilo-gray flex items-center text-bilo-emerald transition-all ios-btn-active"
            >
              <Search className="w-4 h-4 mr-3" />
              <span>Hae: <span className="font-medium">{query}</span></span>
            </button>
          )}

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="px-3 py-2">
              <h3 className="text-xs font-medium text-bilo-navy px-1 mb-1">Viimeisimmät haut</h3>
              {recentSearches.map((term, index) => (
                <button
                  key={index}
                  onClick={() => handleSearch(term)}
                  className="w-full px-4 py-2.5 text-left hover:bg-bilo-gray rounded-lg flex items-center justify-between group transition-colors"
                >
                  <div className="flex items-center text-bilo-navy">
                    <Clock className="w-4 h-4 mr-3 text-bilo-silver" />
                    {term}
                  </div>
                  <X
                    className="w-4 h-4 text-bilo-navy opacity-0 group-hover:opacity-100 hover:bg-bilo-gray rounded-full p-1 transition-all"
                    onClick={(e) => removeRecentSearch(term, e)}
                  />
                </button>
              ))}
            </div>
          )}

          {/* Popular Searches */}
          <div className="px-3 py-2 border-t border-bilo-gray">
            <h3 className="text-xs font-medium text-bilo-navy px-1 mb-1">Suositut haut</h3>
            {POPULAR_SEARCHES.map((search) => (
              <button
                key={search.id}
                onClick={() => handlePopularSearch(search.name)}
                className="w-full px-4 py-2.5 text-left hover:bg-bilo-gray rounded-lg flex items-center text-bilo-navy transition-colors"
              >
                <span className="mr-3 text-bilo-silver">{search.icon}</span>
                {search.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
