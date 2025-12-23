// src/context/ThemeContext.jsx
import React, { useEffect } from 'react';

const ThemeProvider = ({ children }) => {
  useEffect(() => {
    const monthNames = [
      "january", "february", "march", "april", "may", "june",
      "july", "august", "september", "october", "november", "december"
    ];
    
    const currentMonth = monthNames[new Date().getMonth()];
    
    // Easily override manually for testing or special events
    const activeTheme = currentMonth; 
    
    document.documentElement.setAttribute('data-theme', activeTheme);
  }, []);

  return <>{children}</>;
};

export default ThemeProvider;
