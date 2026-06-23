'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'dark' | 'light';
type Brand = 'standard' | 'validic';

interface ThemeContextType {
  theme: Theme;
  brand: Brand;
  toggleTheme: () => void;
  toggleBrand: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [brand, setBrand] = useState<Brand>('standard');

  useEffect(() => {
    // Check for saved preferences
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    const savedBrand = localStorage.getItem('brand') as Brand | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
    if (savedBrand) {
      setBrand(savedBrand);
    }
  }, []);

  useEffect(() => {
    // Apply theme and brand attributes to document
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-brand', brand);
    localStorage.setItem('theme', theme);
    localStorage.setItem('brand', brand);
  }, [theme, brand]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const toggleBrand = () => {
    setBrand(prev => prev === 'standard' ? 'validic' : 'standard');
  };

  return (
    <ThemeContext.Provider value={{ theme, brand, toggleTheme, toggleBrand }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
