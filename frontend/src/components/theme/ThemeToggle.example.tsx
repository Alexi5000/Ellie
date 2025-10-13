/**
 * Example usage of ThemeToggle component
 * 
 * This file demonstrates different ways to use the ThemeToggle component.
 * Copy these examples into your components as needed.
 */

import React from 'react';
import { ThemeToggle } from './ThemeToggle';

// Example 1: Basic usage
export const BasicExample = () => {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Basic Theme Toggle</h2>
      <ThemeToggle />
    </div>
  );
};

// Example 2: With label
export const WithLabelExample = () => {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Theme Toggle with Label</h2>
      <ThemeToggle showLabel />
    </div>
  );
};

// Example 3: Custom styling
export const CustomStyledExample = () => {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Custom Styled Theme Toggle</h2>
      <ThemeToggle className="shadow-lg hover:shadow-xl" />
    </div>
  );
};

// Example 4: In a header/navigation
export const HeaderExample = () => {
  return (
    <header className="flex items-center justify-between p-4 bg-background-secondary border-b border-border-primary">
      <div className="text-xl font-bold text-text-primary">Ellie</div>
      <nav className="flex items-center gap-4">
        <a href="#" className="text-text-secondary hover:text-text-primary">Home</a>
        <a href="#" className="text-text-secondary hover:text-text-primary">About</a>
        <a href="#" className="text-text-secondary hover:text-text-primary">Contact</a>
        <ThemeToggle />
      </nav>
    </header>
  );
};

// Example 5: In a settings panel
export const SettingsPanelExample = () => {
  return (
    <div className="p-6 bg-background-secondary rounded-lg">
      <h2 className="text-xl font-bold mb-4 text-text-primary">Settings</h2>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-text-primary">Theme</h3>
            <p className="text-sm text-text-secondary">Choose your preferred color scheme</p>
          </div>
          <ThemeToggle showLabel />
        </div>
      </div>
    </div>
  );
};

// Example 6: Responsive layout
export const ResponsiveExample = () => {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Responsive Theme Toggle</h2>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <span className="text-text-primary">Appearance:</span>
        <ThemeToggle showLabel className="w-full sm:w-auto" />
      </div>
    </div>
  );
};
