# Voice Demo Test Plan

## Overview
This document provides a comprehensive manual testing plan for the Ellie Voice Receptionist landing page demo. The test plan covers all voice interaction features and requirements.

## Prerequisites

### Environment Setup
1. Docker and Docker Compose installed
2. Valid API keys configured in `backend/.env`:
   - `OPENAI_API_KEY` - for Whisper (speech-to-text) and TTS (text-to-speech)
   - `GROQ_API_KEY` - for AI response generation
3. Microphone access enabled in browser
4. Modern browser (Chrome, Firefox, Safari, or Edge)

### Starting the Application
```bash
# From the project root directory
cd docker
docker-compose up --build
```

Wait for all services to be healthy:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Nginx: http://localhost:80
- Redis: localhost:6380

## Test Scenarios

### Test 1: Landing Page Load and Display
**Requirement:** 2.1, 2.2, 2.4

**Steps:**
1. Navigate to http://localhost:3000
2. Verify the page loads without errors
3. Check that all sections are visible:
   - Header with Ellie logo and navigation
   - Hero section with "Meet Ellie" heading
   - "Try Voice Demo" button is prominent
   - Features section with 6 feature cards
   - Demo section with "Start Voice Demo" button
   - Footer with links and information

**Expected Results:**
- ✅ Page loads within 3 seconds
- ✅ All sections render correctly
- ✅ Professional branding is displayed
- ✅ Responsive design works on different screen sizes
- ✅ Animations and visual effects work smoothly

**Status:** [ ] Pass [ ] Fail

---

### Test 2: Legal Disclaimer Display
**Requirement:** 6.4

**Steps:**
1. Click the "Try Voice Demo" button in the hero section
2. Observe the legal disclaimer modal

**Expected Results:**
- ✅ Legal disclaimer modal appears
- ✅ Disclaimer text explains AI limitations
- ✅ "Accept" and "Decline" buttons are visible
- ✅ Modal cannot be dismissed without action

**Status:** [ ] Pass [ ] Fail

---

### Test 3: Legal Disclaimer Acceptance
**Requirement:** 6.4

**Steps:**
1. Click "Accept" on the legal disclaimer
2. Observe the voice demo modal

**Expected Results:**
- ✅ Disclaimer modal closes
- ✅ Voice demo modal opens
- ✅ VoiceInteractionManager component is visible
- ✅ Microphone button is displayed

**Status:** [ ] Pass [ ] Fail

---

### Test 4: Legal Disclaimer Decline
**Requirement:** 6.4

**Steps:**
1. Refresh the page
2. Click "Try Voice Demo" button
3. Click "Decline" on the legal disclaimer

**Expected Results:**
- ✅ Disclaimer modal closes
- ✅ Voice demo does NOT open
- ✅ User remains on landing page

**Status:** [ ] Pass [ ] Fail

---

### Test 5: Voice Demo Modal Display
**Requirement:** 1.1, 7.1

**Steps:**
1. Accept disclaimer and open voice demo
2. Examine the voice demo modal

**Expected Results:**
- ✅ Modal displays with proper styling
- ✅ Header shows "Voice Demo" title
- ✅ Close button (X) is visible in top-right
- ✅ VoiceInteractionManager component is rendered
- ✅ Microphone button is prominent and visible
- ✅ Footer shows helpful tip
- ✅ Modal is responsive and centered

**Status:** [ ] Pass [ ] Fail

---

### Test 6: Microphone Permission Request
**Requirement:** 1.2, 3.2

**Steps:**
1. Open voice demo modal
2. Click the microphone button
3. Observe browser permission prompt

**Expected Results:**
- ✅ Browser requests microphone permission
- ✅ Clear message explains why permission is needed
- ✅ If denied, error message is displayed
- ✅ If granted, recording state activates

**Status:** [ ] Pass [ ] Fail

---

### Test 7: Voice Recording - Visual Feedback
**Requirement:** 1.2, 7.1

**Steps:**
1. Grant microphone permission
2. Click microphone button to start recording
3. Observe visual feedback

