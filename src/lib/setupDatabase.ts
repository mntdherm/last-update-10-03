import { db, COLLECTIONS } from './firebase';
import { collection, doc, setDoc } from 'firebase/firestore';

export const setupSampleData = async () => {
  // Create service categories
  const categories = [
    {
      id: 'cat1',
      name: 'Peruspesu',
      description: 'Peruspesut ja pikapesut',
      icon: 'car'
    },
    {
      id: 'cat2',
      name: 'Sisäpesu',
      description: 'Auton sisätilojen puhdistus',
      icon: 'armchair'
    },
    {
      id: 'cat3',
      name: 'Vahaus',
      description: 'Vahaus ja pinnoitus',
      icon: 'spray'
    },
    {
      id: 'cat4',
      name: 'Erikoispalvelut',
      description: 'Erikoiskäsittelyt ja lisäpalvelut',
      icon: 'sparkles'
    }
  ];

  for (const category of categories) {
    await setDoc(doc(db, COLLECTIONS.SERVICE_CATEGORIES, category.id), category);
  }

  // Create a sample user
  await setDoc(doc(db, COLLECTIONS.USERS, 'user1'), {
    email: 'customer@example.com',
    role: 'customer',
    name: 'John Doe',
    phone: '+1234567890',
    createdAt: new Date()
  });

  // Create a sample vendor
  await setDoc(doc(db, COLLECTIONS.VENDORS, 'vendor1'), {
    userId: 'vendor1',
    businessName: 'Premium Car Wash',
    address: '123 Main St',
    phone: '+1987654321',
    description: 'Professional car wash services',
    rating: 4.5,
    services: ['service1', 'service2'],
    operatingHours: {
      monday: { open: '09:00', close: '18:00' },
      tuesday: { open: '09:00', close: '18:00' },
      wednesday: { open: '09:00', close: '18:00' },
      thursday: { open: '09:00', close: '18:00' },
      friday: { open: '09:00', close: '18:00' },
      saturday: { open: '10:00', close: '16:00' },
      sunday: { open: 'closed', close: 'closed' }
    }
  });

  // Create sample services
  await setDoc(doc(db, COLLECTIONS.SERVICES, 'service1'), {
    vendorId: 'vendor1',
    categoryId: 'cat1',
    name: 'Basic Wash',
    description: 'Exterior wash with hand dry',
    price: 25.99,
    duration: 30,
    available: true,
    coinReward: 10
  });

  await setDoc(doc(db, COLLECTIONS.SERVICES, 'service2'), {
    vendorId: 'vendor1',
    categoryId: 'cat3',
    name: 'Premium Detail',
    description: 'Full interior and exterior detailing',
    price: 149.99,
    duration: 180,
    available: true,
    coinReward: 50
  });

  // Create a sample appointment
  await setDoc(doc(db, COLLECTIONS.APPOINTMENTS, 'appointment1'), {
    customerId: 'user1',
    vendorId: 'vendor1',
    serviceId: 'service1',
    date: new Date(),
    status: 'pending',
    totalPrice: 25.99,
    notes: 'First time customer',
    createdAt: new Date(),
    updatedAt: new Date()
  });
};
