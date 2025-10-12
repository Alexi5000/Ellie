# Voice Demo Execution Guide

## Quick Start

This guide will help you test the voice interaction through the Ellie landing page demo.

## Current Status

Based on the verification check:
- ✅ Docker is installed and running
- ✅ Frontend service is running (http://localhost:3000)
- ✅ Backend service is running (http://localhost:5000)
- ✅ Redis cache is running
- ⚠️ API keys are using test values (voice features may not work with real APIs)

## Step-by-Step Testing Instructions

### 1. Access the Landing Page

1. Open your web browser (Chrome, Firefox, Edge, or Safari)
2. Navigate to: **http://localhost:3000**
3. Verify the landing page loads successfully

**Expected Result:**
- Professional landing page with Ellie branding
- Hero section with "Meet Ellie" heading
- Prominent "Try Voice Demo" button
- Features section showcasing 6 key features
- Responsive design that works on all screen sizes

### 2. Open the Voice Demo

1. Click the **"Try Voice Demo"** button (either in the hero section or demo section)
2. A legal disclaimer modal should appear

**Expected Result:**
- Legal disclaimer modal displays
- Clear explanation of AI limitations
- "Accept" and "Decline" buttons visible
- Professional and compliant messaging

### 3. Accept the Legal Disclaimer

1. Read the disclaimer
2. Click **"Accept"**

**Expected Result:**
- Disclaimer modal closes
- Voice demo modal opens
- VoiceInteractionManager component is visible
- Microphone button is displayed prominently

### 4. Grant Microphone Permission

1. Click the microphone button in the voice demo
2. Browser will request microphone permission
3. Click **"Allow"** when prompted

**Expected Result:**
- Browser permission prompt appears
- After allowing, microphone button changes state
- Visual feedback indicates system is ready to listen

**Troubleshooting:**
- If permission is denied, you'll see an error message
- To fix: Click the lock icon in browser address bar → Site settings → Allow microphone
- Refresh the page and try again

### 5. Test Voice Recording

1. Click the microphone button to start recording
2. Speak clearly: **"Hello Ellie, how are you?"**
3. Observe the visual feedback

**Expected Result:**
- Microphone button shows "listening" state (animated, different color)
- Visual indicator (waveform or pulse) appears
- Status text shows "Listening..." or similar
- Audio is being captured

### 6. Verify Speech-to-Text Processing

1. After speaking, the system should automatically process your audio
2. Watch for the "Processing..." indicator
3. Your spoken text should appear in the conversation

**Expected Result:**
- Processing indicator appears
- Transcribed text displays in conversation history
- Text is reasonably accurate
- Processing completes within 5-10 seconds

**Note:** With test API keys, this may fail or return mock responses.

### 7. Verify AI Response Generation

1. Wait for the AI to generate a response
2. Observe the response text in the conversation

**Expected Result:**
- AI response appears in conversation history
- Response is relevant to your question
- Professional tone maintained
- Response avoids specific legal advice
- Completes within 10 seconds

**Note:** With test API keys, you may get fallback responses or errors.

### 8. Verify Text-to-Speech Output

1. Listen for audio playback of the AI response
2. Verify audio quality

**Expected Result:**
- Audio plays automatically after response appears
- Voice is clear and understandable
- Volume is appropriate
- Audio matches the response text
- No distortion or clipping

**Note:** With test API keys, TTS may not work.

### 9. Test Multi-Turn Conversation

1. Continue the conversation with 2-3 more exchanges
2. Try different types of questions:
   - Simple greeting: "What can you help me with?"
   - Service inquiry: "What legal services do you offer?"
   - Complex question: "I need help with a contract dispute"

**Expected Result:**
- Each exchange works smoothly
- Conversation history displays all messages
- Context is maintained across turns
- Complex questions trigger appropriate responses or referrals

### 10. Test Error Handling

**Test A: Microphone Permission Denied**
1. Deny microphone permission
2. Verify error message is clear and helpful

**Test B: Network Issues (Optional)**
1. Disconnect network briefly
2. Try to send a message
3. Verify error handling

**Expected Result:**
- Clear error messages
- Helpful recovery instructions
- Application doesn't crash
- Can retry after fixing the issue

### 11. Test Modal Controls

1. Click the **X** button in the top-right of the demo modal
2. Verify the modal closes
3. Click "Try Voice Demo" again to reopen
4. Verify it works correctly after reopening

**Expected Result:**
- Modal closes smoothly
- Returns to landing page
- Can reopen without issues
- No console errors

### 12. Test Mobile Responsiveness (Optional)

1. Open browser developer tools (F12)
2. Toggle device toolbar (Ctrl+Shift+M or Cmd+Shift+M)
3. Select a mobile device (iPhone, Android)
4. Test the voice demo on mobile view

**Expected Result:**
- Landing page is mobile-friendly
- Voice demo modal fits mobile screen
- Microphone button is touch-friendly
- All features work on mobile
- Text is readable

## Testing with Real API Keys

To test with actual voice processing:

1. Stop the Docker containers:
   ```bash
   cd docker
   docker-compose down
   ```

2. Edit `backend/.env` and add real API keys:
   ```
   OPENAI_API_KEY=sk-your-actual-openai-key
   GROQ_API_KEY=gsk_your-actual-groq-key
   ```

3. Restart the containers:
   ```bash
   docker-compose up --build
   ```

4. Repeat the testing steps above

**With real API keys, you should see:**
- Accurate speech-to-text transcription
- Intelligent AI responses
- High-quality text-to-speech audio
- Full functionality of all features

## Verification Checklist

Use this checklist to track your testing progress:

- [ ] Landing page loads successfully
- [ ] Legal disclaimer appears when clicking "Try Voice Demo"
- [ ] Can accept disclaimer and open voice demo
- [ ] Can decline disclaimer (demo doesn't open)
- [ ] Voice demo modal displays correctly
- [ ] Microphone permission request works
- [ ] Can grant microphone permission
- [ ] Visual feedback during recording works
- [ ] Speech-to-text processing works (or shows appropriate error)
- [ ] AI response generation works (or shows appropriate error)
- [ ] Text-to-speech audio plays (or shows appropriate error)
- [ ] Conversation history displays correctly
- [ ] Loading indicators appear during processing
- [ ] Error messages are clear and helpful
- [ ] Can close and reopen demo modal
- [ ] Mobile responsiveness works
- [ ] No console errors (check browser console)

## Common Issues and Solutions

### Issue: Microphone not working
**Solution:** 
- Check browser permissions (lock icon in address bar)
- Ensure microphone is not being used by another application
- Try a different browser

### Issue: "API key not configured" errors
**Solution:**
- This is expected with test keys
- Add real API keys to `backend/.env` to test full functionality
- Or verify that mock/fallback responses are working

### Issue: Services not running
**Solution:**
```bash
cd docker
docker-compose down
docker-compose up --build
```

### Issue: Port already in use
**Solution:**
- Check if other applications are using ports 3000, 5000, or 80
- Stop conflicting services or change ports in docker-compose.yml

### Issue: Audio not playing
**Solution:**
- Check browser audio settings
- Ensure volume is not muted
- Check browser console for errors
- Verify TTS API key is configured

## Performance Expectations

With real API keys:
- Page load: < 3 seconds
- Voice recording start: < 500ms
- Speech-to-text: < 5 seconds
- AI response: < 10 seconds
- Text-to-speech: < 3 seconds
- Total interaction cycle: < 20 seconds

## Browser Console Monitoring

Keep the browser console open (F12) during testing to monitor for:
- JavaScript errors
- Network request failures
- WebSocket connection issues
- API response errors

## Test Completion

Once you've completed all the steps above:

1. Document any issues found in the test plan
2. Note which features work correctly
3. Identify any bugs or improvements needed
4. Update the tasks.md file to mark this task as complete

## Next Steps

After completing manual testing:
- Review automated test results
- Fix any identified bugs
- Optimize performance if needed
- Prepare for production deployment

## Support

If you encounter issues:
1. Check the browser console for errors
2. Review Docker container logs: `docker-compose logs`
3. Verify environment configuration
4. Consult the design and requirements documents
