"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestEnvironmentHelper = exports.TestTimeoutHelper = exports.MockAPIHelper = exports.TestIsolationHelper = void 0;
const globals_1 = require("@jest/globals");
class TestIsolationHelper {
    static setupTestSuite() {
        beforeEach(async () => {
            await this.cleanupBeforeTest();
        });
        afterEach(async () => {
            await this.cleanupAfterTest();
        });
        afterAll(async () => {
            await this.finalCleanup();
        });
    }
    static async cleanupBeforeTest() {
        this.activeTimers.forEach(timer => clearTimeout(timer));
        this.activeIntervals.forEach(interval => clearInterval(interval));
        this.activeTimers.clear();
        this.activeIntervals.clear();
        globals_1.jest.clearAllMocks();
        globals_1.jest.clearAllTimers();
        if (global.resetRateLimitCounts) {
            global.resetRateLimitCounts();
        }
        if (global.disableRateLimiting) {
            global.disableRateLimiting();
        }
        await new Promise(resolve => setImmediate(resolve));
    }
    static async cleanupAfterTest() {
        this.activeTimers.forEach(timer => clearTimeout(timer));
        this.activeIntervals.forEach(interval => clearInterval(interval));
        this.activeTimers.clear();
        this.activeIntervals.clear();
        globals_1.jest.clearAllMocks();
        globals_1.jest.clearAllTimers();
        await new Promise(resolve => setImmediate(resolve));
        await new Promise(resolve => setTimeout(resolve, 10));
    }
    static async finalCleanup() {
        this.activeTimers.forEach(timer => clearTimeout(timer));
        this.activeIntervals.forEach(interval => clearInterval(interval));
        this.activeTimers.clear();
        this.activeIntervals.clear();
        this.mockInstances.clear();
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    static trackTimer(timer) {
        this.activeTimers.add(timer);
        return timer;
    }
    static trackInterval(interval) {
        this.activeIntervals.add(interval);
        return interval;
    }
    static registerMockInstance(name, instance) {
        this.mockInstances.set(name, instance);
    }
    static getMockInstance(name) {
        return this.mockInstances.get(name);
    }
}
exports.TestIsolationHelper = TestIsolationHelper;
TestIsolationHelper.activeTimers = new Set();
TestIsolationHelper.activeIntervals = new Set();
TestIsolationHelper.mockInstances = new Map();
class MockAPIHelper {
    static createMockOpenAIResponse(content = 'Mock OpenAI response') {
        return {
            choices: [{
                    message: {
                        content,
                        role: 'assistant'
                    },
                    finish_reason: 'stop',
                    index: 0
                }],
            usage: {
                prompt_tokens: 10,
                completion_tokens: 20,
                total_tokens: 30
            }
        };
    }
    static createMockGroqResponse(content = 'Mock Groq response') {
        return {
            choices: [{
                    message: {
                        content,
                        role: 'assistant'
                    },
                    finish_reason: 'stop',
                    index: 0
                }],
            usage: {
                prompt_tokens: 8,
                completion_tokens: 15,
                total_tokens: 23
            }
        };
    }
    static createMockTTSResponse(size = 1024) {
        return {
            arrayBuffer: globals_1.jest.fn(() => Promise.resolve(new ArrayBuffer(size)))
        };
    }
    static createMockTranscriptionResponse(text = 'Mock transcription') {
        return {
            text,
            language: 'en',
            duration: 2.5,
            segments: []
        };
    }
}
exports.MockAPIHelper = MockAPIHelper;
class TestTimeoutHelper {
    static delay(ms) {
        return new Promise(resolve => {
            const timer = setTimeout(resolve, ms);
            TestIsolationHelper.trackTimer(timer);
        });
    }
    static timeout(promise, ms) {
        return Promise.race([
            promise,
            new Promise((_, reject) => {
                const timer = setTimeout(() => reject(new Error(`Test timeout after ${ms}ms`)), ms);
                TestIsolationHelper.trackTimer(timer);
            })
        ]);
    }
    static async waitFor(condition, options = {}) {
        const { timeout = 5000, interval = 100 } = options;
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            if (await condition()) {
                return;
            }
            await this.delay(interval);
        }
        throw new Error(`Condition not met within ${timeout}ms`);
    }
}
exports.TestTimeoutHelper = TestTimeoutHelper;
class TestEnvironmentHelper {
    static setEnvVars(vars) {
        Object.keys(vars).forEach(key => {
            if (!(key in this.originalEnv)) {
                this.originalEnv[key] = process.env[key];
            }
            process.env[key] = vars[key];
        });
    }
    static restoreEnvVars() {
        Object.keys(this.originalEnv).forEach(key => {
            if (this.originalEnv[key] === undefined) {
                delete process.env[key];
            }
            else {
                process.env[key] = this.originalEnv[key];
            }
        });
        this.originalEnv = {};
    }
    static setupTestEnvironment(vars) {
        beforeAll(() => {
            this.setEnvVars(vars);
        });
        afterAll(() => {
            this.restoreEnvVars();
        });
    }
}
exports.TestEnvironmentHelper = TestEnvironmentHelper;
TestEnvironmentHelper.originalEnv = {};
//# sourceMappingURL=testHelpers.js.map