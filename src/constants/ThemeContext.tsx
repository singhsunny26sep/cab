import React, { createContext, useState, useEffect, useContext } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeContextProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

interface ThemeProviderProps {
  children: React.ReactNode;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean | null>(null); // Initially set to null

  useEffect(() => {
    const loadThemePreference = async () => {
      const savedTheme = await AsyncStorage.getItem('isDarkMode');

      if (savedTheme !== null) {
        setIsDarkMode(JSON.parse(savedTheme)); // Parse and set the saved preference
      } else {
        // If no saved preference, check the system's theme
        const systemTheme = Appearance.getColorScheme();
        setIsDarkMode(systemTheme === 'dark');
      }
    };

    loadThemePreference();
  }, []);

  const toggleDarkMode = async () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    // Save the new preference in AsyncStorage
    await AsyncStorage.setItem('isDarkMode', JSON.stringify(newDarkMode));
  };

  // Return a loading state if the theme preference is still being loaded
  if (isDarkMode === null) {
    return null; // Or a loading spinner if you want
  }

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme in any component
export const useTheme = (): ThemeContextProps => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
