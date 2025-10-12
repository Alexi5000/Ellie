# Ellie Voice Receptionist - Testing Documentation

## Quick Links

- 🚀 **[Quick Start](#quick-start)** - Get testing in 5 minutes
- 📋 **[Test Plan](VOICE_DEMO_TEST_PLAN.md)** - 22 detailed test scenarios
- 📖 **[Execution Guide](VOICE_DEMO_EXECUTION_GUIDE.md)** - Step-by-step instructions
- 📊 **[Test Report Template](VOICE_DEMO_TEST_REPORT.md)** - Document your results
- 📝 **[Testing Summary](TESTING_SUMMARY.md)** - Complete overview

## Quick Start

### 1. Verify Services (30 seconds)

```powershell
powershell -ExecutionPolicy Bypass -File .kiro/specs/ellie-voice-receptionist/quick-check.ps1
```

**Expected Output:**
```
Checking Frontend (http://localhost:3000)... OK
Checking Backend (http://localhost:5000/health)... OK

All systems are GO!
```

### 2. Test the Demo (5 minutes)

1. Open your browser
2. Navigate to: **http://localhost:3000**
3. Click **"Try Voice Demo"**
4. Accept the legal disclaimer
5. Grant microphone permissions
6. Click the microphone button and speak: "Hello Ellie"

### 3. Follow the Guide (Optional)

For comprehensive testing, follow: **[VOICE_DEMO_EXECUTION_GUIDE.md](VOICE_DEMO_EXECUTION_GUIDE.md)**

## Testing Resources

### Documentation

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **[VOICE_DEMO_TEST_PLAN.md](VOICE_DEMO_TEST_PLAN.md)** | Comprehensive test scenarios | Full testing cycle |
| **[VOICE_DEMO_EXECUTION_GUIDE.md](VOICE_DEMO_EXECUTION_GUIDE.md)** | Step-by-step instructions | Manual testing |
| **[VOICE_DEMO_TEST_REPORT.md](VOICE_DEMO_TEST_REPORT.md)** | Results documentation | Recording findings |
| **[TESTING_SUMMARY.md](TESTING_SUMMARY.md)** | Overview and status | Understanding setup |
| **[TASK_COMPLETION_VOICE_DEMO_TESTING.md](TASK_COMPLETION_VOICE_DEMO_TESTING.md)** | Task completion details | Reference |

### Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| **quick-check.ps1** | Quick service verification | `powershell -ExecutionPolicy Bypass -File quick-check.ps1` |
| **verify-voice-demo.ps1** | Comprehensive verification | `powershell -ExecutionPolicy Bypass -File verify-voice-demo.ps1` |

## Current Status

✅ **Services Running:**
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Redis: Running
- Docker: Active

⚠️ **API Configuration:**
- Using test API keys
- Voice features may show mock responses
- Configure real keys for full functionality

## Test Coverage

**22 Test Scenarios** covering:
- ✅ Landing page functionality (3 tests)
- ✅ Legal compliance (3 tests)
- ✅ Voice interaction (6 tests)
- ✅ Error handling (3 tests)
- ✅ UI/UX (3 tests)
- ✅ Mobile responsiveness (2 tests)
- ✅ Additional features (2 tests)

**100% Requirements Coverage:**
- All 25 acceptance criteria testable
- All 7 user stories covered

## Testing Workflows

### Workflow 1: Quick Smoke Test (5 minutes)

```
1. Run quick-check.ps1
2. Open http://localhost:3000
3. Test basic voice demo
4. Verify core functionality works
```

### Workflow 2: Comprehensive Test (30-60 minutes)

```
1. Run verify-voice-demo.ps1
2. Open VOICE_DEMO_EXECUTION_GUIDE.md
3. Execute all 12 test procedures
4. Document results in VOICE_DEMO_TEST_REPORT.md
```

### Workflow 3: Full Test Cycle (2-3 hours)

```
1. Run comprehensive verification
2. Follow VOICE_DEMO_TEST_PLAN.md
3. Execute all 22 test scenarios
4. Test on multiple browsers
5. Test on mobile devices
6. Complete full test report
7. Document all issues found
```

## Testing with Real API Keys

### Why Test with Real Keys?

With test keys, you'll see:
- ⚠️ Mock responses or errors
- ⚠️ Limited voice functionality
- ⚠️ API error messages

With real keys, you'll get:
- ✅ Actual speech-to-text transcription
- ✅ Intelligent AI responses
- ✅ High-quality text-to-speech audio
- ✅ Full feature functionality

### How to Configure Real Keys

1. **Stop services:**
   ```bash
   cd docker
   docker-compose down
   ```

2. **Edit `backend/.env`:**
   ```env
   OPENAI_API_KEY=sk-your-actual-openai-key
   GROQ_API_KEY=gsk_your-actual-groq-key
   ```

3. **Restart services:**
   ```bash
   docker-compose up --build
   ```

4. **Test again** - Full functionality should work

## Troubleshooting

### Services Not Running

```bash
cd docker
docker-compose up --build
```

### Microphone Not Working

1. Check browser permissions (lock icon in address bar)
2. Ensure microphone not in use by another app
3. Try a different browser

### API Errors

- Expected with test keys
- Configure real API keys for full functionality
- Check backend logs: `docker-compose logs backend`

### Port Conflicts

- Check if ports 3000, 5000, or 80 are in use
- Stop conflicting services
- Or modify ports in docker-compose.yml

## Browser Compatibility

Recommended browsers:
- ✅ Chrome (latest) - Full support
- ✅ Firefox (latest) - Full support
- ✅ Edge (latest) - Full support
- ✅ Safari (latest) - Full support

## Requirements Mapping

| Requirement | Test Scenarios | Status |
|-------------|----------------|--------|
| **Req 1:** Voice interaction | Tests 3.1-3.6 | ✅ Testable |
| **Req 2:** Professional landing page | Tests 1.1-1.3 | ✅ Testable |
| **Req 3:** Mobile optimization | Tests 6.1-6.2 | ✅ Testable |
| **Req 4:** Docker deployment | Verified by scripts | ✅ Testable |
| **Req 5:** Backend API | Tests 3.4-3.6, 4.2-4.3 | ✅ Testable |
| **Req 6:** Legal compliance | Tests 2.1-2.3 | ✅ Testable |
| **Req 7:** Intuitive interaction | Tests 3.1-3.3, 5.1-5.3 | ✅ Testable |

## Getting Help

1. **Check browser console** (F12) for errors
2. **Review Docker logs:** `docker-compose logs`
3. **Consult execution guide** troubleshooting section
4. **Review requirements** and design documents

## Next Steps

1. ✅ Services verified - COMPLETE
2. ✅ Testing infrastructure created - COMPLETE
3. ⏳ Execute manual tests - **YOUR ACTION REQUIRED**
4. ⏳ Document results - **YOUR ACTION REQUIRED**
5. ⏳ Fix any issues found - Future
6. ⏳ Deploy to production - Future

## Summary

**Status:** ✅ Ready for Testing

All testing infrastructure is complete and services are running. You can now:

1. **Quick test:** Run `quick-check.ps1` and test at http://localhost:3000
2. **Full test:** Follow `VOICE_DEMO_EXECUTION_GUIDE.md`
3. **Document:** Use `VOICE_DEMO_TEST_REPORT.md`

**Start testing now:** http://localhost:3000

---

**Last Updated:** [Current Date]  
**Version:** 1.0  
**Status:** Ready for Manual Testing
