"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: '.env.test' });
jest.mock('openai');
jest.mock('groq-sdk');
jest.mock('redis', () => ({
    createClient: jest.fn(() => ({
        connect: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn().mockResolvedValue(undefined),
        on: jest.fn(),
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue('OK'),
        del: jest.fn().mockResolvedValue(1),
        exists: jest.fn().mockResolvedValue(0),
        expire: jest.fn().mockResolvedValue(1),
        isReady: false,
        isOpen: false
    }))
}));
jest.setTimeout(10000);
afterAll(async () => {
    jest.clearAllTimers();
    await new Promise(resolve => setTimeout(resolve, 100));
});
//# sourceMappingURL=setup.js.map