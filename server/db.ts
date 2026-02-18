import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  videos, InsertVideo, Video,
  analysisResults, InsertAnalysisResult,
  conversations, InsertConversation,
  messages, InsertMessage,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
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
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/* ── Videos ── */
export async function createVideo(video: InsertVideo) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(videos).values(video);
  return result[0].insertId;
}

export async function getVideoById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(videos).where(eq(videos.id, id)).limit(1);
  return result[0];
}

export async function getUserVideos(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(videos).where(eq(videos.userId, userId)).orderBy(desc(videos.createdAt));
}

export async function updateVideoStatus(id: number, status: Video["status"], duration?: number) {
  const db = await getDb();
  if (!db) return;
  const updateData: Record<string, unknown> = { status };
  if (duration !== undefined) updateData.duration = duration;
  await db.update(videos).set(updateData).where(eq(videos.id, id));
}

/* ── Analysis Results ── */
export async function createAnalysisResult(result: InsertAnalysisResult) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const res = await db.insert(analysisResults).values(result);
  return res[0].insertId;
}

export async function createAnalysisResults(results: InsertAnalysisResult[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (results.length === 0) return;
  await db.insert(analysisResults).values(results);
}

export async function getVideoAnalysisResults(videoId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(analysisResults).where(eq(analysisResults.videoId, videoId)).orderBy(analysisResults.timestamp);
}

/* ── Conversations ── */
export async function createConversation(conv: InsertConversation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(conversations).values(conv);
  return result[0].insertId;
}

export async function getVideoConversation(videoId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(conversations)
    .where(and(eq(conversations.videoId, videoId), eq(conversations.userId, userId)))
    .orderBy(desc(conversations.createdAt))
    .limit(1);
  return result[0];
}

/* ── Messages ── */
export async function addMessage(msg: InsertMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(messages).values(msg);
  return result[0].insertId;
}

export async function getConversationMessages(conversationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
}
