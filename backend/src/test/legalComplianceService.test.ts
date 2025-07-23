/**
 * Legal Compliance Service Tests
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

import { LegalComplianceService, ProfessionalReferralRequest } from '../services/legalComplianceService';
import { ConversationContext, Message } from '../types';

describe('LegalComplianceService', () => {
  let legalComplianceService: LegalComplianceService;
  let mockContext: ConversationContext;

  beforeEach(() => {
    legalComplianceService = new LegalComplianceService();
    mockContext = {
      sessionId: 'test-session-123',
      conversationHistory: [],
      userPreferences: {
        voiceSpeed: 1.0,
        language: 'en',
        accessibilityMode: false
      },
      legalDisclaimer: true
    };
  });

  describe('analyzeLegalCompliance', () => {
    it('should detect prohibited legal advice patterns', async () => {
      const response = 'You should sue them immediately. You have a strong case and will definitely win in court.';
      const userInput = 'Can I sue my employer?';

      const result = await legalComplianceService.analyzeLegalCompliance(response, userInput, mockContext);

      expect(result.isCompliant).toBe(false);
      expect(result.complianceIssues).toContain('Response contains specific legal advice');
    });

    it('should identify complex legal matters requiring professional referral', async () => {
      const response = 'That sounds like a complex legal matter.';
      const userInput = 'I need help with a class action lawsuit against my former employer for securities fraud.';

      const result = await legalComplianceService.analyzeLegalCompliance(response, userInput, mockContext);

      expect(result.requiresProfessionalReferral).toBe(true);
      expect(result.referralReason).toContain('complex legal matter');
    });

    it('should detect urgent legal matters', async () => {
      const response = 'I understand this is urgent.';
      const userInput = 'I need immediate legal help - I was just arrested and need emergency representation.';

      const result = await legalComplianceService.analyzeLegalCompliance(response, userInput, mockContext);

      expect(result.requiresProfessionalReferral).toBe(true);
      expect(result.referralReason).toContain('complex legal matter');
    });

    it('should pass compliant general information responses', async () => {
      const response = 'I can provide general information about contract law. For specific advice about your situation, please consult with one of our qualified attorneys.';
      const userInput = 'What is a contract?';

      const result = await legalComplianceService.analyzeLegalCompliance(response, userInput, mockContext);

      expect(result.isCompliant).toBe(true);
      expect(result.requiresProfessionalReferral).toBe(false);
      expect(result.complianceIssues).toHaveLength(0);
    });

    it('should detect missing disclaimers in legal responses', async () => {
      const response = 'Contracts are legally binding agreements between parties.';
      const userInput = 'What makes a contract valid?';

      const result = await legalComplianceService.analyzeLegalCompliance(response, userInput, mockContext);

      expect(result.isCompliant).toBe(false);
      expect(result.complianceIssues).toContain('Legal response missing appropriate disclaimer');
    });

    it('should analyze conversation complexity for referral recommendations', async () => {
      // Add multiple legal messages to conversation history
      const legalMessages: Message[] = [
        {
          id: '1',
          timestamp: new Date(),
          type: 'user',
          content: 'I have a contract dispute',
          metadata: {}
        },
        {
          id: '2',
          timestamp: new Date(),
          type: 'user',
          content: 'The other party breached the agreement',
          metadata: {}
        },
        {
          id: '3',
          timestamp: new Date(),
          type: 'user',
          content: 'I want to sue for damages',
          metadata: {}
        },
        {
          id: '4',
          timestamp: new Date(),
          type: 'user',
          content: 'What are my legal options for litigation?',
          metadata: {}
        },
        {
          id: '5',
          timestamp: new Date(),
          type: 'user',
          content: 'How do I file a lawsuit?',
          metadata: {}
        },
        {
          id: '6',
          timestamp: new Date(),
          type: 'user',
          content: 'What about litigation strategy?',
          metadata: {}
        }
      ];

      mockContext.conversationHistory = legalMessages;

      const response = 'That sounds complex.';
      const userInput = 'I need more help with this litigation matter.';

      const result = await legalComplianceService.analyzeLegalCompliance(response, userInput, mockContext);

      expect(result.requiresProfessionalReferral).toBe(true);
      expect(result.referralReason).toContain('Extended legal discussion');
    });
  });

  describe('processProfessionalReferral', () => {
    it('should successfully process valid referral request', async () => {
      const validRequest: ProfessionalReferralRequest = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1-555-123-4567',
        preferredContact: 'email',
        urgency: 'medium',
        description: 'I need help with a contract dispute involving my business partnership.',
        sessionId: 'test-session-123',
        referralReason: 'Complex business legal matter'
      };

      const result = await legalComplianceService.processProfessionalReferral(validRequest);

      expect(result).toBe(true);
    });

    it('should reject referral request with missing required fields', async () => {
      const invalidRequest: ProfessionalReferralRequest = {
        name: '',
        email: 'invalid-email',
        phone: '',
        preferredContact: 'email',
        urgency: 'medium',
        description: '',
        sessionId: 'test-session-123',
        referralReason: 'Test referral'
      };

      await expect(legalComplianceService.processProfessionalReferral(invalidRequest))
        .rejects.toThrow('Invalid referral request');
    });

    it('should validate email format in referral request', async () => {
      const invalidEmailRequest: ProfessionalReferralRequest = {
        name: 'John Doe',
        email: 'invalid-email-format',
        phone: '+1-555-123-4567',
        preferredContact: 'email',
        urgency: 'medium',
        description: 'Legal matter description',
        sessionId: 'test-session-123',
        referralReason: 'Test referral'
      };

      await expect(legalComplianceService.processProfessionalReferral(invalidEmailRequest))
        .rejects.toThrow('Valid email address is required');
    });
  });

  describe('generateLegalDisclaimer', () => {
    it('should generate basic disclaimer for non-legal conversations', () => {
      const disclaimer = legalComplianceService.generateLegalDisclaimer(mockContext);

      expect(disclaimer).toContain("I'm Ellie, an AI assistant that provides general information only");
      expect(disclaimer).toContain('cannot give specific legal advice');
      expect(disclaimer).toContain('does not create an attorney-client relationship');
    });

    it('should generate enhanced disclaimer for legal conversations', () => {
      const legalMessages: Message[] = [
        {
          id: '1',
          timestamp: new Date(),
          type: 'user',
          content: 'I have a legal question about contracts',
          metadata: {}
        }
      ];

      mockContext.conversationHistory = legalMessages;

      const disclaimer = legalComplianceService.generateLegalDisclaimer(mockContext);

      expect(disclaimer).toContain('For specific legal advice about your situation');
      expect(disclaimer).toContain('qualified attorneys');
    });
  });

  describe('Complex Legal Indicator Detection', () => {
    const complexLegalQueries = [
      'I need help with a class action lawsuit',
      'My criminal charges include felony fraud',
      'I need litigation strategy for my court case',
      'Help with securities fraud investigation',
      'Constitutional law violation by government',
      'Emergency restraining order needed',
      'Antitrust violation by competitor',
      'Intellectual property dispute resolution',
      'Corporate merger legal requirements',
      'Professional malpractice claim process'
    ];

    complexLegalQueries.forEach((query) => {
      it(`should detect complex legal matter: "${query}"`, async () => {
        const response = 'I understand your concern.';

        const result = await legalComplianceService.analyzeLegalCompliance(response, query, mockContext);

        expect(result.requiresProfessionalReferral).toBe(true);
        expect(result.referralReason).toBeDefined();
      });
    });
  });

  describe('Prohibited Advice Pattern Detection', () => {
    const prohibitedResponses = [
      'You should sue them immediately',
      'I recommend filing a lawsuit',
      'You have a strong case and will win',
      'You will definitely lose in court',
      'The statute of limitations has expired',
      'You are liable for these damages',
      'This is definitely illegal activity',
      'You should plead guilty',
      'Don\'t sign that contract',
      'You can expect to recover damages'
    ];

    prohibitedResponses.forEach((response) => {
      it(`should detect prohibited advice: "${response}"`, async () => {
        const userInput = 'What should I do about my legal problem?';

        const result = await legalComplianceService.analyzeLegalCompliance(response, userInput, mockContext);

        expect(result.isCompliant).toBe(false);
        expect(result.complianceIssues).toContain('Response contains specific legal advice');
      });
    });
  });

  describe('Appropriate Legal Responses', () => {
    const appropriateResponses = [
      'I can provide general information about contract law. For specific advice, please consult with an attorney.',
      'This sounds like a complex matter that would benefit from professional legal analysis.',
      'For matters requiring specific legal advice, I recommend speaking with one of our qualified attorneys.',
      'I provide general information only and cannot give specific legal advice for your situation.',
      'This appears to be an urgent legal matter. I recommend consulting with an attorney immediately.'
    ];

    appropriateResponses.forEach((response) => {
      it(`should approve appropriate response: "${response.substring(0, 50)}..."`, async () => {
        const userInput = 'I have a legal question';

        const result = await legalComplianceService.analyzeLegalCompliance(response, userInput, mockContext);

        expect(result.isCompliant).toBe(true);
      });
    });
  });
});