import { createContext, useContext, useState } from 'react';

interface SettingsContextType {
  alarmDistance: number;
  setAlarmDistance: (distance: number) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [alarmDistance, setAlarmDistance] = useState(1); // Default 1m

  return (
    <SettingsContext.Provider value={{ alarmDistance, setAlarmDistance }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
} 