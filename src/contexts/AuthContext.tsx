import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification
} from 'firebase/auth';
import { auth, getActionCodeSettings } from '../lib/firebase';
import { createUser } from '../lib/db';

interface AuthContextType {
  currentUser: User | null;
  emailVerified: boolean;
  signup: (email: string, password: string, isVendor?: boolean) => Promise<any>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);

  const signup = async (email: string, password: string, isVendor: boolean = false) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Send verification email
      await sendEmailVerification(userCredential.user, getActionCodeSettings('emailVerification'));
      
      // Create user profile in Firestore
      await createUser(userCredential.user.uid, {
        email: email,
        role: isVendor ? 'vendor' : 'customer', // Set role based on isVendor parameter
        createdAt: new Date(),
        emailVerified: false
      });
      return userCredential;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const login = (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth);
  };

  const resendVerificationEmail = async () => {
    if (!currentUser) {
      throw new Error('No user logged in');
    }
    await sendEmailVerification(currentUser, getActionCodeSettings('emailVerification'));
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setEmailVerified(user?.emailVerified || false);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    emailVerified,
    signup,
    login,
    logout,
    resendVerificationEmail,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
