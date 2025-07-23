/**
 * Professional Referral Component Tests
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProfessionalReferral from '../ProfessionalReferral';

describe('ProfessionalReferral', () => {
  const mockOnClose = jest.fn();
  const mockOnScheduleConsultation = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render when visible', () => {
    render(
      <ProfessionalReferral
        isVisible={true}
        onClose={mockOnClose}
        onScheduleConsultation={mockOnScheduleConsultation}
      />
    );

    expect(screen.getByText('Connect with a Legal Professional')).toBeInTheDocument();
    expect(screen.getByText(/Schedule a consultation with our qualified attorneys/)).toBeInTheDocument();
  });

  it('should not render when not visible', () => {
    render(
      <ProfessionalReferral
        isVisible={false}
        onClose={mockOnClose}
        onScheduleConsultation={mockOnScheduleConsultation}
      />
    );

    expect(screen.queryByText('Connect with a Legal Professional')).not.toBeInTheDocument();
  });

  it('should display referral reason when provided', () => {
    const reason = 'This appears to be a complex legal matter requiring professional analysis.';
    
    render(
      <ProfessionalReferral
        isVisible={true}
        onClose={mockOnClose}
        onScheduleConsultation={mockOnScheduleConsultation}
        reason={reason}
      />
    );

    expect(screen.getByText('Why We\'re Recommending Professional Help')).toBeInTheDocument();
    expect(screen.getByText(reason)).toBeInTheDocument();
  });

  it('should display what to expect section', () => {
    render(
      <ProfessionalReferral
        isVisible={true}
        onClose={mockOnClose}
        onScheduleConsultation={mockOnScheduleConsultation}
      />
    );

    expect(screen.getByText('What to Expect')).toBeInTheDocument();
    expect(screen.getByText('Free Initial Consultation')).toBeInTheDocument();
    expect(screen.getByText('30-minute consultation at no charge')).toBeInTheDocument();
    expect(screen.getByText('Confidential Discussion')).toBeInTheDocument();
    expect(screen.getByText('Attorney-client privilege applies')).toBeInTheDocument();
    expect(screen.getByText('Licensed Attorneys')).toBeInTheDocument();
    expect(screen.getByText('Quick Response')).toBeInTheDocument();
    expect(screen.getByText('Contact within 24 hours')).toBeInTheDocument();
  });

  it('should render all form fields', () => {
    render(
      <ProfessionalReferral
        isVisible={true}
        onClose={mockOnClose}
        onScheduleConsultation={mockOnScheduleConsultation}
      />
    );

    expect(screen.getByLabelText(/Full Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Phone Number/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Preferred Contact Method/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Urgency Level/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Brief Description of Your Legal Matter/)).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    render(
      <ProfessionalReferral
        isVisible={true}
        onClose={mockOnClose}
        onScheduleConsultation={mockOnScheduleConsultation}
      />
    );

    const scheduleButton = screen.getByText('Schedule Consultation');
    fireEvent.click(scheduleButton);

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Phone number is required')).toBeInTheDocument();
      expect(screen.getByText('Please describe your legal matter')).toBeInTheDocument();
    });

    expect(mockOnScheduleConsultation).not.toHaveBeenCalled();
  });

  it('should validate email format', async () => {
    render(
      <ProfessionalReferral
        isVisible={true}
        onClose={mockOnClose}
        onScheduleConsultation={mockOnScheduleConsultation}
      />
    );

    const emailInput = screen.getByLabelText(/Email Address/);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

    const scheduleButton = screen.getByText('Schedule Consultation');
    fireEvent.click(scheduleButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('should validate phone number format', async () => {
    render(
      <ProfessionalReferral
        isVisible={true}
        onClose={mockOnClose}
        onScheduleConsultation={mockOnScheduleConsultation}
      />
    );

    const phoneInput = screen.getByLabelText(/Phone Number/);
    fireEvent.change(phoneInput, { target: { value: 'invalid-phone' } });

    const scheduleButton = screen.getByText('Schedule Consultation');
    fireEvent.click(scheduleButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid phone number')).toBeInTheDocument();
    });
  });

  it('should submit form with valid data', async () => {
    mockOnScheduleConsultation.mockResolvedValue(undefined);

    render(
      <ProfessionalReferral
        isVisible={true}
        onClose={mockOnClose}
        onScheduleConsultation={mockOnScheduleConsultation}
      />
    );

    // Fill out the form
    fireEvent.change(screen.getByLabelText(/Full Name/), { 
      target: { value: 'John Doe' } 
    });
    fireEvent.change(screen.getByLabelText(/Email Address/), { 
      target: { value: 'john.doe@example.com' } 
    });
    fireEvent.change(screen.getByLabelText(/Phone Number/), { 
      target: { value: '+1-555-123-4567' } 
    });
    fireEvent.change(screen.getByLabelText(/Brief Description/), { 
      target: { value: 'I need help with a contract dispute.' } 
    });

    const scheduleButton = screen.getByText('Schedule Consultation');
    fireEvent.click(scheduleButton);

    await waitFor(() => {
      expect(mockOnScheduleConsultation).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1-555-123-4567',
        preferredContact: 'email',
        urgency: 'medium',
        description: 'I need help with a contract dispute.'
      });
    });
  });

  it('should handle form submission errors', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockOnScheduleConsultation.mockRejectedValue(new Error('Network error'));

    render(
      <ProfessionalReferral
        isVisible={true}
        onClose={mockOnClose}
        onScheduleConsultation={mockOnScheduleConsultation}
      />
    );

    // Fill out the form
    fireEvent.change(screen.getByLabelText(/Full Name/), { 
      target: { value: 'John Doe' } 
    });
    fireEvent.change(screen.getByLabelText(/Email Address/), { 
      target: { value: 'john.doe@example.com' } 
    });
    fireEvent.change(screen.getByLabelText(/Phone Number/), { 
      target: { value: '+1-555-123-4567' } 
    });
    fireEvent.change(screen.getByLabelText(/Brief Description/), { 
      target: { value: 'I need help with a contract dispute.' } 
    });

    const scheduleButton = screen.getByText('Schedule Consultation');
    fireEvent.click(scheduleButton);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to schedule consultation:', expect.any(Error));
    });

    consoleErrorSpy.mockRestore();
  });

  it('should call onClose when close button is clicked', () => {
    render(
      <ProfessionalReferral
        isVisible={true}
        onClose={mockOnClose}
        onScheduleConsultation={mockOnScheduleConsultation}
      />
    );

    const closeButton = screen.getByLabelText('Close referral form');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when cancel button is clicked', () => {
    render(
      <ProfessionalReferral
        isVisible={true}
        onClose={mockOnClose}
        onScheduleConsultation={mockOnScheduleConsultation}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should show loading state during submission', async () => {
    let resolvePromise: () => void;
    const promise = new Promise<void>((resolve) => {
      resolvePromise = resolve;
    });
    mockOnScheduleConsultation.mockReturnValue(promise);

    render(
      <ProfessionalReferral
        isVisible={true}
        onClose={mockOnClose}
        onScheduleConsultation={mockOnScheduleConsultation}
      />
    );

    // Fill out the form
    fireEvent.change(screen.getByLabelText(/Full Name/), { 
      target: { value: 'John Doe' } 
    });
    fireEvent.change(screen.getByLabelText(/Email Address/), { 
      target: { value: 'john.doe@example.com' } 
    });
    fireEvent.change(screen.getByLabelText(/Phone Number/), { 
      target: { value: '+1-555-123-4567' } 
    });
    fireEvent.change(screen.getByLabelText(/Brief Description/), { 
      target: { value: 'I need help with a contract dispute.' } 
    });

    const scheduleButton = screen.getByText('Schedule Consultation');
    fireEvent.click(scheduleButton);

    // Should show loading state
    expect(screen.getByText('Scheduling...')).toBeInTheDocument();
    expect(scheduleButton).toBeDisabled();

    // Resolve the promise
    resolvePromise!();
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('should handle different urgency levels', () => {
    render(
      <ProfessionalReferral
        isVisible={true}
        onClose={mockOnClose}
        onScheduleConsultation={mockOnScheduleConsultation}
      />
    );

    const urgencySelect = screen.getByLabelText(/Urgency Level/);
    
    expect(screen.getByText('Low - General inquiry (1-2 weeks)')).toBeInTheDocument();
    expect(screen.getByText('Medium - Important matter (2-3 days)')).toBeInTheDocument();
    expect(screen.getByText('High - Urgent matter (within 24 hours)')).toBeInTheDocument();

    fireEvent.change(urgencySelect, { target: { value: 'high' } });
    expect((urgencySelect as HTMLSelectElement).value).toBe('high');
  });

  it('should handle preferred contact method selection', () => {
    render(
      <ProfessionalReferral
        isVisible={true}
        onClose={mockOnClose}
        onScheduleConsultation={mockOnScheduleConsultation}
      />
    );

    const contactSelect = screen.getByLabelText(/Preferred Contact Method/);
    
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Phone')).toBeInTheDocument();

    fireEvent.change(contactSelect, { target: { value: 'phone' } });
    expect((contactSelect as HTMLSelectElement).value).toBe('phone');
  });

  it('should clear validation errors when user starts typing', async () => {
    render(
      <ProfessionalReferral
        isVisible={true}
        onClose={mockOnClose}
        onScheduleConsultation={mockOnScheduleConsultation}
      />
    );

    // Trigger validation errors
    const scheduleButton = screen.getByText('Schedule Consultation');
    fireEvent.click(scheduleButton);

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });

    // Start typing in name field
    const nameInput = screen.getByLabelText(/Full Name/);
    fireEvent.change(nameInput, { target: { value: 'J' } });

    // Error should be cleared
    expect(screen.queryByText('Name is required')).not.toBeInTheDocument();
  });
});