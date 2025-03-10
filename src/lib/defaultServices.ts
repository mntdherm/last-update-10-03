import type { Service } from '../types/database';

export const DEFAULT_SERVICES: Omit<Service, 'id' | 'vendorId'>[] = [];
