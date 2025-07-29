import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import PWAInstallPrompt from './PWAInstallPrompt';
import * as usePWAHook from '../hooks/usePWA';

// Mock the usePWA hook
vi.mock('../hooks/usePWA');

describe('PWAInstallPrompt', () => {
  const mockPWAActions = {
    installApp: vi.fn(),
    requestNotifications: vi.fn(),
    showLocalNotification: vi.fn(),
    subscribeToPush: vi.fn(),
    checkUpdates: vi.fn(),
    applyAppUpdate: vi.fn(),
    refreshStorageUsage: vi.fn()
  };

  const mockPWAState = {
    capabilities: {
      isInstallable: false,
      isInstalled: false,
      supportsNotifications: true,
      supportsBackgroundSync: true,
      supportsPushNotifications: true,
      isStandalone: false,
      hasServiceWorker: true
    },
    isOnline: true,
    installPromptAvailable: true,
    notificationPermission: 'default' as NotificationPermission,
    hasUpdate: false,
    storageUsage: {
      used: 0,
      quota: 0,
      percentage: 0
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(usePWAHook.usePWA).mockReturnValue([mockPWAState, mockPWAActions]);
  });

  it('renders install prompt when installable and not installed', () => {
    vi.mocked(usePWAHook.usePWA).mockReturnValue([
      { 
        ...mockPWAState, 
        capabilities: { 
          ...mockPWAState.capabilities, 
          isInstallable: true, 
          isInstalled: false 
        },
        installPromptAvailable: true
      },
      mockPWAActions
    ]);

    render(<PWAInstallPrompt />);

    expect(screen.getByText('Install Ellie Voice Assistant')).toBeInTheDocument();
    expect(screen.getByText('Add Ellie to your home screen for quick access and a better experience.')).toBeInTheDocument();
    expect(screen.getByText('Works offline')).toBeInTheDocument();
    expect(screen.getByText('Faster loading')).toBeInTheDocument();
    expect(screen.getByText('Native app feel')).toBeInTheDocument();
    
    const installButton = screen.getByRole('button', { name: 'Install' });
    expect(installButton).toBeInTheDocument();
    expect(installButton).not.toBeDisabled();
    
    expect(screen.getByRole('button', { name: 'Not now' })).toBeInTheDocument();
  });

  it('does not render when app is already installed', () => {
    vi.mocked(usePWAHook.usePWA).mockReturnValue([
      { ...mockPWAState, capabilities: { ...mockPWAState.capabilities, isInstalled: true } },
      mockPWAActions
    ]);

    const { container } = render(<PWAInstallPrompt />);
    expect(container.firstChild).toBeNull();
  });

  it('does not render when install prompt is not available', () => {
    vi.mocked(usePWAHook.usePWA).mockReturnValue([
      { ...mockPWAState, installPromptAvailable: false },
      mockPWAActions
    ]);

    const { container } = render(<PWAInstallPrompt />);
    expect(container.firstChild).toBeNull();
  });

  it('calls installApp when install button is clicked', async () => {
    mockPWAActions.installApp.mockResolvedValue(true);

    render(<PWAInstallPrompt />);

    const installButton = screen.getByRole('button', { name: 'Install' });
    fireEvent.click(installButton);

    await waitFor(() => {
      expect(mockPWAActions.installApp).toHaveBeenCalled();
    });
  });

  it('shows installing state during installation', async () => {
    vi.mocked(usePWAHook.usePWA).mockReturnValue([
      { 
        ...mockPWAState, 
        capabilities: { 
          ...mockPWAState.capabilities, 
          isInstallable: true, 
          isInstalled: false 
        },
        installPromptAvailable: true
      },
      mockPWAActions
    ]);

    mockPWAActions.installApp.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(true), 100)));

    render(<PWAInstallPrompt />);

    const installButton = screen.getByRole('button', { name: 'Install' });
    fireEvent.click(installButton);

    // Check for installing state
    await waitFor(() => {
      expect(screen.getByText('Installing...')).toBeInTheDocument();
    });
    
    const installingButton = screen.getByRole('button', { name: 'Installing...' });
    expect(installingButton).toBeDisabled();

    await waitFor(() => {
      expect(mockPWAActions.installApp).toHaveBeenCalled();
    });
  });

  it('calls onInstall callback when installation succeeds', async () => {
    const onInstall = vi.fn();
    mockPWAActions.installApp.mockResolvedValue(true);

    render(<PWAInstallPrompt onInstall={onInstall} />);

    const installButton = screen.getByRole('button', { name: 'Install' });
    fireEvent.click(installButton);

    await waitFor(() => {
      expect(onInstall).toHaveBeenCalled();
    });
  });

  it('handles installation failure gracefully', async () => {
    vi.mocked(usePWAHook.usePWA).mockReturnValue([
      { 
        ...mockPWAState, 
        capabilities: { 
          ...mockPWAState.capabilities, 
          isInstallable: true, 
          isInstalled: false 
        },
        installPromptAvailable: true
      },
      mockPWAActions
    ]);

    mockPWAActions.installApp.mockResolvedValue(false);

    render(<PWAInstallPrompt />);

    const installButton = screen.getByRole('button', { name: 'Install' });
    fireEvent.click(installButton);

    await waitFor(() => {
      expect(mockPWAActions.installApp).toHaveBeenCalled();
    });

    // Should still show the install button after failure
    await waitFor(() => {
      const resetButton = screen.getByRole('button', { name: 'Install' });
      expect(resetButton).toBeInTheDocument();
      expect(resetButton).not.toBeDisabled();
    });
  });

  it('dismisses prompt when "Not now" is clicked', () => {
    const onDismiss = vi.fn();

    render(<PWAInstallPrompt onDismiss={onDismiss} />);

    const dismissButton = screen.getByRole('button', { name: 'Not now' });
    fireEvent.click(dismissButton);

    expect(onDismiss).toHaveBeenCalled();
  });

  it('dismisses prompt when close button is clicked', () => {
    const onDismiss = vi.fn();

    render(<PWAInstallPrompt onDismiss={onDismiss} />);

    const closeButton = screen.getByRole('button', { name: 'Dismiss install prompt' });
    fireEvent.click(closeButton);

    expect(onDismiss).toHaveBeenCalled();
  });

  it('applies custom className', () => {
    const { container } = render(<PWAInstallPrompt className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('hides after being dismissed', () => {
    render(<PWAInstallPrompt />);

    expect(screen.getByText('Install Ellie Voice Assistant')).toBeInTheDocument();

    const dismissButton = screen.getByRole('button', { name: 'Not now' });
    fireEvent.click(dismissButton);

    // Component should not render after dismissal
    expect(screen.queryByText('Install Ellie Voice Assistant')).not.toBeInTheDocument();
  });

  it('handles installation errors', async () => {
    vi.mocked(usePWAHook.usePWA).mockReturnValue([
      { 
        ...mockPWAState, 
        capabilities: { 
          ...mockPWAState.capabilities, 
          isInstallable: true, 
          isInstalled: false 
        },
        installPromptAvailable: true
      },
      mockPWAActions
    ]);

    mockPWAActions.installApp.mockRejectedValue(new Error('Installation failed'));

    render(<PWAInstallPrompt />);

    const installButton = screen.getByRole('button', { name: 'Install' });
    fireEvent.click(installButton);

    await waitFor(() => {
      expect(mockPWAActions.installApp).toHaveBeenCalled();
    });

    // Should reset to normal state after error
    await waitFor(() => {
      const resetButton = screen.getByRole('button', { name: 'Install' });
      expect(resetButton).toBeInTheDocument();
      expect(resetButton).not.toBeDisabled();
    });
  });
});