**Expected Results:**
- ✅ Microphone button changes state (color, animation)
- ✅ Visual indicator shows "listening" state
- ✅ Waveform or pulse animation appears
- ✅ Status text shows "Listening..." or similar

**Status:** [ ] Pass [ ] Fail

---

### Test 8: Voice Recording - Audio Capture
**Requirement:** 1.2, 1.3, 5.1

**Steps:**
1. Start recording
2. Speak a simple greeting: "Hello Ellie"
3. Stop recording (if manual stop is required)
4. Observe processing

**Expected Results:**
- ✅ Audio is captured
- ✅ Processing indicator appears
- ✅ Status changes to "Processing..." or similar
- ✅ No errors in browser console

**Status:** [ ] Pass [ ] Fail

---

### Test 9: Speech-to-Text Processing
**Requirement:** 1.3, 5.1

**Steps:**
1. Record voice input: "Hello Ellie, how are you?"
2. Wait for processing
3. Observe transcription

**Expected Results:**
- ✅ Audio is sent to backend
- ✅ Backend processes with OpenAI Whisper
- ✅ Transcribed text appears in conversation
- ✅ Text is accurate (or reasonably close)
- ✅ Processing completes within 5 seconds

**Status:** [ ] Pass [ ] Fail

---

### Test 10: AI Response Generation
**Requirement:** 1.3, 5.2, 6.1

**Steps:**
1. Send voice input: "What services do you offer?"
2. Wait for AI response
3. Observe response text

**Expected Results:**
- ✅ AI generates relevant response
- ✅ Response appears in conversation history
- ✅ Response is professional and appropriate
- ✅ Response avoids specific legal advice
- ✅ Response completes within 10 seconds

**Status:** [ ] Pass [ ] Fail

---

### Test 11: Text-to-Speech Output
**Requirement:** 1.4, 5.3, 7.3

**Steps:**
1. Wait for AI response to complete
2. Listen for audio output
3. Verify audio quality

**Expected Results:**
- ✅ Audio plays automatically
- ✅ Voice is clear and understandable
- ✅ Volume is appropriate
- ✅ Audio matches response text
- ✅ No audio distortion or clipping

**Status:** [ ] Pass [ ] Fail

---

### Test 12: Conversation History Display
**Requirement:** 7.5

**Steps:**
1. Have a multi-turn conversation (3-4 exchanges)
2. Observe conversation history

**Expected Results:**
- ✅ All messages are displayed in order
- ✅ User messages are visually distinct from AI messages
- ✅ Timestamps are shown (if implemented)
- ✅ Conversation scrolls properly
- ✅ Text is readable and properly formatted

**Status:** [ ] Pass [ ] Fail

---

### Test 13: Loading Indicators
**Requirement:** 7.2

**Steps:**
1. Send voice input
2. Observe loading states during:
   - Audio upload
   - Speech-to-text processing
   - AI response generation
   - Text-to-speech synthesis

**Expected Results:**
- ✅ Loading indicator appears during processing
- ✅ Indicator is visible and clear
- ✅ User knows system is working
- ✅ Indicator disappears when complete

**Status:** [ ] Pass [ ] Fail

---

### Test 14: Error Handling - Microphone Denied
**Requirement:** 7.4

**Steps:**
1. Open voice demo
2. Deny microphone permission
3. Observe error handling

**Expected Results:**
- ✅ Clear error message displayed
- ✅ Instructions for enabling microphone
- ✅ Fallback option provided (if available)
- ✅ Application doesn't crash

**Status:** [ ] Pass [ ] Fail

---

### Test 15: Error Handling - Network Issues
**Requirement:** 7.4, 5.4

**Steps:**
1. Start voice demo
2. Disconnect network or stop backend
3. Try to send voice input
4. Observe error handling

**Expected Results:**
- ✅ Error message displayed
- ✅ Message explains the issue
- ✅ Retry option available
- ✅ Application remains functional

**Status:** [ ] Pass [ ] Fail

---

### Test 16: Error Handling - API Failures
**Requirement:** 5.4, 7.4

**Steps:**
1. Configure invalid API keys in backend
2. Restart services
3. Try voice interaction
4. Observe error handling

