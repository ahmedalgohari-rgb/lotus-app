import React, { FC, ReactNode, createContext, useContext } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Colors, Theme } from '@/constants';

interface ThemeContextType {
  colors: typeof Colors;
  theme: typeof Theme;
}

const ThemeContext = createContext<ThemeContextType>({
  colors: Colors,
  theme: Theme,
});

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: FC<ThemeProviderProps> = ({ children }) => {
  const contextValue: ThemeContextType = {
    colors: Colors,
    theme: Theme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <StatusBar style="auto" backgroundColor={Colors.lotusGreen} />
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeProvider;