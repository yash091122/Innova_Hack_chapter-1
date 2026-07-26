/**
 * VerifAI — SSE Stream Store
 * In-memory per-session event emitter for Server-Sent Events fanout.
 *
 * NOTE: This works for single-instance deployments (local dev, single-server prod).
 * For multi-instance production, replace with Redis pub/sub.
 */

import { EventEmitter } from "events";
import type { SSEEvent } from "@/types";

// Global map: sessionId → EventEmitter
const streamStore = new Map<string, EventEmitter>();

// Maximum listeners per session (prevent memory leak warnings)
const MAX_LISTENERS = 10;

// Auto-cleanup: remove sessions after 30 minutes of inactivity
const SESSION_TTL_MS = 30 * 60 * 1000;
const cleanupTimers = new Map<string, NodeJS.Timeout>();

/**
 * Get or create an EventEmitter for a session.
 */
function getOrCreateEmitter(sessionId: string): EventEmitter {
  if (!streamStore.has(sessionId)) {
    const emitter = new EventEmitter();
    emitter.setMaxListeners(MAX_LISTENERS);
    streamStore.set(sessionId, emitter);
  }

  // Reset cleanup timer
  const existing = cleanupTimers.get(sessionId);
  if (existing) clearTimeout(existing);
  cleanupTimers.set(
    sessionId,
    setTimeout(() => {
      streamStore.delete(sessionId);
      cleanupTimers.delete(sessionId);
    }, SESSION_TTL_MS)
  );

  return streamStore.get(sessionId)!;
}

/**
 * Emit an SSE event for a session.
 * Called by pipeline agents to broadcast progress to connected clients.
 */
export function emitEvent(sessionId: string, event: SSEEvent): void {
  const emitter = getOrCreateEmitter(sessionId);
  emitter.emit("event", event);
}

/**
 * Subscribe to SSE events for a session.
 * Returns an unsubscribe function.
 */
export function subscribeToSession(
  sessionId: string,
  callback: (event: SSEEvent) => void
): () => void {
  const emitter = getOrCreateEmitter(sessionId);
  emitter.on("event", callback);

  return () => {
    emitter.off("event", callback);
    // If no more listeners, clean up
    if (emitter.listenerCount("event") === 0) {
      const timer = cleanupTimers.get(sessionId);
      if (timer) {
        clearTimeout(timer);
        cleanupTimers.set(
          sessionId,
          setTimeout(() => {
            streamStore.delete(sessionId);
            cleanupTimers.delete(sessionId);
          }, 60000) // Keep 1 more minute for late reconnects
        );
      }
    }
  };
}

/**
 * Check if a session has an active emitter.
 */
export function hasSession(sessionId: string): boolean {
  return streamStore.has(sessionId);
}

/**
 * Helper: create a standardized SSE event with current timestamp.
 */
export function createEvent(
  sessionId: string,
  partial: Omit<SSEEvent, "sessionId" | "timestamp">
): SSEEvent {
  return {
    ...partial,
    sessionId,
    timestamp: new Date().toISOString(),
  };
}
