import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByText('Ellie Voice Receptionist')).toBeInTheDocument();
  });

  it('displays the landing page', () => {
    render(<App />);
    expect(screen.getByText('AI-powered legal assistant - Coming soon')).toBeInTheDocument();
  });
});