export interface AudioInput {
    buffer: Buffer;
    format: string;
    duration: number;
    sampleRate: number;
}
export interface AudioResponse {
    text: string;
    audioBuffer: Buffer;
    confidence: number;
    processingTime: number;
}
//# sourceMappingURL=audio.d.ts.map