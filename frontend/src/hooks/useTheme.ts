import { useContext } from 'react';
import { ThemeContext, ThemeContextValue } from '../contexts/ThemeContext';

/**
 * Hook to access theme state and controls
 * 
 * @throws {Error} If used outside of ThemeProvider
 * @returns {ThemeContextValue} Theme context value with theme state and controls
 * 
 * @example
 * ```tsx
 * const { theme, toggleTheme, systemTheme } = useTheme();
 * 
 * return (
 *   <button onClick={toggleTheme}>
 *     Current theme: {theme}
 *   </button>
 * );
 * ```
 */
export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
};
