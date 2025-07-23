/**
 * Legal Disclaimer Component Tests
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LegalDisclaimer from '../LegalDisclaimer';

describe('LegalDisclaimer', () => {
  const mockOnAccept = jest.fn();
  const mockOnDecline = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render when visible', () => {
    render(
      <LegalDisclaimer
        isVisible={true}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
      />
    );

    expect(screen.getByText('Legal Disclaimer & Terms of Use')).toBeInTheDocument();
    expect(screen.getByText(/Please read carefully before using Ellie/)).toBeInTheDocument();
  });

  it('should not render when not visible', () => {
    render(
      <LegalDisclaimer
        isVisible={false}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
      />
    );

    expect(screen.queryByText('Legal Disclaimer & Terms of Use')).not.toBeInTheDocument();
  });

  it('should display important notice section', () => {
    render(
      <LegalDisclaimer
        isVisible={true}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
      />
    );

    expect(screen.getByText('Important Notice')).toBeInTheDocument();
    expect(screen.getByText(/Ellie is an AI assistant that provides general information only/)).toBeInTheDocument();
    expect(screen.getByText(/does not create an attorney-client relationship/)).toBeInTheDocument();
  });

  it('should display what Ellie can do section', () => {
    render(
      <LegalDisclaimer
        isVisible={true}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
      />
    );

    expect(screen.getByText('What Ellie Can Do')).toBeInTheDocument();
    expect(screen.getByText(/Provide general information about legal topics/)).toBeInTheDocument();
    expect(screen.getByText(/Help you understand common legal concepts/)).toBeInTheDocument();
    expect(screen.getByText(/Schedule consultations with qualified attorneys/)).toBeInTheDocument();
  });

  it('should display what Ellie cannot do section', () => {
    render(
      <LegalDisclaimer
        isVisible={true}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
      />
    );

    expect(screen.getByText('What Ellie Cannot Do')).toBeInTheDocument();
    expect(screen.getByText(/Provide specific legal advice tailored to your situation/)).toBeInTheDocument();
    expect(screen.getByText(/Represent you in legal proceedings/)).toBeInTheDocument();
    expect(screen.getByText(/Replace consultation with a qualified attorney/)).toBeInTheDocument();
  });

  it('should display privacy and data protection section', () => {
    render(
      <LegalDisclaimer
        isVisible={true}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
      />
    );

    expect(screen.getByText('Privacy & Data Protection')).toBeInTheDocument();
    expect(screen.getByText(/Your conversations are encrypted and processed securely/)).toBeInTheDocument();
    expect(screen.getByText(/Audio data is processed in real-time and not permanently stored/)).toBeInTheDocument();
    expect(screen.getByText(/We comply with applicable privacy laws/)).toBeInTheDocument();
  });

  it('should display professional legal consultation section', () => {
    render(
      <LegalDisclaimer
        isVisible={true}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
      />
    );

    expect(screen.getByText('Professional Legal Consultation')).toBeInTheDocument();
    expect(screen.getByText(/For matters requiring specific legal advice/)).toBeInTheDocument();
    expect(screen.getByText('Need Human Legal Assistance?')).toBeInTheDocument();
    expect(screen.getByText('Free Consultation Available')).toBeInTheDocument();
    expect(screen.getByText('Licensed Attorneys')).toBeInTheDocument();
    expect(screen.getByText('Confidential')).toBeInTheDocument();
  });

  it('should require checkbox to be checked before accepting', () => {
    render(
      <LegalDisclaimer
        isVisible={true}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
      />
    );

    const acceptButton = screen.getByText('Accept & Continue');
    expect(acceptButton).toBeDisabled();

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(acceptButton).toBeEnabled();
  });

  it('should call onAccept when accept button is clicked after checkbox is checked', () => {
    render(
      <LegalDisclaimer
        isVisible={true}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    const acceptButton = screen.getByText('Accept & Continue');
    fireEvent.click(acceptButton);

    expect(mockOnAccept).toHaveBeenCalledTimes(1);
  });

  it('should call onDecline when decline button is clicked', () => {
    render(
      <LegalDisclaimer
        isVisible={true}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
      />
    );

    const declineButton = screen.getByText('Decline');
    fireEvent.click(declineButton);

    expect(mockOnDecline).toHaveBeenCalledTimes(1);
  });

  it('should have proper accessibility attributes', () => {
    render(
      <LegalDisclaimer
        isVisible={true}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('id', 'disclaimer-read');
    
    const label = screen.getByLabelText(/I have read and understand the legal disclaimer/);
    expect(label).toBeInTheDocument();
  });

  it('should display proper button states', () => {
    render(
      <LegalDisclaimer
        isVisible={true}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
      />
    );

    const acceptButton = screen.getByText('Accept & Continue');
    const declineButton = screen.getByText('Decline');

    // Initially accept button should be disabled
    expect(acceptButton).toBeDisabled();
    expect(acceptButton).toHaveClass('cursor-not-allowed');
    
    // Decline button should always be enabled
    expect(declineButton).toBeEnabled();

    // After checking checkbox, accept button should be enabled
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(acceptButton).toBeEnabled();
    expect(acceptButton).not.toHaveClass('cursor-not-allowed');
  });

  it('should handle checkbox state changes correctly', () => {
    render(
      <LegalDisclaimer
        isVisible={true}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
      />
    );

    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    const acceptButton = screen.getByText('Accept & Continue');

    // Initially unchecked
    expect(checkbox.checked).toBe(false);
    expect(acceptButton).toBeDisabled();

    // Check the checkbox
    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);
    expect(acceptButton).toBeEnabled();

    // Uncheck the checkbox
    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(false);
    expect(acceptButton).toBeDisabled();
  });

  it('should display all required legal information sections', () => {
    render(
      <LegalDisclaimer
        isVisible={true}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
      />
    );

    // Check for all major sections
    const sections = [
      'Important Notice',
      'What Ellie Can Do',
      'What Ellie Cannot Do',
      'Privacy & Data Protection',
      'Professional Legal Consultation',
      'Need Human Legal Assistance?'
    ];

    sections.forEach(section => {
      expect(screen.getByText(section)).toBeInTheDocument();
    });
  });

  it('should have scrollable content area', () => {
    render(
      <LegalDisclaimer
        isVisible={true}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
      />
    );

    const contentArea = screen.getByText('Important Notice').closest('.overflow-y-auto');
    expect(contentArea).toBeInTheDocument();
    expect(contentArea).toHaveClass('max-h-[60vh]');
  });
});