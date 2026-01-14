// src/utils/logger.js
export async function logEvent({ level = "info", service = "frontend", message, meta = {} }) {
  try {
    await fetch("https://xlsuoimvctjjvedyhewn.supabase.co/functions/v1/system-logger", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": import.meta.env.VITE_EMABIZ_LOGGER_KEY ?? "",
      },
      body: JSON.stringify({
        level,
        service,
        message,
        meta,
      }),
    });
  } catch (err) {
    console.warn("Logger failed:", err.message);
  }
}
