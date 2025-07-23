import React, { useState } from 'react';

interface ProfessionalReferralProps {
  isVisible: boolean;
  onClose: () => void;
  onScheduleConsultation: (contactInfo: ContactInfo) => void;
  reason?: string;
}

interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  preferredContact: 'email' | 'phone';
  urgency: 'low' | 'medium' | 'high';
  description: string;
}

const ProfessionalReferral: React.FC<ProfessionalReferralProps> = ({
  isVisible,
  onClose,
  onScheduleConsultation,
  reason
}) => {
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    name: '',
    email: '',
    phone: '',
    preferredContact: 'email',
    urgency: 'medium',
    description: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<ContactInfo>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<ContactInfo> = {};

    if (!contactInfo.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!contactInfo.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactInfo.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!contactInfo.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[\+]?[1-9][\d]{0,15}$/.test(contactInfo.phone.replace(/[\s\-\(\)]/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!contactInfo.description.trim()) {
      newErrors.description = 'Please describe your legal matter';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onScheduleConsultation(contactInfo);
      onClose();
    } catch (error) {
      console.error('Failed to schedule consultation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof ContactInfo, value: string) => {
    setContactInfo(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <div>
                <h2 className="text-2xl font-bold">Connect with a Legal Professional</h2>
                <p className="text-primary-100">Schedule a consultation with our qualified attorneys</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-primary-100 hover:text-white transition-colors p-2"
              aria-label="Close referral form"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {reason && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded mb-6">
              <div className="flex">
                <svg className="w-5 h-5 text-blue-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-lg font-semibold text-blue-800 mb-1">Why We're Recommending Professional Help</h3>
                  <p className="text-blue-700">{reason}</p>
                </div>
              </div>
            </div>
          )}

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">What to Expect</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium text-green-800">Free Initial Consultation</span>
                </div>
                <p className="text-green-700 text-sm">30-minute consultation at no charge</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <svg className="w-5 h-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                  <span className="font-medium text-blue-800">Confidential Discussion</span>
                </div>
                <p className="text-blue-700 text-sm">Attorney-client privilege applies</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <svg className="w-5 h-5 text-purple-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium text-purple-800">Licensed Attorneys</span>
                </div>
                <p className="text-purple-700 text-sm">Qualified legal professionals</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <svg className="w-5 h-5 text-orange-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium text-orange-800">Quick Response</span>
                </div>
                <p className="text-orange-700 text-sm">Contact within 24 hours</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={contactInfo.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter your full name"
                />
                {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  value={contactInfo.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter your email address"
                />
                {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={contactInfo.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.phone ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter your phone number"
                />
                {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label htmlFor="preferredContact" className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Contact Method
                </label>
                <select
                  id="preferredContact"
                  value={contactInfo.preferredContact}
                  onChange={(e) => handleInputChange('preferredContact', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="urgency" className="block text-sm font-medium text-gray-700 mb-1">
                Urgency Level
              </label>
              <select
                id="urgency"
                value={contactInfo.urgency}
                onChange={(e) => handleInputChange('urgency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="low">Low - General inquiry (1-2 weeks)</option>
                <option value="medium">Medium - Important matter (2-3 days)</option>
                <option value="high">High - Urgent matter (within 24 hours)</option>
              </select>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Brief Description of Your Legal Matter *
              </label>
              <textarea
                id="description"
                rows={4}
                value={contactInfo.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Please provide a brief description of your legal matter. This helps us connect you with the right attorney."
              />
              {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description}</p>}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t">
          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                isSubmitting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              {isSubmitting ? 'Scheduling...' : 'Schedule Consultation'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalReferral;