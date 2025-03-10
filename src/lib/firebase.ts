import { initializeApp } from 'firebase/app';
import { getAuth, sendEmailVerification, sendPasswordResetEmail as firebaseSendPasswordResetEmail } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBcAsupGNfgh1JUg2VPJ31DUVK8KNDOVjo",
  authDomain: "bilo.fi",
  projectId: "b2c-car-4c084",
  storageBucket: "b2c-car-4c084.firebasestorage.app",
  messagingSenderId: "702189199418",
  appId: "1:702189199418:web:3d3773bf1d033b602cd503"
};

// Set auth domain based on environment
firebaseConfig.authDomain = window.location.hostname === 'bilo.fi' 
  ? 'bilo.fi' 
  : 'b2c-car-4c084.firebaseapp.com';

// Initialize Firebase with custom domain
const app = initializeApp(firebaseConfig);

// Initialize Auth, Firestore and Storage
export const auth = getAuth(app);
export const db = getFirestore(app);

// Configure email verification template
auth.languageCode = 'fi'; // Set language to Finnish

// Get base URL for redirects
const getBaseUrl = () => {
  if (window.location.hostname === 'bilo.fi') {
    return 'https://bilo.fi/email-verified';
  }
  return `${window.location.origin}/email-verified`; // For local development
};

// Configure action code settings for email verification
export const getActionCodeSettings = (action: 'emailVerification' | 'passwordReset') => {
  const baseUrl = getBaseUrl();
  const settings = {
    url: baseUrl,
    handleCodeInApp: true
  };
  return settings;
};

// Initialize Storage
export const storage = getStorage(app);

// Export password reset function
export const sendPasswordResetEmail = async (auth: any, email: string, actionCodeSettings?: any) => {
  return firebaseSendPasswordResetEmail(auth, email, {
    url: window.location.hostname === 'bilo.fi'
      ? 'https://bilo.fi/auth/action'
      : 'http://localhost:5173/auth/action'
  });
};

// Collection references
export const COLLECTIONS = {
  USERS: 'users',
  SERVICES: 'services',
  SERVICE_CATEGORIES: 'service_categories',
  APPOINTMENTS: 'appointments',
  VENDORS: 'vendors',
  FEEDBACK: 'feedback',
  OFFERS: 'offers',
  SUPPORT_TICKETS: 'support_tickets'
} as const;
