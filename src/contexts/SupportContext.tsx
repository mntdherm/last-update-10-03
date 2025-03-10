import React, { createContext, useContext, useState } from 'react';

interface SupportContextType {
  showSupportDialog: boolean;
  setShowSupportDialog: (show: boolean, subject?: string) => void;
  defaultSubject: string | null;
}

const SupportContext = createContext<SupportContextType | null>(null);

export const useSupportDialog = () => {
  const context = useContext(SupportContext);
  if (!context) {
    throw new Error('useSupportDialog must be used within a SupportProvider');
  }
  return context;
};

export const SupportProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showSupportDialog, setShowSupportDialog] = useState(false);
  const [defaultSubject, setDefaultSubject] = useState<string | null>(null);

  const handleShowDialog = (show: boolean, subject?: string) => {
    setShowSupportDialog(show);
    setDefaultSubject(subject || null);
  };

  return (
    <SupportContext.Provider value={{ 
      showSupportDialog, 
      setShowSupportDialog: handleShowDialog,
      defaultSubject 
    }}>
      {children}
    </SupportContext.Provider>
  );
};
