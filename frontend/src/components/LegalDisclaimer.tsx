import React, { useState } from 'react';

interface LegalDisclaimerProps {
  onAccept: () => void;
  onDecline: () => void;
  isVisible: boolean;
}

const LegalDisclaimer: React.FC<LegalDisclaimerProps> = ({
  onAccept,
  onDecline,
  isVisible
}) => {
  const [hasReadDisclaimer, setHasReadDisclaimer] = useState(false);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-white">
          <div className="flex items-center space-x-3">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h2 className="text-2xl font-bold">Legal Disclaimer & Terms of Use</h2>
              <p className="text-primary-100">Please read carefully before using Ellie</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="space-y-6 text-gray-700">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <div className="flex">
                <svg className="w-5 h-5 text-yellow-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-lg font-semibold text-yellow-800 mb-2">Important Notice</h3>
                  <p className="text-yellow-700">
                    Ellie is an AI assistant that provides general information only. This service does not create an attorney-client relationship and should not be considered legal advice.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">What Ellie Can Do</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Provide general information about legal topics and procedures</li>
                <li>Help you understand common legal concepts and terminology</li>
                <li>Direct you to appropriate legal resources and services</li>
                <li>Answer questions about our law firm's services and expertise</li>
                <li>Schedule consultations with qualified attorneys</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">What Ellie Cannot Do</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Provide specific legal advice tailored to your situation</li>
                <li>Represent you in legal proceedings or negotiations</li>
                <li>Create legally binding documents or contracts</li>
                <li>Guarantee outcomes for legal matters</li>
                <li>Replace consultation with a qualified attorney</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Privacy & Data Protection</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Your conversations are encrypted and processed securely</li>
                <li>Audio data is processed in real-time and not permanently stored</li>
                <li>Conversation logs may be kept for quality improvement purposes</li>
                <li>You can request deletion of your data at any time</li>
                <li>We comply with applicable privacy laws and regulations</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Professional Legal Consultation</h3>
              <p className="text-gray-600 mb-3">
                For matters requiring specific legal advice, professional representation, or complex legal analysis, 
                we strongly recommend consulting with one of our qualified attorneys who can:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Provide personalized legal advice based on your specific circumstances</li>
                <li>Represent your interests in legal proceedings</li>
                <li>Draft and review legal documents</li>
                <li>Develop legal strategies tailored to your needs</li>
              </ul>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Need Human Legal Assistance?</h3>
              <p className="text-blue-700 mb-3">
                If your matter requires professional legal advice, Ellie can connect you with qualified attorneys in our firm.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">Free Consultation Available</span>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">Licensed Attorneys</span>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">Confidential</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t">
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="disclaimer-read"
              checked={hasReadDisclaimer}
              onChange={(e) => setHasReadDisclaimer(e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="disclaimer-read" className="ml-2 text-sm text-gray-700">
              I have read and understand the legal disclaimer and terms of use
            </label>
          </div>
          
          <div className="flex justify-end space-x-4">
            <button
              onClick={onDecline}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Decline
            </button>
            <button
              onClick={onAccept}
              disabled={!hasReadDisclaimer}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                hasReadDisclaimer
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Accept & Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalDisclaimer;