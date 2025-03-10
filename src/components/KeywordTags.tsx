import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Tag, MapPin } from 'lucide-react';

interface KeywordTagsProps {
  className?: string;
}

const KEYWORD_TAGS = [
  // Tampere
  { id: 'hand-wash', label: 'Hand wash', type: 'service' },
  { id: 'full-service', label: 'Full service', type: 'service' },
  { id: 'detailing', label: 'Detailing', type: 'service' },
  { id: 'polishing', label: 'Polishing', type: 'service' },
  { id: 'tampere', label: 'Tampere', type: 'city' },
  { id: 'helsinki', label: 'Helsinki', type: 'city' },
  { id: 'turku', label: 'Turku', type: 'city' },
  { id: 'vannepesu-tampere', label: 'Vannepesu Tampere', city: 'tampere' },
  { id: 'tuulilasin-pinnoitus-tampere', label: 'Tuulilasin pinnoitus Tampere', city: 'tampere' },
  { id: 'lasien-tummennus-tampere', label: 'Lasien tummennus Tampere', city: 'tampere' },
  { id: 'kattokaiteiden-puhdistus-tampere', label: 'Kattokaiteiden puhdistus Tampere', city: 'tampere' },
  { id: 'peilien-puhdistus-tampere', label: 'Peilien puhdistus Tampere', city: 'tampere' },
  { id: 'renkaiden-kiillotus-tampere', label: 'Renkaiden kiillotus Tampere', city: 'tampere' },
  { id: 'kromiosien-kiillotus-tampere', label: 'Kromiosien kiillotus Tampere', city: 'tampere' },
  { id: 'matkailuauton-pesu-tampere', label: 'Matkailuauton pesu Tampere', city: 'tampere' },
  { id: 'pienpoisto-tampere', label: 'Pienpoisto Tampere', city: 'tampere' },
  { id: 'hyonteisten-poisto-tampere', label: 'Hyönteisten poisto Tampere', city: 'tampere' },
  { id: 'ajovalojen-kirkastus-tampere', label: 'Ajovalojen kirkastus Tampere', city: 'tampere' },
  { id: 'sisatilojen-polyjen-pyyhinta-tampere', label: 'Sisätilojen pölyjen pyyhintä Tampere', city: 'tampere' },
  { id: 'vuoristopesu-tampere', label: 'Vuoristopesu Tampere', city: 'tampere' },
  { id: 'lasien-huurteenpoisto-tampere', label: 'Lasien huurteenpoisto Tampere', city: 'tampere' },

  // Helsinki
  { id: 'sisapesu-helsinki', label: 'Sisäpesu Helsinki', city: 'helsinki' },
  { id: 'koneellinen-vahaus-helsinki', label: 'Koneellinen vahaus Helsinki', city: 'helsinki' },
  { id: 'keraaminen-pinnoite-helsinki', label: 'Keraaminen pinnoite Helsinki', city: 'helsinki' },
  { id: 'rengaskasittely-helsinki', label: 'Rengaskäsittely Helsinki', city: 'helsinki' },
  { id: 'mattojen-pesu-helsinki', label: 'Mattojen pesu Helsinki', city: 'helsinki' },
  { id: 'imurointi-helsinki', label: 'Imurointi Helsinki', city: 'helsinki' },
  { id: 'kiveniskemien-korjaus-helsinki', label: 'Kiveniskemien korjaus Helsinki', city: 'helsinki' },
  { id: 'naarmujen-poisto-helsinki', label: 'Naarmujen poisto Helsinki', city: 'helsinki' },
  { id: 'auton-sisatilojen-desinfiointi-helsinki', label: 'Auton sisätilojen desinfiointi Helsinki', city: 'helsinki' },
  { id: 'sisatilojen-syvapuhdistus-helsinki', label: 'Sisätilojen syväpuhdistus Helsinki', city: 'helsinki' },
  { id: 'lokasuojien-puhdistus-helsinki', label: 'Lokasuojien puhdistus Helsinki', city: 'helsinki' },
  { id: 'auton-hajun-neutralointi-helsinki', label: 'Auton hajun neutralointi Helsinki', city: 'helsinki' },
  { id: 'muoviosien-hoito-helsinki', label: 'Muoviosien hoito Helsinki', city: 'helsinki' },
  { id: 'sahkoauton-erikoispesu-helsinki', label: 'Sähköauton erikoispesu Helsinki', city: 'helsinki' },
  { id: 'caravanin-pesu-helsinki', label: 'Caravanin pesu Helsinki', city: 'helsinki' },
  { id: 'teippauksen-puhdistus-helsinki', label: 'Teippauksen puhdistus Helsinki', city: 'helsinki' },
  { id: 'sisavalojen-puhdistus-helsinki', label: 'Sisävalojen puhdistus Helsinki', city: 'helsinki' },
  { id: 'tuulilasin-suojakalvon-asennus-helsinki', label: 'Tuulilasin suojakalvon asennus Helsinki', city: 'helsinki' },
  { id: 'talvipesu-helsinki', label: 'Talvipesu Helsinki', city: 'helsinki' },

  // Turku
  { id: 'kasinpesu-turku', label: 'Käsinpesu Turku', city: 'turku' },
  { id: 'kiillotus-turku', label: 'Kiillotus Turku', city: 'turku' },
  { id: 'moottoritilan-pesu-turku', label: 'Moottoritilan pesu Turku', city: 'turku' },
  { id: 'nahkapenkkien-pesu-turku', label: 'Nahkapenkkien pesu Turku', city: 'turku' },
  { id: 'hajunpoisto-turku', label: 'Hajunpoisto Turku', city: 'turku' },
  { id: 'ikkunoiden-puhdistus-turku', label: 'Ikkunoiden puhdistus Turku', city: 'turku' },
  { id: 'maalipinnan-korjaus-turku', label: 'Maalipinnan korjaus Turku', city: 'turku' },
  { id: 'rengaspesu-turku', label: 'Rengaspesu Turku', city: 'turku' },
  { id: 'takakontin-puhdistus-turku', label: 'Takakontin puhdistus Turku', city: 'turku' },
  { id: 'peltipintojen-kiillotus-turku', label: 'Peltipintojen kiillotus Turku', city: 'turku' },
  { id: 'ilmanraikastin-asennus-turku', label: 'Ilmanraikastin asennus Turku', city: 'turku' },
  { id: 'auton-kokonaisvaltainen-puhdistus-turku', label: 'Auton kokonaisvaltainen puhdistus Turku', city: 'turku' },
  { id: 'sisatilojen-desinfiointi-hoyrulla-turku', label: 'Sisätilojen desinfiointi höyryllä Turku', city: 'turku' },
  { id: 'veneen-pesu-ja-kiillotus-turku', label: 'Veneen pesu ja kiillotus Turku', city: 'turku' },
  { id: 'purkkimaalin-poisto-turku', label: 'Purkkimaalin poisto Turku', city: 'turku' },
  { id: 'kylkilistojen-hoito-turku', label: 'Kylkilistojen hoito Turku', city: 'turku' },
  { id: 'kasin-kuivatus-turku', label: 'Käsin kuivatus Turku', city: 'turku' },
  { id: 'tekstiilien-suoja-ainekasittely-turku', label: 'Tekstiilien suoja-ainekäsittely Turku', city: 'turku' },
  { id: 'jalkivahaus-turku', label: 'Jälkivahaus Turku', city: 'turku' }
];

const KeywordTags: React.FC<KeywordTagsProps> = ({ className = '' }) => {
  const navigate = useNavigate();

  const handleTagClick = (tag: string) => {
    const [service, city] = tag.split(' ');
    navigate(`/search?q=${encodeURIComponent(service)}&city=${encodeURIComponent(city)}`);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center space-x-2 text-gray-600">
        <Tag className="w-5 h-5" />
        <h2 className="text-lg font-medium">Suositut palvelut kaupungeittain</h2>
      </div>
      
      {/* Service Tags */}
      <div className="flex flex-wrap gap-2 max-h-[400px] overflow-y-auto scrollbar-hide">
        {KEYWORD_TAGS.map((tag) => (
          <button
            key={tag.id}
            onClick={() => handleTagClick(tag.label)}
            className={`
              px-4 py-2 rounded-full text-sm font-medium transition-all
              hover:scale-105 active:scale-95
              ${tag.city === 'tampere'
                ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/50'
                : tag.city === 'helsinki'
                ? 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200/50'
                : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200/50'
              }
            `}
          >
            {tag.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default KeywordTags;
