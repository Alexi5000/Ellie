/**
 * Audio processing TypeScript interfaces and types
 * Requirements: 5.4, 6.4
 */

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