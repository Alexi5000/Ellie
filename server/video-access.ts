import { createHmac, timingSafeEqual } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { ENV } from "./_core/env";

export function videoAccessToken(videoId: number, storageKey: string): string {
  if (ENV.cookieSecret.length < 32) {
    throw new TRPCError({
      code: "SERVICE_UNAVAILABLE",
      message: "Video access is not configured",
    });
  }
  return createHmac("sha256", ENV.cookieSecret)
    .update(JSON.stringify(["ellie-video-access-v1", videoId, storageKey]))
    .digest("hex");
}

export function hasVideoAccess(
  videoId: number,
  storageKey: string,
  supplied?: string
): boolean {
  if (!supplied || !/^[a-f0-9]{64}$/.test(supplied)) return false;
  const expected = videoAccessToken(videoId, storageKey);
  return timingSafeEqual(
    Buffer.from(supplied, "hex"),
    Buffer.from(expected, "hex")
  );
}
