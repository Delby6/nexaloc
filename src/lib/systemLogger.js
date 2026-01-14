// src/lib/systemLogger.js
import { supabase } from "@/lib/supabaseClient";

const DEFAULT_SERVICE = "frontend";

/**
 * Core logger.
 * Safe to call anywhere in the client – it never throws.
 */
export async function logEvent({
  level = "info",
  service = DEFAULT_SERVICE,
  message,
  meta = {},
}) {
  try {
    if (!message) return;

    const { error } = await supabase.from("system_logs").insert({
      level,
      service,
      message,
      meta,
    });

    if (error) {
      // Don't crash the app – just log to console
      console.error("[systemLogger] Failed to insert log:", error);
    }
  } catch (err) {
    console.error("[systemLogger] Unexpected logger error:", err);
  }
}

// Convenience helpers
export const logInfo = (args) => logEvent({ ...args, level: "info" });
export const logWarning = (args) => logEvent({ ...args, level: "warning" });
export const logError = (args) => logEvent({ ...args, level: "error" });

/**
 * Helper for service health checks (API / AI / Supabase / etc.)
 */
export function logServiceCheck({ service, ok, ms, code }) {
  const level = ok ? "info" : "error";
  const message = ok
    ? `${service} heartbeat OK (${ms}ms, code=${code})`
    : `${service} heartbeat FAILED (${ms}ms, code=${code})`;

  // fire-and-forget; errors handled inside logEvent
  logEvent({
    level,
    service,
    message,
    meta: { ms, code, ok },
  });
}
