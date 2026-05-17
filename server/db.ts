import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  videos, InsertVideo, Video,
  analysisResults, InsertAnalysisResult,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && ENV.databaseUrl) {
    try {
      _db = drizzle(ENV.databaseUrl);
    } catch {
      _db = null;
    }
  }
  return _db;
}

export type DependencyReadiness = {
  name: string;
  configured: boolean;
  healthy: boolean;
  critical: boolean;
  message: string;
  latencyMs?: number;
};

export async function checkDatabaseReadiness(): Promise<DependencyReadiness> {
  if (!ENV.databaseUrl) {
    return {
      name: "database",
      configured: false,
      healthy: false,
      critical: true,
      message: "DATABASE_URL is not configured.",
    };
  }

  const startedAt = Date.now();

  try {
    const db = await getDb();

    if (!db) {
      return {
        name: "database",
        configured: true,
        healthy: false,
        critical: true,
        message: "Database client could not be initialized.",
      };
    }

    await db.execute(sql`select 1 as ok`);

    return {
      name: "database",
      configured: true,
      healthy: true,
      critical: true,
      message: "Database connection is reachable.",
      latencyMs: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      name: "database",
      configured: true,
      healthy: false,
      critical: true,
      message: error instanceof Error ? error.message : "Database readiness check failed.",
      latencyMs: Date.now() - startedAt,
    };
  }
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];

  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };

  textFields.forEach(assignNullable);

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = 'admin';
    updateSet.role = 'admin';
  }

  if (!values.lastSignedIn) {
    values.lastSignedIn = new Date();
  }

  if (Object.keys(updateSet).length === 0) {
    updateSet.lastSignedIn = new Date();
  }

  await db.insert(users).values(values).onDuplicateKeyUpdate({
    set: updateSet,
  });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/* ── Videos ── */
export async function createVideo(video: InsertVideo) {
  const db = await getDb();
  if (!db) throw new Error("Service temporarily unavailable");
  const result = await db.insert(videos).values(video);
  return result[0].insertId;
}

export async function getVideoById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(videos).where(eq(videos.id, id)).limit(1);
  return result[0];
}

export async function updateVideoStatus(id: number, status: Video["status"], duration?: number) {
  const db = await getDb();
  if (!db) return;
  const updateData: Record<string, unknown> = { status };
  if (duration !== undefined) updateData.duration = duration;
  await db.update(videos).set(updateData).where(eq(videos.id, id));
}

/* ── Analysis Results ── */
export async function createAnalysisResults(results: InsertAnalysisResult[]) {
  const db = await getDb();
  if (!db) throw new Error("Service temporarily unavailable");
  if (results.length === 0) return;
  await db.insert(analysisResults).values(results);
}

export async function getVideoAnalysisResults(videoId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(analysisResults).where(eq(analysisResults.videoId, videoId)).orderBy(analysisResults.timestamp);
}
