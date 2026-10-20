import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./_core/env", () => ({
  ENV: { cookieSecret: "test-secret-".repeat(4) },
}));
vi.mock("./db", () => ({
  createVideo: vi.fn().mockResolvedValue(1),
  getVideoById: vi.fn(),
  updateVideoStatus: vi.fn(),
  createAnalysisResults: vi.fn(),
  getVideoAnalysisResults: vi
    .fn()
    .mockResolvedValue([{ content: "private transcript" }]),
}));
vi.mock("./storage", () => ({
  storagePut: vi
    .fn()
    .mockResolvedValue({ url: "https://storage.invalid/video" }),
}));
vi.mock("./_core/llm", () => ({ invokeLLM: vi.fn() }));
import { ENV } from "./_core/env";
import { storagePut } from "./storage";
import { appRouter } from "./routers";
import { getVideoById, getVideoAnalysisResults, updateVideoStatus } from "./db";
import { invokeLLM } from "./_core/llm";
import { hasVideoAccess, videoAccessToken } from "./video-access";

const video = {
  id: 1,
  storageKey: "videos/random-secret/file",
  storageUrl: "https://storage.invalid/private",
  title: "private",
  mimeType: "video/mp4",
  status: "ready",
};
const caller = appRouter.createCaller({
  user: null,
  req: { ip: "127.0.0.2", socket: {} },
  res: {},
} as TrpcContext);

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getVideoById).mockResolvedValue(
    video as Awaited<ReturnType<typeof getVideoById>>
  );
});

describe("anonymous video capabilities", () => {
  it.each([undefined, "wrong", videoAccessToken(2, video.storageKey)])(
    "denies all record operations with token %s",
    async accessToken => {
      await expect(caller.video.get({ id: 1, accessToken })).rejects.toThrow(
        "Video not found"
      );
      await expect(
        caller.analysis.results({ videoId: 1, accessToken })
      ).rejects.toThrow("Video not found");
      await expect(
        caller.analysis.analyze({ videoId: 1, accessToken })
      ).rejects.toThrow("Video not found");
      await expect(
        caller.chat.send({
          videoId: 1,
          accessToken,
          message: "read private",
          chatHistory: [],
        })
      ).rejects.toThrow("Video not found");
      expect(getVideoAnalysisResults).not.toHaveBeenCalled();
      expect(invokeLLM).not.toHaveBeenCalled();
      expect(updateVideoStatus).not.toHaveBeenCalled();
    }
  );

  it("preserves authorized anonymous reads and chat", async () => {
    const accessToken = videoAccessToken(1, video.storageKey);
    expect((await caller.video.get({ id: 1, accessToken })).title).toBe(
      "private"
    );
    expect(await caller.analysis.results({ videoId: 1, accessToken })).toEqual([
      { content: "private transcript" },
    ]);
    vi.mocked(invokeLLM).mockResolvedValue({
      choices: [{ message: { content: "answer" } }],
    } as Awaited<ReturnType<typeof invokeLLM>>);
    expect(
      (
        await caller.chat.send({
          videoId: 1,
          accessToken,
          message: "question",
          chatHistory: [],
        })
      ).content
    ).toBe("answer");
  });

  it("issues a capability only with a successful upload", async () => {
    const result = await caller.video.upload({
      filename: "clip.mp4",
      mimeType: "video/mp4",
      data: "YWJj",
      fileSize: 3,
    });
    expect(result.accessToken).toMatch(/^[a-f0-9]{64}$/);
  });

  it("binds capabilities to both ID and storage key", () => {
    const token = videoAccessToken(1, video.storageKey);
    expect(hasVideoAccess(2, video.storageKey, token)).toBe(false);
    expect(hasVideoAccess(1, "another-storage-key", token)).toBe(false);
    expect(hasVideoAccess(1, video.storageKey, token)).toBe(true);
  });
});

it.each(["", "short"])(
  "disables uploads with weak or absent signing configuration %s",
  async secret => {
    const original = ENV.cookieSecret;
    ENV.cookieSecret = secret;
    try {
      await expect(
        caller.video.upload({
          filename: "clip.mp4",
          mimeType: "video/mp4",
          data: "YWJj",
          fileSize: 3,
        })
      ).rejects.toThrow("Video access is not configured");
      expect(storagePut).not.toHaveBeenCalled();
    } finally {
      ENV.cookieSecret = original;
    }
  }
);

it("rejects a different existing record with a valid capability for video one", async () => {
  const accessToken = videoAccessToken(1, video.storageKey);
  vi.mocked(getVideoById).mockResolvedValue({
    ...video,
    id: 2,
    storageKey: "other-record",
  } as Awaited<ReturnType<typeof getVideoById>>);
  await expect(caller.video.get({ id: 2, accessToken })).rejects.toThrow(
    "Video not found"
  );
  await expect(
    caller.analysis.results({ videoId: 2, accessToken })
  ).rejects.toThrow("Video not found");
  expect(getVideoAnalysisResults).not.toHaveBeenCalled();
});
