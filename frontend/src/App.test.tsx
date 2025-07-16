import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getAllByText('Ellie Voice Receptionist')[0]).toBeInTheDocument();
  });

  it('displays the landing page', () => {
    render(<App />);
    expect(screen.getByText(/Experience the future of legal assistance/)).toBeInTheDocument();
  });
});