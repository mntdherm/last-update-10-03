export interface User {
  id: string;
  email: string;
  role: 'customer' | 'vendor' | 'admin';
  emailVerified: boolean;
  firstName?: string;
  lastName?: string;
  phone?: string;
  licensePlate?: string;
  createdAt: Date;
  banned?: boolean;
  referralCode: string;
  referralCount: number;
  usedReferralCode?: string;
  wallet: {
    coins: number;
    transactions: Transaction[];
  };
}

export interface Transaction {
  id: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  timestamp: Date;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  bonusCoins: number;
  minimumPurchase?: number;
  services?: string[];
  createdAt: Date;
}

export interface Vendor {
  id: string;
  userId: string;
  businessName: string;
  description?: string;
  address: string;
  businessId: string; // Y-tunnus
  city: string;
  postalCode: string;
  phone: string;
  email?: string;
  website?: string;
  logoImage?: string;
  coverImage?: string;
  rating?: number;
  ratingCount?: number;
  services: string[];
  banned?: boolean;
  verified?: boolean;
  operatingHours: {
    monday: {
      open: string;
      close: string;
    };
    tuesday: {
      open: string;
      close: string;
    };
    wednesday: {
      open: string;
      close: string;
    };
    thursday: {
      open: string;
      close: string;
    };
    friday: {
      open: string;
      close: string;
    };
    saturday: {
      open: string;
      close: string;
    };
    sunday: {
      open: string;
      close: string;
    };
  };
  location?: {
    lat: number;
    lng: number;
  };
}

export interface Service {
  id: string;
  vendorId: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  available: boolean;
  coinReward: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Appointment {
  id: string;
  customerId: string;
  vendorId: string;
  serviceId: string;
  date: Date;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show' | 'cancelled_by_customer' | 'completed';
  totalPrice: number;
  coinsUsed: number;
  coinsUsed?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  customerDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    licensePlate: string;
  };
  feedback?: {
    rating: number;
    comment: string;
    createdAt: Date;
  };
}

export interface Offer {
  id: string;
  vendorId: string;
  serviceId: string;
  title: string;
  description: string;
  discountPercentage: number;
  startDate: Date;
  endDate: Date;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userRole: 'customer' | 'vendor';
  subject: string;
  message: string;
  status: 'open' | 'closed';
  createdAt: Date;
  updatedAt: Date;
  responses?: {
    id: string;
    userId: string;
    userRole: 'customer' | 'vendor' | 'admin';
    message: string;
    createdAt: any;
  }[];
}
export interface ServiceCategory {
  id: string;
  vendorId: string;
  name: string;
  description: string;
  icon: string;
  order: number;
  createdAt?: Date;
}
