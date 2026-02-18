import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { transcribeAudio } from "./_core/voiceTranscription";
import { storagePut } from "./storage";
import {
  createVideo, getVideoById, getUserVideos, updateVideoStatus,
  createAnalysisResults, getVideoAnalysisResults,
  createConversation, getVideoConversation,
  addMessage, getConversationMessages,
} from "./db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { nanoid } from "nanoid";

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
     VIDEO MANAGEMENT
     ════════════════════════════════════════════════════════════════ */
  video: router({
    /** Upload a video — receives base64 data, stores to S3, creates DB record */
    upload: protectedProcedure
      .input(z.object({
        filename: z.string(),
        mimeType: z.string(),
        data: z.string(), // base64
        fileSize: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const buffer = Buffer.from(input.data, "base64");
        const fileKey = `videos/${ctx.user.id}/${nanoid()}-${input.filename}`;

        // Upload to S3
        const { url } = await storagePut(fileKey, buffer, input.mimeType);

        // Create DB record
        const videoId = await createVideo({
          userId: ctx.user.id,
          title: input.filename.replace(/\.[^.]+$/, ""),
          originalFilename: input.filename,
          storageKey: fileKey,
          storageUrl: url,
          mimeType: input.mimeType,
          fileSize: input.fileSize,
          status: "processing",
        });

        return { videoId, url };
      }),

    /** Get a specific video */
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const video = await getVideoById(input.id);
        if (!video) throw new TRPCError({ code: "NOT_FOUND", message: "Video not found" });
        return video;
      }),

    /** List user's videos */
    list: protectedProcedure.query(async ({ ctx }) => {
      return getUserVideos(ctx.user.id);
    }),
  }),

  /* ════════════════════════════════════════════════════════════════
     AI ANALYSIS
     ════════════════════════════════════════════════════════════════ */
  analysis: router({
    /** Analyze a video using multimodal LLM */
    analyze: protectedProcedure
      .input(z.object({ videoId: z.number() }))
      .mutation(async ({ input }) => {
        const video = await getVideoById(input.videoId);
        if (!video) throw new TRPCError({ code: "NOT_FOUND", message: "Video not found" });

        try {
          // Call LLM with video file for multimodal analysis
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
            throw new Error("Empty LLM response");
          }

          const parsed = JSON.parse(content);
          const analysisData = parsed.results || [];
          const duration = parsed.duration || 0;

          // Save results to DB
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

          // Update video status
          await updateVideoStatus(input.videoId, "ready", duration);

          return { results: analysisData, duration };
        } catch (error) {
          console.error("[Analysis] Failed:", error);
          await updateVideoStatus(input.videoId, "error");
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error instanceof Error ? error.message : "Analysis failed",
          });
        }
      }),

    /** Get analysis results for a video */
    results: protectedProcedure
      .input(z.object({ videoId: z.number() }))
      .query(async ({ input }) => {
        return getVideoAnalysisResults(input.videoId);
      }),
  }),

  /* ════════════════════════════════════════════════════════════════
     CHAT / CONVERSATION
     ════════════════════════════════════════════════════════════════ */
  chat: router({
    /** Send a message and get AI response about the video */
    send: protectedProcedure
      .input(z.object({
        videoId: z.number(),
        message: z.string(),
        messageType: z.enum(["text", "voice"]).default("text"),
      }))
      .mutation(async ({ input, ctx }) => {
        const video = await getVideoById(input.videoId);
        if (!video) throw new TRPCError({ code: "NOT_FOUND", message: "Video not found" });

        // Get or create conversation
        let conversation = await getVideoConversation(input.videoId, ctx.user.id);
        let conversationId: number;

        if (!conversation) {
          conversationId = await createConversation({
            videoId: input.videoId,
            userId: ctx.user.id,
            title: video.title,
          });
        } else {
          conversationId = conversation.id;
        }

        // Save user message
        await addMessage({
          conversationId,
          role: "user",
          content: input.message,
          messageType: input.messageType,
        });

        // Get conversation history for context
        const history = await getConversationMessages(conversationId);

        // Get analysis results for context
        const analysisData = await getVideoAnalysisResults(input.videoId);
        const analysisContext = analysisData.map(r =>
          `[${r.type}@${r.timestamp}s] ${r.content}`
        ).join("\n");

        // Build messages for LLM
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
          ...history.slice(-20).map(m => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
        ];

        // Get AI response
        const response = await invokeLLM({ messages: llmMessages });
        const aiContent = typeof response.choices[0]?.message?.content === "string"
          ? response.choices[0].message.content
          : "I'm sorry, I couldn't process that request. Could you try rephrasing?";

        // Save AI response
        await addMessage({
          conversationId,
          role: "assistant",
          content: aiContent,
          messageType: "text",
        });

        return {
          id: Date.now().toString(),
          role: "assistant" as const,
          content: aiContent,
          timestamp: new Date(),
        };
      }),

    /** Get conversation history for a video */
    history: protectedProcedure
      .input(z.object({ videoId: z.number() }))
      .query(async ({ input, ctx }) => {
        const conversation = await getVideoConversation(input.videoId, ctx.user.id);
        if (!conversation) return [];
        return getConversationMessages(conversation.id);
      }),
  }),

  /* ════════════════════════════════════════════════════════════════
     VOICE TRANSCRIPTION
     ════════════════════════════════════════════════════════════════ */
  voice: router({
    /** Upload audio and transcribe it */
    transcribe: protectedProcedure
      .input(z.object({
        audioData: z.string(), // base64
        mimeType: z.string().default("audio/webm"),
      }))
      .mutation(async ({ input, ctx }) => {
        // Upload audio to S3 first
        const buffer = Buffer.from(input.audioData, "base64");
        const fileKey = `audio/${ctx.user.id}/${nanoid()}.webm`;
        const { url } = await storagePut(fileKey, buffer, input.mimeType);

        // Transcribe
        const result = await transcribeAudio({ audioUrl: url, language: "en" });

        if ("error" in result) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: result.error,
          });
        }

        return { text: result.text, language: result.language, duration: result.duration };
      }),
  }),
});

export type AppRouter = typeof appRouter;
