import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

// Define the shape of the context data
interface GlobalMissedDaysContextType {
  missedDays: any[];
  setMissedDays: React.Dispatch<React.SetStateAction<any[]>>;
  selectedRepo: any;
  setSelectedRepo: React.Dispatch<React.SetStateAction<any>>;
  isFixingAny: boolean;
  setIsFixingAny: React.Dispatch<React.SetStateAction<boolean>>;
  forceUpdate: () => void;
}

// Create the context with default values
const GlobalMissedDaysContext = createContext<GlobalMissedDaysContextType>({
  missedDays: [],
  setMissedDays: () => {},
  selectedRepo: null,
  setSelectedRepo: () => {},
  isFixingAny: false,
  setIsFixingAny: () => {},
  forceUpdate: () => {}
});

// Provider component to wrap around components that need access to the context
export const GlobalMissedDaysProvider = ({ children }: { children: ReactNode }) => {
  const [missedDays, setMissedDays] = useState<any[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<any>(null);
  const [isFixingAny, setIsFixingAny] = useState<boolean>(false);
  const [updateCounter, setUpdateCounter] = useState(0);
  
  // Helper function to force a context update
  const forceUpdate = () => {
    setUpdateCounter(prev => prev + 1);
  };
  
  // Debug: Log when repo changes
  useEffect(() => {
    if (selectedRepo) {
      console.log('GlobalMissedDaysContext: Repository changed to', selectedRepo.name);
    }
  }, [selectedRepo, updateCounter]);
  
  return (
    <GlobalMissedDaysContext.Provider value={{
      missedDays,
      setMissedDays,
      selectedRepo,
      setSelectedRepo,
      isFixingAny,
      setIsFixingAny,
      forceUpdate
    }}>
      {children}
    </GlobalMissedDaysContext.Provider>
  );
};

// Custom hook to use the context
export const useGlobalMissedDays = () => useContext(GlobalMissedDaysContext); 