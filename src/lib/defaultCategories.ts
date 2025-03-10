import type { ServiceCategory } from '../types/database';

export const DEFAULT_CATEGORIES: Omit<ServiceCategory, 'id'>[] = [
  {
    name: 'Peruspesu',
    description: 'Peruspesut ja pikapesut',
    icon: 'car',
    order: 1
  },
  {
    name: 'Sisäpesu',
    description: 'Auton sisätilojen puhdistus',
    icon: 'armchair',
    order: 2
  },
  {
    name: 'Premium',
    description: 'Premium-tason pesut ja käsittelyt',
    icon: 'star',
    order: 3
  },
  {
    name: 'Erikoispalvelut',
    description: 'Erikoiskäsittelyt ja lisäpalvelut',
    icon: 'sparkles',
    order: 4
  }
];
