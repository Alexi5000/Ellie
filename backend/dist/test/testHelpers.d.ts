export declare class TestIsolationHelper {
    private static activeTimers;
    private static activeIntervals;
    private static mockInstances;
    static setupTestSuite(): void;
    static cleanupBeforeTest(): Promise<void>;
    static cleanupAfterTest(): Promise<void>;
    static finalCleanup(): Promise<void>;
    static trackTimer(timer: NodeJS.Timeout): NodeJS.Timeout;
    static trackInterval(interval: NodeJS.Timeout): NodeJS.Timeout;
    static registerMockInstance(name: string, instance: any): void;
    static getMockInstance(name: string): any;
}
export declare class MockAPIHelper {
    static createMockOpenAIResponse(content?: string): {
        choices: {
            message: {
                content: string;
                role: string;
            };
            finish_reason: string;
            index: number;
        }[];
        usage: {
            prompt_tokens: number;
            completion_tokens: number;
            total_tokens: number;
        };
    };
    static createMockGroqResponse(content?: string): {
        choices: {
            message: {
                content: string;
                role: string;
            };
            finish_reason: string;
            index: number;
        }[];
        usage: {
            prompt_tokens: number;
            completion_tokens: number;
            total_tokens: number;
        };
    };
    static createMockTTSResponse(size?: number): {
        arrayBuffer: import("jest-mock").Mock<() => Promise<ArrayBuffer>>;
    };
    static createMockTranscriptionResponse(text?: string): {
        text: string;
        language: string;
        duration: number;
        segments: never[];
    };
}
export declare class TestTimeoutHelper {
    static delay(ms: number): Promise<void>;
    static timeout<T>(promise: Promise<T>, ms: number): Promise<T>;
    static waitFor(condition: () => boolean | Promise<boolean>, options?: {
        timeout?: number;
        interval?: number;
    }): Promise<void>;
}
export declare class TestEnvironmentHelper {
    private static originalEnv;
    static setEnvVars(vars: Record<string, string>): void;
    static restoreEnvVars(): void;
    static setupTestEnvironment(vars: Record<string, string>): void;
}
//# sourceMappingURL=testHelpers.d.ts.map