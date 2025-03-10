import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { createVendor } from './db';
import type { User } from '../types/database';

export const recreateVendorCollection = async () => {
  try {
    // Get all users with vendor role
    const usersRef = collection(db, 'users');
    const vendorQuery = query(usersRef, where('role', '==', 'vendor'));
    const vendorSnapshot = await getDocs(vendorQuery);
    
    // Create vendor documents for each vendor user
    const vendorPromises = vendorSnapshot.docs.map(async (doc) => {
      const userData = doc.data() as User;
      
      // Create vendor with default values
      await createVendor({
        userId: doc.id,
        businessName: '',
        address: '',
        city: '',
        postalCode: '',
        phone: '',
        email: userData.email || '',
        services: [],
        rating: 0,
        ratingCount: 0,
        operatingHours: {
          monday: { open: '09:00', close: '17:00' },
          tuesday: { open: '09:00', close: '17:00' },
          wednesday: { open: '09:00', close: '17:00' },
          thursday: { open: '09:00', close: '17:00' },
          friday: { open: '09:00', close: '17:00' },
          saturday: { open: 'closed', close: 'closed' },
          sunday: { open: 'closed', close: 'closed' }
        }
      });
    });

    await Promise.all(vendorPromises);
    console.log('Vendor collection recreated successfully');
    return true;
  } catch (error) {
    console.error('Error recreating vendor collection:', error);
    throw error;
  }
};
