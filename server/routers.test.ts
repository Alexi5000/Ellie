import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

/* ── Helpers ── */
type CookieCall = { name: string; options: Record<string, unknown> };

function createPublicContext(): { ctx: TrpcContext; clearedCookies: CookieCall[] } {
  const clearedCookies: CookieCall[] = [];
  const ctx: TrpcContext = {
    user: null, // anonymous — no auth
    req: {
      protocol: "https",
      headers: {},
      ip: "127.0.0.1",
      socket: { remoteAddress: "127.0.0.1" },
    } as unknown as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };
  return { ctx, clearedCookies };
}

/* ── Auth Router Tests ── */
describe("auth.me (public)", () => {
  it("returns null for anonymous users", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });
});

describe("auth.logout (public)", () => {
  it("clears the session cookie and reports success", async () => {
    const { ctx, clearedCookies } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
  });
});

/* ── Video Router Tests ── */
describe("video.upload (public, input validation)", () => {
  it("rejects invalid MIME types", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.video.upload({
        filename: "test.exe",
        mimeType: "application/x-msdownload",
        data: btoa("fake"),
        fileSize: 100,
      })
    ).rejects.toThrow("Unsupported video format");
  });

  it("rejects files exceeding 100MB", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.video.upload({
        filename: "huge.mp4",
        mimeType: "video/mp4",
        data: btoa("x"),
        fileSize: 200 * 1024 * 1024, // 200MB declared
      })
    ).rejects.toThrow(); // Zod validation rejects > MAX_VIDEO_SIZE
  });

  it("rejects empty filenames via Zod", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.video.upload({
        filename: "",
        mimeType: "video/mp4",
        data: btoa("test"),
        fileSize: 100,
      })
    ).rejects.toThrow();
  });
});

describe("video.get (public)", () => {
  it("returns NOT_FOUND for non-existent video", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.video.get({ id: 999999 })).rejects.toThrow("Video not found");
  });

  it("rejects negative IDs via Zod", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.video.get({ id: -1 })).rejects.toThrow();
  });
});

/* ── Chat Router Tests ── */
describe("chat.send (public, input validation)", () => {
  it("rejects empty messages", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.chat.send({ videoId: 1, message: "", chatHistory: [] })
    ).rejects.toThrow();
  });

  it("rejects messages exceeding max length", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const longMessage = "a".repeat(2001);
    await expect(
      caller.chat.send({ videoId: 1, message: longMessage, chatHistory: [] })
    ).rejects.toThrow();
  });

  it("rejects chat history exceeding 40 messages", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const history = Array.from({ length: 41 }, (_, i) => ({
      role: i % 2 === 0 ? "user" as const : "assistant" as const,
      content: "test",
    }));
    await expect(
      caller.chat.send({ videoId: 1, message: "test", chatHistory: history })
    ).rejects.toThrow();
  });
});

/* ── Voice Router Tests ── */
describe("voice.transcribe (public, input validation)", () => {
  it("rejects unsupported audio MIME types", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.voice.transcribe({ audioData: btoa("fake"), mimeType: "application/pdf" })
    ).rejects.toThrow("Unsupported audio format");
  });

  it("rejects empty audio data", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.voice.transcribe({ audioData: "", mimeType: "audio/webm" })
    ).rejects.toThrow();
  });
});

/* ── Analysis Router Tests ── */
describe("analysis.results (public)", () => {
  it("returns empty array for non-existent video", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const results = await caller.analysis.results({ videoId: 999999 });
    expect(results).toEqual([]);
  });

  it("rejects negative videoId via Zod", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.analysis.results({ videoId: -1 })).rejects.toThrow();
  });
});
