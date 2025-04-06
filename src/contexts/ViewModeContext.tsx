"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type ViewModeContextType = {
  isAdminMode: boolean;
  toggleAdminMode: () => void;
  userRole: string | null;
  setUserRole: (role: string | null) => void;
};

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

export const useViewMode = () => {
  const context = useContext(ViewModeContext);
  if (context === undefined) {
    throw new Error('useViewMode must be used within a ViewModeProvider');
  }
  return context;
};

type ViewModeProviderProps = {
  children: ReactNode;
};

export const ViewModeProvider = ({ children }: ViewModeProviderProps) => {
  const [isAdminMode, setIsAdminMode] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Load the admin mode from session storage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedMode = sessionStorage.getItem('adminViewMode');
      if (storedMode) {
        setIsAdminMode(storedMode === 'admin');
      }
    }
  }, []);

  // Update session storage when admin mode changes
  useEffect(() => {
    if (userRole === 'admin' || userRole === 'super admin') {
      sessionStorage.setItem('adminViewMode', isAdminMode ? 'admin' : 'user');
    }
  }, [isAdminMode, userRole]);

  const toggleAdminMode = () => {
    setIsAdminMode(prev => !prev);
  };

  return (
    <ViewModeContext.Provider 
      value={{ 
        isAdminMode, 
        toggleAdminMode,
        userRole,
        setUserRole
      }}
    >
      {children}
    </ViewModeContext.Provider>
  );
};