import React, { useState } from 'react';
import AnimatedBackground from './AnimatedBackground';
import VoiceInteractionManager from './VoiceInteractionManager';

const LandingPage: React.FC = () => {
  const [showDemo, setShowDemo] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);

  const handleStartDemo = () => {
    setShowDemo(true);
    setDemoError(null);
  };

  const handleCloseDemo = () => {
    setShowDemo(false);
    setDemoError(null);
  };

  const handleDemoError = (error: string) => {
    setDemoError(error);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />

      {/* Header */}
      <header className="glass fixed w-full top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center animate-slide-in-left">
              <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-glow">
                <span className="text-white font-bold text-xl">E</span>
              </div>
              <span className="ml-3 text-xl font-bold text-white">
                Ellie Voice Receptionist
              </span>
            </div>
            <nav className="hidden md:flex space-x-8 animate-slide-in-right">
              <a href="#features" className="text-gray-300 hover:text-white transition-all duration-300 hover:scale-105">
                Features
              </a>
              <a href="#demo" className="text-gray-300 hover:text-white transition-all duration-300 hover:scale-105">
                Demo
              </a>
              <a href="#contact" className="text-gray-300 hover:text-white transition-all duration-300 hover:scale-105">
                Contact
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto text-center">
          <div className="animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-black text-white mb-8 leading-tight">
              Meet <span className="gradient-text-primary animate-pulse-glow">Ellie</span>
              <br />
              <span className="text-4xl md:text-6xl text-gray-300">Your AI Legal Assistant</span>
            </h1>
          </div>
          <div className="animate-slide-up">
            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
              Experience the future of legal assistance with voice-powered AI that understands 
              your needs and provides instant, professional guidance with unprecedented accuracy.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-6 justify-center animate-bounce-gentle">
            <button 
              onClick={handleStartDemo}
              className="btn-primary bg-gradient-to-r from-primary-600 to-primary-700 text-white px-10 py-5 rounded-2xl text-xl font-bold hover:from-primary-700 hover:to-primary-800 transition-all duration-300 shadow-glow-lg hover:shadow-glow transform hover:scale-105"
            >
              🎤 Try Voice Demo
            </button>
            <button className="glass border-2 border-white/30 text-white px-10 py-5 rounded-2xl text-xl font-bold hover:bg-white/10 transition-all duration-300 transform hover:scale-105">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20 animate-slide-up">
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6">
              Why Choose <span className="gradient-text">Ellie</span>?
            </h2>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Powered by cutting-edge AI technology, Ellie provides professional legal assistance 
              through natural voice interaction with unmatched precision.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="glass p-8 rounded-3xl hover-lift hover:shadow-glow transition-all duration-500 group animate-slide-in-left">
              <div className="w-20 h-20 bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:animate-bounce-gentle shadow-glow">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 text-center">Voice-First Interface</h3>
              <p className="text-gray-300 text-center leading-relaxed">
                Simply speak to Ellie naturally. No typing required - just ask your questions 
                and get instant, intelligent responses powered by advanced speech recognition.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glass p-8 rounded-3xl hover-lift hover:shadow-glow transition-all duration-500 group animate-slide-up">
              <div className="w-20 h-20 bg-gradient-to-r from-accent-500 to-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:animate-bounce-gentle shadow-glow">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 text-center">AI-Powered Intelligence</h3>
              <p className="text-gray-300 text-center leading-relaxed">
                Advanced AI understands complex legal context and provides accurate, helpful information 
                tailored to your specific needs with unprecedented accuracy.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass p-8 rounded-3xl hover-lift hover:shadow-glow transition-all duration-500 group animate-slide-in-right">
              <div className="w-20 h-20 bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:animate-bounce-gentle shadow-glow">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 text-center">Mobile-First Design</h3>
              <p className="text-gray-300 text-center leading-relaxed">
                Access Ellie from any device, anywhere. Optimized for mobile with PWA capabilities 
                for a seamless, app-like experience across all platforms.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="glass p-8 rounded-3xl hover-lift hover:shadow-glow transition-all duration-500 group animate-slide-in-left">
              <div className="w-20 h-20 bg-gradient-to-r from-accent-500 to-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:animate-bounce-gentle shadow-glow">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 text-center">Secure & Compliant</h3>
              <p className="text-gray-300 text-center leading-relaxed">
                Your conversations are encrypted and private. Built with enterprise-grade security 
                and legal compliance standards to protect your sensitive information.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="glass p-8 rounded-3xl hover-lift hover:shadow-glow transition-all duration-500 group animate-slide-up">
              <div className="w-20 h-20 bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:animate-bounce-gentle shadow-glow">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 text-center">Instant Responses</h3>
              <p className="text-gray-300 text-center leading-relaxed">
                Get immediate answers to your legal questions. No waiting, no appointments - 
                just instant professional guidance available 24/7 whenever you need it.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="glass p-8 rounded-3xl hover-lift hover:shadow-glow transition-all duration-500 group animate-slide-in-right">
              <div className="w-20 h-20 bg-gradient-to-r from-accent-500 to-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:animate-bounce-gentle shadow-glow">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 text-center">Professional Network</h3>
              <p className="text-gray-300 text-center leading-relaxed">
                When you need human expertise, Ellie seamlessly connects you with qualified legal 
                professionals in your area for complex matters requiring personal attention.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600/20 to-accent-600/20 backdrop-blur-sm"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="animate-slide-up">
            <h2 className="text-4xl md:text-6xl font-black text-white mb-8">
              Ready to Experience <span className="gradient-text">Ellie</span>?
            </h2>
            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Try our voice demo and see how easy it is to get professional legal assistance. 
              Just click the button and start speaking - it's that simple.
            </p>
            <button 
              onClick={handleStartDemo}
              className="btn-primary bg-gradient-to-r from-white to-gray-100 text-primary-700 px-12 py-6 rounded-2xl text-2xl font-black hover:from-gray-100 hover:to-white transition-all duration-300 shadow-glow-lg hover:shadow-glow transform hover:scale-110 animate-pulse-glow"
            >
              🎤 Start Voice Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="glass-dark py-16 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="col-span-2">
              <div className="flex items-center mb-6 animate-slide-in-left">
                <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-glow">
                  <span className="text-white font-bold text-xl">E</span>
                </div>
                <span className="ml-3 text-2xl font-bold text-white">Ellie Voice Receptionist</span>
              </div>
              <p className="text-gray-300 mb-6 text-lg leading-relaxed">
                AI-powered legal assistance through natural voice interaction. 
                Professional, secure, and available 24/7 to serve your legal needs.
              </p>
              <p className="text-sm text-gray-500">
                © 2024 Ellie Voice Receptionist. All rights reserved.
              </p>
            </div>
            <div className="animate-slide-up">
              <h3 className="font-bold mb-6 text-white text-xl">Product</h3>
              <ul className="space-y-3 text-gray-300">
                <li><a href="#features" className="hover:text-white transition-colors hover:scale-105 inline-block">Features</a></li>
                <li><a href="#demo" className="hover:text-white transition-colors hover:scale-105 inline-block">Demo</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors hover:scale-105 inline-block">Pricing</a></li>
              </ul>
            </div>
            <div className="animate-slide-up">
              <h3 className="font-bold mb-6 text-white text-xl">Support</h3>
              <ul className="space-y-3 text-gray-300">
                <li><a href="#contact" className="hover:text-white transition-colors hover:scale-105 inline-block">Contact</a></li>
                <li><a href="#help" className="hover:text-white transition-colors hover:scale-105 inline-block">Help Center</a></li>
                <li><a href="#privacy" className="hover:text-white transition-colors hover:scale-105 inline-block">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>

      {/* Voice Demo Modal */}
      {showDemo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">E</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Voice Demo</h2>
                  <p className="text-sm text-gray-600">Talk to Ellie - Your AI Legal Assistant</p>
                </div>
              </div>
              <button
                onClick={handleCloseDemo}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2"
                aria-label="Close demo"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 h-[calc(90vh-120px)]">
              {demoError && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <p className="text-red-700 text-sm">{demoError}</p>
                  </div>
                </div>
              )}
              
              <VoiceInteractionManager
                className="h-full"
                onError={handleDemoError}
              />
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  💡 Tip: Click the microphone button and speak naturally to Ellie
                </p>
                <button
                  onClick={handleCloseDemo}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Close Demo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;