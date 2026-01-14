import fetch from "node-fetch";

const LOGGER_URL = "https://xlsuoimvctjjvedyhewn.functions.supabase.co/system-logger";
const LOGGER_SECRET = process.env.EMABIZ_LOGGER_KEY || ""; // optional protection

export async function logInfo(message, meta = {}, service = "server") {
  return sendLog("info", message, meta, service);
}

export async function logWarn(message, meta = {}, service = "server") {
  return sendLog("warn", message, meta, service);
}

export async function logError(message, meta = {}, service = "server") {
  return sendLog("error", message, meta, service);
}

async function sendLog(level, message, meta, service) {
  try {
    await fetch(LOGGER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": LOGGER_SECRET,
      },
      body: JSON.stringify({
        level,
        service,
        message,
        meta,
      }),
    });
  } catch (err) {
    console.error("Failed to send log:", err);
  }
}
