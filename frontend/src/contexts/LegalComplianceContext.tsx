import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { PrivacySettings } from '../components/ConversationPrivacyControls';

interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  preferredContact: 'email' | 'phone';
  urgency: 'low' | 'medium' | 'high';
  description: string;
}

interface LegalComplianceContextType {
  // Legal disclaimer state
  hasAcceptedDisclaimer: boolean;
  showDisclaimer: boolean;
  acceptDisclaimer: () => void;
  declineDisclaimer: () => void;
  
  // Professional referral state
  showProfessionalReferral: boolean;
  referralReason?: string;
  openProfessionalReferral: (reason?: string) => void;
  closeProfessionalReferral: () => void;
  scheduleProfessionalConsultation: (contactInfo: ContactInfo) => Promise<void>;
  
  // Privacy controls state
  showPrivacyControls: boolean;
  privacySettings: PrivacySettings;
  openPrivacyControls: () => void;
  closePrivacyControls: () => void;
  updatePrivacySettings: (settings: PrivacySettings) => Promise<void>;
  
  // Data management
  requestDataDeletion: (immediate?: boolean, reason?: string) => Promise<void>;
  exportUserData: () => Promise<void>;
  
  // Legal compliance status
  isCompliant: boolean;
  complianceIssues: string[];
}

const LegalComplianceContext = createContext<LegalComplianceContextType | undefined>(undefined);

const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  enableConversationLogging: true,
  enableAudioRecording: false,
  dataRetentionDays: 30,
  allowAnalytics: false,
  allowQualityImprovement: false
};

interface LegalComplianceProviderProps {
  children: ReactNode;
  sessionId: string;
}

export const LegalComplianceProvider: React.FC<LegalComplianceProviderProps> = ({
  children,
  sessionId
}) => {
  // Legal disclaimer state
  const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  
  // Professional referral state
  const [showProfessionalReferral, setShowProfessionalReferral] = useState(false);
  const [referralReason, setReferralReason] = useState<string>();
  
  // Privacy controls state
  const [showPrivacyControls, setShowPrivacyControls] = useState(false);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(DEFAULT_PRIVACY_SETTINGS);
  
  // Compliance state
  const [isCompliant, setIsCompliant] = useState(true);
  const [complianceIssues, setComplianceIssues] = useState<string[]>([]);

  // Legal disclaimer handlers
  const acceptDisclaimer = useCallback(() => {
    setHasAcceptedDisclaimer(true);
    setShowDisclaimer(false);
    localStorage.setItem(`ellie-disclaimer-accepted-${sessionId}`, 'true');
  }, [sessionId]);

  const declineDisclaimer = useCallback(() => {
    setHasAcceptedDisclaimer(false);
    setShowDisclaimer(false);
    // Redirect or show alternative interface
    window.location.href = '/';
  }, []);

  // Professional referral handlers
  const openProfessionalReferral = useCallback((reason?: string) => {
    setReferralReason(reason);
    setShowProfessionalReferral(true);
  }, []);

  const closeProfessionalReferral = useCallback(() => {
    setShowProfessionalReferral(false);
    setReferralReason(undefined);
  }, []);

  const scheduleProfessionalConsultation = useCallback(async (contactInfo: ContactInfo) => {
    try {
      const response = await fetch('/api/legal/referral', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...contactInfo,
          sessionId,
          referralReason: referralReason || 'User requested professional consultation'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to schedule consultation');
      }

      const result = await response.json();
      
      // Show success message
      alert(`Consultation scheduled successfully! Reference ID: ${result.referralId}. You will be contacted ${result.estimatedContactTime}.`);
      
      closeProfessionalReferral();
    } catch (error) {
      console.error('Failed to schedule consultation:', error);
      throw error;
    }
  }, [sessionId, referralReason, closeProfessionalReferral]);

  // Privacy controls handlers
  const openPrivacyControls = useCallback(() => {
    setShowPrivacyControls(true);
  }, []);

  const closePrivacyControls = useCallback(() => {
    setShowPrivacyControls(false);
  }, []);

  const updatePrivacySettings = useCallback(async (newSettings: PrivacySettings) => {
    try {
      const response = await fetch(`/api/legal/privacy-settings/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
      });

      if (!response.ok) {
        throw new Error('Failed to update privacy settings');
      }

      setPrivacySettings(newSettings);
      localStorage.setItem(`ellie-privacy-settings-${sessionId}`, JSON.stringify(newSettings));
      
    } catch (error) {
      console.error('Failed to update privacy settings:', error);
      throw error;
    }
  }, [sessionId]);

  // Data management handlers
  const requestDataDeletion = useCallback(async (immediate = true, reason?: string) => {
    try {
      const response = await fetch(`/api/legal/data/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ immediate, reason }),
      });

      if (!response.ok) {
        throw new Error('Failed to request data deletion');
      }

      const result = await response.json();
      alert(result.message);
      
      if (immediate) {
        // Clear local storage
        localStorage.removeItem(`ellie-disclaimer-accepted-${sessionId}`);
        localStorage.removeItem(`ellie-privacy-settings-${sessionId}`);
      }
      
    } catch (error) {
      console.error('Failed to request data deletion:', error);
      throw error;
    }
  }, [sessionId]);

  const exportUserData = useCallback(async () => {
    try {
      const response = await fetch(`/api/legal/data-export/${sessionId}`);

      if (!response.ok) {
        throw new Error('Failed to export user data');
      }

      // Download the exported data
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ellie-data-export-${sessionId}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (error) {
      console.error('Failed to export user data:', error);
      throw error;
    }
  }, [sessionId]);

  // Load saved settings on mount
  React.useEffect(() => {
    // Check if disclaimer was previously accepted
    const disclaimerAccepted = localStorage.getItem(`ellie-disclaimer-accepted-${sessionId}`);
    if (disclaimerAccepted === 'true') {
      setHasAcceptedDisclaimer(true);
      setShowDisclaimer(false);
    }

    // Load saved privacy settings
    const savedSettings = localStorage.getItem(`ellie-privacy-settings-${sessionId}`);
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setPrivacySettings(parsedSettings);
      } catch (error) {
        console.error('Failed to parse saved privacy settings:', error);
      }
    }
  }, [sessionId]);

  const contextValue: LegalComplianceContextType = {
    // Legal disclaimer
    hasAcceptedDisclaimer,
    showDisclaimer,
    acceptDisclaimer,
    declineDisclaimer,
    
    // Professional referral
    showProfessionalReferral,
    referralReason,
    openProfessionalReferral,
    closeProfessionalReferral,
    scheduleProfessionalConsultation,
    
    // Privacy controls
    showPrivacyControls,
    privacySettings,
    openPrivacyControls,
    closePrivacyControls,
    updatePrivacySettings,
    
    // Data management
    requestDataDeletion,
    exportUserData,
    
    // Compliance status
    isCompliant,
    complianceIssues
  };

  return (
    <LegalComplianceContext.Provider value={contextValue}>
      {children}
    </LegalComplianceContext.Provider>
  );
};

export const useLegalCompliance = (): LegalComplianceContextType => {
  const context = useContext(LegalComplianceContext);
  if (context === undefined) {
    throw new Error('useLegalCompliance must be used within a LegalComplianceProvider');
  }
  return context;
};