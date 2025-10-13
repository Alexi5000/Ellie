import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Hero } from '../Hero';

// Mock AnimatedOrb component
vi.mock('../AnimatedOrb', () => ({
  AnimatedOrb: () => <div data-testid="animated-orb">AnimatedOrb</div>,
}));

describe('Hero', () => {
  it('renders the hero section with headline', () => {
    render(<Hero />);

    expect(screen.getByText('Voice AI assistant for developers')).toBeInTheDocument();
  });

  it('renders the value proposition text', () => {
    render(<Hero />);

    expect(
      screen.getByText(/Build and deploy voice AI agents in minutes/i)
    ).toBeInTheDocument();
  });

  it('renders all CTA buttons', () => {
    render(<Hero />);

    expect(screen.getByText('Sign up')).toBeInTheDocument();
    expect(screen.getByText('Read the docs')).toBeInTheDocument();
    expect(screen.getByText('Talk to Ellie')).toBeInTheDocument();
  });

  it('renders the AnimatedOrb component', () => {
    render(<Hero />);

    expect(screen.getByTestId('animated-orb')).toBeInTheDocument();
  });

  it('calls onTalkToEllie when Talk to Ellie button is clicked', () => {
    const handleTalkToEllie = vi.fn();
    render(<Hero onTalkToEllie={handleTalkToEllie} />);

    const talkButton = screen.getByText('Talk to Ellie');
    talkButton.click();

    expect(handleTalkToEllie).toHaveBeenCalledTimes(1);
  });

  it('has proper section structure with ID', () => {
    const { container } = render(<Hero />);

    const section = container.querySelector('section#hero');
    expect(section).toBeInTheDocument();
  });

  it('has responsive layout classes', () => {
    const { container } = render(<Hero />);

    const grid = container.querySelector('.grid');
    expect(grid?.className).toContain('lg:grid-cols-2');
  });

  it('has accessible button attributes', () => {
    render(<Hero />);

    const signUpButton = screen.getByText('Sign up');
    expect(signUpButton).toHaveClass('focus:outline-none');
    expect(signUpButton).toHaveClass('focus:ring-2');
  });
});
