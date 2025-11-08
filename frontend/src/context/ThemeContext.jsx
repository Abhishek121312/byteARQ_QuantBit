import React, { createContext, useContext, useEffect, useState } from 'react';

// Create a context for the theme
const ThemeContext = createContext();

// Custom hook to use the theme context easily
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Provider component that wraps the app
export const ThemeProvider = ({ children }) => {
  // State to hold the current theme
  const [theme, setTheme] = useState(() => {
    // Renaming localstorage item for the new app
    return localStorage.getItem('civicresolve-theme') || 'light';
  });

  // Effect to apply the theme to the root HTML element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('civicresolve-theme', theme);
  }, [theme]);

  // Function to toggle between 'light' and 'dark' themes
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const value = { theme, toggleTheme };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};