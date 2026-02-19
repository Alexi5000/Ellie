import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { transcribeAudio } from "./_core/voiceTranscription";
import { storagePut } from "./storage";
import {
  createVideo, getVideoById, updateVideoStatus,
  createAnalysisResults, getVideoAnalysisResults,
} from "./db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { nanoid } from "nanoid";

/* ════════════════════════════════════════════════════════════════
   SECURITY CONSTANTS
   ════════════════════════════════════════════════════════════════ */
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_AUDIO_SIZE = 16 * 1024 * 1024;  // 16MB
const MAX_MESSAGE_LENGTH = 2000;
const MAX_FILENAME_LENGTH = 255;
const ALLOWED_VIDEO_MIMES = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo", "video/avi"];
const ALLOWED_AUDIO_MIMES = ["audio/webm", "audio/mp3", "audio/wav", "audio/ogg", "audio/m4a", "audio/mpeg"];

/* ════════════════════════════════════════════════════════════════
   RATE LIMITING (in-memory, per-IP)
   ════════════════════════════════════════════════════════════════ */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, maxRequests: number, windowMs: number): void {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (entry.count >= maxRequests) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Too many requests. Please wait a moment and try again.",
    });
  }

  entry.count++;
}

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  const keysToDelete: string[] = [];
  rateLimitMap.forEach((entry, key) => {
    if (now > entry.resetAt) keysToDelete.push(key);
  });
  keysToDelete.forEach(key => rateLimitMap.delete(key));
}, 5 * 60 * 1000);

/* ════════════════════════════════════════════════════════════════
   INPUT SANITIZATION
   ════════════════════════════════════════════════════════════════ */
function sanitizeFilename(name: string): string {
  return name
    .replace(/[^\w\s.\-()]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, MAX_FILENAME_LENGTH);
}

function sanitizeMessage(msg: string): string {
  return msg.trim().slice(0, MAX_MESSAGE_LENGTH);
}