**Expected Results:**
- ✅ Graceful error handling
- ✅ User-friendly error message
- ✅ No technical details exposed
- ✅ Fallback response provided (if implemented)

**Status:** [ ] Pass [ ] Fail

---

### Test 17: Close Demo Modal
**Requirement:** 7.5

**Steps:**
1. Open voice demo
2. Click the X button in top-right
3. Verify modal closes

**Expected Results:**
- ✅ Modal closes smoothly
- ✅ Returns to landing page
- ✅ No errors in console
- ✅ Can reopen demo successfully

**Status:** [ ] Pass [ ] Fail

---

### Test 18: Mobile Responsiveness
**Requirement:** 2.4, 3.1, 3.3

**Steps:**
1. Open landing page on mobile device or use browser dev tools
2. Test voice demo on mobile
3. Verify touch interactions

**Expected Results:**
- ✅ Landing page is mobile-friendly
- ✅ Voice demo modal fits mobile screen
- ✅ Microphone button is touch-friendly
- ✅ All features work on mobile
- ✅ Text is readable on small screens

**Status:** [ ] Pass [ ] Fail

---

### Test 19: Complex Legal Query
**Requirement:** 6.2, 6.3

**Steps:**
1. Ask a complex legal question: "I need help with a contract dispute"
2. Observe AI response
3. Check for professional referral

**Expected Results:**
- ✅ AI provides general information
- ✅ AI avoids specific legal advice
- ✅ AI suggests human consultation
- ✅ Professional referral modal may appear
- ✅ Response maintains professional tone

**Status:** [ ] Pass [ ] Fail

---

### Test 20: Multiple Concurrent Interactions
**Requirement:** 5.5

**Steps:**
1. Open voice demo in multiple browser tabs
2. Interact with Ellie in each tab
3. Verify each session is independent

**Expected Results:**
- ✅ Each tab maintains separate session
- ✅ No cross-contamination of conversations
- ✅ Backend handles concurrent requests
- ✅ No performance degradation

**Status:** [ ] Pass [ ] Fail

---

### Test 21: Privacy Controls Access
**Requirement:** Privacy features

**Steps:**
1. Click "Privacy Controls" link in footer
2. Observe privacy controls modal
3. Test privacy settings

**Expected Results:**
- ✅ Privacy controls modal opens
- ✅ Settings are displayed clearly
- ✅ Can update privacy preferences
- ✅ Changes are saved

**Status:** [ ] Pass [ ] Fail

---

### Test 22: Professional Referral System
**Requirement:** 6.2, 6.3

**Steps:**
1. Trigger professional referral (complex query)
2. Observe referral modal
3. Test referral options

**Expected Results:**
- ✅ Referral modal appears when appropriate
- ✅ Clear explanation of why referral is needed
- ✅ Options to schedule consultation
- ✅ Can close modal and continue

**Status:** [ ] Pass [ ] Fail

---

## Performance Benchmarks

### Response Time Targets
- Page load: < 3 seconds
- Voice recording start: < 500ms
- Speech-to-text: < 5 seconds
- AI response: < 10 seconds
- Text-to-speech: < 3 seconds
- Total interaction cycle: < 20 seconds

### Resource Usage
- Memory usage: Monitor for leaks during extended use
- CPU usage: Should remain reasonable during processing
- Network bandwidth: Audio files should be optimized

## Browser Compatibility

Test on the following browsers:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

## Known Issues and Limitations

Document any issues found during testing:

1. **Issue:** 
   **Impact:** 
   **Workaround:** 

2. **Issue:** 
   **Impact:** 
   **Workaround:** 

## Test Summary

**Total Tests:** 22
**Passed:** ___
**Failed:** ___
**Blocked:** ___
**Pass Rate:** ___%

**Tested By:** _______________
**Date:** _______________
**Environment:** Development / Staging / Production
**Build Version:** _______________

## Notes and Observations

[Add any additional notes, observations, or recommendations here]

## Sign-off

**Tester:** _______________ **Date:** _______________
**Reviewer:** _______________ **Date:** _______________
**Approved for Production:** [ ] Yes [ ] No