/* ════════════════════════════════════════════════════════════════
   ROUTER — ALL PUBLIC, NO AUTH REQUIRED
   ════════════════════════════════════════════════════════════════ */
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  /* ════════════════════════════════════════════════════════════════
     VIDEO MANAGEMENT — Public, anonymous uploads
     ════════════════════════════════════════════════════════════════ */
  video: router({
    upload: publicProcedure
      .input(z.object({
        filename: z.string().min(1).max(MAX_FILENAME_LENGTH),
        mimeType: z.string().min(1).max(100),
        data: z.string().min(1), // base64
        fileSize: z.number().int().positive().max(MAX_VIDEO_SIZE),
      }))
      .mutation(async ({ input, ctx }) => {
        // Rate limit: 10 uploads per 10 minutes per IP
        const ip = ctx.req.ip || ctx.req.socket.remoteAddress || "unknown";
        checkRateLimit(`upload:${ip}`, 10, 10 * 60 * 1000);

        // Validate MIME type
        if (!ALLOWED_VIDEO_MIMES.includes(input.mimeType)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Unsupported video format. Please use MP4, WebM, MOV, or AVI.",
          });
        }

        // Validate base64 data size matches declared fileSize (within tolerance)
        const buffer = Buffer.from(input.data, "base64");
        if (buffer.length > MAX_VIDEO_SIZE) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Video file is too large. Maximum size is 100MB.",
          });
        }

        const safeFilename = sanitizeFilename(input.filename);
        const sessionId = nanoid(12);
        const fileKey = `videos/anon-${sessionId}/${nanoid()}-${safeFilename}`;

        // Upload to S3
        const { url } = await storagePut(fileKey, buffer, input.mimeType);

        // Create DB record — anonymous (userId = 0)
        const videoId = await createVideo({
          userId: 0,
          title: safeFilename.replace(/\.[^.]+$/, ""),
          originalFilename: safeFilename,
          storageKey: fileKey,
          storageUrl: url,
          mimeType: input.mimeType,
          fileSize: buffer.length,
          status: "processing",
        });

        return { videoId, url };
      }),

    get: publicProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(async ({ input }) => {
        const video = await getVideoById(input.id);
        if (!video) throw new TRPCError({ code: "NOT_FOUND", message: "Video not found" });
        // Strip internal fields
        return {
          id: video.id,
          title: video.title,
          storageUrl: video.storageUrl,
          mimeType: video.mimeType,
          duration: video.duration,
          status: video.status,
        };
      }),
  }),

  /* ════════════════════════════════════════════════════════════════
     AI ANALYSIS — Public, rate-limited
     ════════════════════════════════════════════════════════════════ */
  analysis: router({
    analyze: publicProcedure
      .input(z.object({ videoId: z.number().int().positive() }))
      .mutation(async ({ input, ctx }) => {
        // Rate limit: 5 analyses per 10 minutes per IP
        const ip = ctx.req.ip || ctx.req.socket.remoteAddress || "unknown";
        checkRateLimit(`analyze:${ip}`, 5, 10 * 60 * 1000);

        const video = await getVideoById(input.videoId);
        if (!video) throw new TRPCError({ code: "NOT_FOUND", message: "Video not found" });

        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `You are Ellie, an expert AI video analysis agent. Analyze the provided video comprehensively. Return a JSON array of analysis results. Each result should have:
- type: one of "scene", "transcript", "audio", "frame", "emotion", "summary"
- timestamp: approximate seconds into the video (0 for summary)
- content: detailed description of what was found
- confidence: 0.0 to 1.0

Provide at least 8-12 diverse results covering:
1. A summary of the entire video
2. Scene descriptions with timestamps
3. Any speech/dialogue transcribed
4. Audio events (music, sounds, etc.)
5. Key frame descriptions
6. Emotional analysis of speakers/scenes

Be thorough, specific, and precise with timestamps.`,
              },
              {
                role: "user",
                content: [
                  { type: "text", text: "Analyze this video comprehensively. Provide detailed scene descriptions, transcriptions, audio events, emotional analysis, and a summary." },
                  { type: "file_url", file_url: { url: video.storageUrl, mime_type: "video/mp4" } },
                ],
              },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "video_analysis",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    results: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          type: { type: "string", enum: ["scene", "transcript", "audio", "frame", "emotion", "summary"] },
                          timestamp: { type: "number" },
                          content: { type: "string" },
                          confidence: { type: "number" },
                        },
                        required: ["type", "timestamp", "content", "confidence"],
                        additionalProperties: false,
                      },
                    },
                    duration: { type: "number" },
                  },
                  required: ["results", "duration"],
                  additionalProperties: false,
                },
              },
            },
          });

          const content = response.choices[0]?.message?.content;
          if (!content || typeof content !== "string") {
            throw new Error("Empty response from analysis service");
          }

          const parsed = JSON.parse(content);
          const analysisData = parsed.results || [];
          const duration = parsed.duration || 0;

          if (analysisData.length > 0) {
            await createAnalysisResults(
              analysisData.map((r: { type: string; timestamp: number; content: string; confidence: number }) => ({
                videoId: input.videoId,
                type: r.type as "scene" | "transcript" | "audio" | "frame" | "emotion" | "summary",
                timestamp: r.timestamp,
                content: r.content,
                confidence: r.confidence,
              }))
            );
          }

          await updateVideoStatus(input.videoId, "ready", duration);

          return { results: analysisData, duration };
        } catch (_) {
          await updateVideoStatus(input.videoId, "error");
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Video analysis failed. Please try again.",
          });
        }
      }),

    results: publicProcedure
      .input(z.object({ videoId: z.number().int().positive() }))
      .query(async ({ input }) => {
        return getVideoAnalysisResults(input.videoId);
      }),
  }),

  /* ════════════════════════════════════════════════════════════════
     CHAT — Public, anonymous, rate-limited, no DB persistence
     All chat context is sent from the client (browser-only memory)
     ════════════════════════════════════════════════════════════════ */
  chat: router({
    send: publicProcedure
      .input(z.object({
        videoId: z.number().int().positive(),
        message: z.string().min(1).max(MAX_MESSAGE_LENGTH),
        chatHistory: z.array(z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string().max(MAX_MESSAGE_LENGTH * 2),
        })).max(40).default([]),
      }))
      .mutation(async ({ input, ctx }) => {
        // Rate limit: 30 messages per 5 minutes per IP
        const ip = ctx.req.ip || ctx.req.socket.remoteAddress || "unknown";
        checkRateLimit(`chat:${ip}`, 30, 5 * 60 * 1000);

        const video = await getVideoById(input.videoId);
        if (!video) throw new TRPCError({ code: "NOT_FOUND", message: "Video not found" });

        const sanitizedMessage = sanitizeMessage(input.message);

        // Get analysis results for context
        const analysisData = await getVideoAnalysisResults(input.videoId);
        const analysisContext = analysisData.map(r =>
          `[${r.type}@${r.timestamp}s] ${r.content}`
        ).join("\n");

        // Build messages for LLM — chat history comes from browser (ephemeral)
        const llmMessages = [
          {
            role: "system" as const,
            content: `You are Ellie, an empathetic and highly intelligent AI video analysis assistant. You have analyzed a video titled "${video.title}" and have the following analysis data:

${analysisContext}

Use this analysis data to answer user questions about the video. Be specific, reference timestamps when relevant, and be conversational and warm. If the user asks about something not in the analysis, acknowledge that and provide your best inference. Always be helpful and thorough.

Guidelines:
- Reference specific timestamps (e.g., "At 0:15, ...")
- Be empathetic and conversational
- Provide detailed, specific answers
- If uncertain, say so honestly
- Remember previous messages in the conversation`,
          },
          ...input.chatHistory.slice(-20).map(m => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
          {
            role: "user" as const,
            content: sanitizedMessage,
          },
        ];

        try {
          const response = await invokeLLM({ messages: llmMessages });
          const aiContent = typeof response.choices[0]?.message?.content === "string"
            ? response.choices[0].message.content
            : "I'm sorry, I couldn't process that request. Could you try rephrasing?";

          return {
            id: nanoid(),
            role: "assistant" as const,
            content: aiContent,
            timestamp: new Date(),
          };
        } catch (_) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to generate response. Please try again.",
          });
        }
      }),
  }),

  /* ════════════════════════════════════════════════════════════════
     VOICE TRANSCRIPTION — Public, rate-limited
     ════════════════════════════════════════════════════════════════ */
  voice: router({
    transcribe: publicProcedure
      .input(z.object({
        audioData: z.string().min(1),
        mimeType: z.string().default("audio/webm"),
      }))
      .mutation(async ({ input, ctx }) => {
        // Rate limit: 20 transcriptions per 5 minutes per IP
        const ip = ctx.req.ip || ctx.req.socket.remoteAddress || "unknown";
        checkRateLimit(`voice:${ip}`, 20, 5 * 60 * 1000);

        // Validate MIME type
        if (!ALLOWED_AUDIO_MIMES.includes(input.mimeType)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Unsupported audio format.",
          });
        }

        const buffer = Buffer.from(input.audioData, "base64");

        // Validate size
        if (buffer.length > MAX_AUDIO_SIZE) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Audio file is too large. Maximum size is 16MB.",
          });
        }

        const fileKey = `audio/anon-${nanoid(8)}/${nanoid()}.webm`;
        const { url } = await storagePut(fileKey, buffer, input.mimeType);

        const result = await transcribeAudio({ audioUrl: url, language: "en" });

        if ("error" in result) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Transcription failed. Please try again.",
          });
        }

        return { text: result.text, language: result.language, duration: result.duration };
      }),
  }),
});

export type AppRouter = typeof appRouter;
